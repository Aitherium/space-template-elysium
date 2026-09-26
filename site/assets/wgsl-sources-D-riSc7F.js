const e=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct ConvP {
  n_tokens : u32,
  channels : u32,
  kernel   : u32,   // ssm.conv_kernel
  _p0 : u32,
};

@group(0) @binding(0) var<storage, read>       x       : array<f32>;   // [n_tokens * channels]
@group(0) @binding(1) var<storage, read>       weight  : array<f32>;   // [channels * kernel]
@group(0) @binding(2) var<storage, read>       bias    : array<f32>;   // [channels]
@group(0) @binding(3) var<storage, read_write> out     : array<f32>;   // [n_tokens * channels]
@group(0) @binding(4) var<uniform>             p       : ConvP;

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let idx = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;
  let total = p.n_tokens * p.channels;
  if (idx >= total) { return; }
  let token = idx / p.channels;
  let ch    = idx % p.channels;

  var sum : f32 = bias[ch];
  for (var kk : u32 = 0u; kk < p.kernel; kk = kk + 1u) {
    let offset = i32(token) - i32(p.kernel - 1u - kk);
    if (offset >= 0) {
      let xv = x[u32(offset) * p.channels + ch];
      sum = sum + xv * weight[ch * p.kernel + kk];
    }
  }
  out[idx] = sum;   // activation applied by caller (SiLU) per fork ordering
}
`,n=`// ============================================================================

struct DeltaP {
  d_k   : u32,
  d_v   : u32,
  head  : u32,
  _p0   : u32,
};

@group(0) @binding(0) var<storage, read>        q     : array<f32>;   // [d_k]
@group(0) @binding(1) var<storage, read>        k     : array<f32>;   // [d_k]
@group(0) @binding(2) var<storage, read>        v     : array<f32>;   // [d_v]
@group(0) @binding(3) var<storage, read>        g     : array<f32>;   // [d_k] gate (diag)
@group(0) @binding(4) var<storage, read>        beta  : array<f32>;   // [1] scalar beta
@group(0) @binding(5) var<storage, read_write>  state : array<f32>;   // [d_k * d_v] persisted S
@group(0) @binding(6) var<storage, read_write>  out   : array<f32>;   // [d_v]
@group(0) @binding(7) var<uniform>              p     : DeltaP;

@compute @workgroup_size(1)
fn main() {
  let dk = p.d_k;
  let dv = p.d_v;
  let b  = beta[0];

  var err : array<f32, 256>;   // d_v <= 256
  for (var j : u32 = 0u; j < dv; j = j + 1u) {
    var sTk : f32 = 0.0;
    for (var i : u32 = 0u; i < dk; i = i + 1u) {
      sTk = sTk + state[i * dv + j] * k[i];
    }
    err[j] = v[j] - sTk;
  }

  var o : array<f32, 256>;
  for (var j : u32 = 0u; j < dv; j = j + 1u) { o[j] = 0.0; }

  for (var i : u32 = 0u; i < dk; i = i + 1u) {
    let gi = g[i];
    let ki = k[i];
    let qi = q[i];
    for (var j : u32 = 0u; j < dv; j = j + 1u) {
      let s_new = state[i * dv + j] * gi + b * ki * err[j];
      state[i * dv + j] = s_new;
      o[j] = o[j] + s_new * qi;   // accumulate S^T q with the updated state
    }
  }

  for (var j : u32 = 0u; j < dv; j = j + 1u) { out[j] = o[j]; }
}
`,r=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct GateP { n_tokens : u32, heads : u32, _p0 : u32, _p1 : u32 };

@group(0) @binding(0) var<storage, read>        alpha_raw : array<f32>;   // [n_tokens*H]
@group(0) @binding(1) var<storage, read>        beta_raw  : array<f32>;   // [n_tokens*H]
@group(0) @binding(2) var<storage, read>        a_log     : array<f32>;   // [H]
@group(0) @binding(3) var<storage, read>        dt_bias   : array<f32>;   // [H]
@group(0) @binding(4) var<storage, read_write>  g_out     : array<f32>;   // [n_tokens*H]
@group(0) @binding(5) var<storage, read_write>  beta_out  : array<f32>;   // [n_tokens*H]
@group(0) @binding(6) var<uniform>              p         : GateP;

fn softplus(x : f32) -> f32 {
  return max(x, 0.0) + log(1.0 + exp(-abs(x)));
}

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let idx = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;
  let total = p.n_tokens * p.heads;
  if (idx >= total) { return; }
  let h = idx % p.heads;

  let sp = softplus(alpha_raw[idx] + dt_bias[h]);
  let a  = a_log[h] * sp;            // <= 0 (a_log holds -exp(A_log) pre-baked)
  g_out[idx]    = exp(a);            // (0,1]
  beta_out[idx] = 1.0 / (1.0 + exp(-beta_raw[idx]));
}
`,t=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct SeqP {
  n_tokens  : u32,
  v_heads   : u32,   // num_v_heads (48)
  k_heads   : u32,   // num_k_heads (16)
  head_dim  : u32,   // d_k == d_v (128)
  v_per_k   : u32,   // v_heads / k_heads (3)
  _p0 : u32, _p1 : u32, _p2 : u32,
};

@group(0) @binding(0) var<storage, read>        q     : array<f32>;   // [n_tokens * k_heads * head_dim]
@group(0) @binding(1) var<storage, read>        k     : array<f32>;   // [n_tokens * k_heads * head_dim]
@group(0) @binding(2) var<storage, read>        v     : array<f32>;   // [n_tokens * v_heads * head_dim]
@group(0) @binding(3) var<storage, read>        gdec  : array<f32>;   // [n_tokens * v_heads]
@group(0) @binding(4) var<storage, read>        beta  : array<f32>;   // [n_tokens * v_heads]
@group(0) @binding(5) var<storage, read_write>  state : array<f32>;   // [v_heads * head_dim * head_dim]
@group(0) @binding(6) var<storage, read_write>  out   : array<f32>;   // [n_tokens * v_heads * head_dim]
@group(0) @binding(7) var<uniform>              p     : SeqP;

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let d   = p.head_dim;
  let idx = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;
  let total = p.v_heads * d;
  if (idx >= total) { return; }

  let h = idx / d;            // v-head
  let j = idx % d;            // value column this thread owns
  let kh = h % p.k_heads;     // shared k/q head for this v-head (cyclic, fork parity)
  let sbase = h * d * d;      // base of head h's [d×d] state
  let inv_scale = inverseSqrt(f32(d));

  for (var t : u32 = 0u; t < p.n_tokens; t = t + 1u) {
    let qb = (t * p.k_heads + kh) * d;
    let vb = (t * p.v_heads + h) * d;
    let g  = gdec[t * p.v_heads + h];
    let b  = beta[t * p.v_heads + h];

    var kv : f32 = 0.0;
    for (var i : u32 = 0u; i < d; i = i + 1u) {
      kv = kv + g * state[sbase + i * d + j] * k[qb + i];
    }
    let err = v[vb + j] - kv;

    var o : f32 = 0.0;
    for (var i : u32 = 0u; i < d; i = i + 1u) {
      let s_new = g * state[sbase + i * d + j] + k[qb + i] * (b * err);
      state[sbase + i * d + j] = s_new;
      o = o + s_new * q[qb + i];
    }
    out[vb + j] = o * inv_scale;
  }
}
`,a=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct EW { n : u32, op : u32, _p0 : u32, _p1 : u32 };

@group(0) @binding(0) var<storage, read>       a   : array<f32>;
@group(0) @binding(1) var<storage, read>       b   : array<f32>;
@group(0) @binding(2) var<storage, read_write> out : array<f32>;
@group(0) @binding(3) var<uniform>             p   : EW;

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let i = (wg_.x + wg_.y * nwg_.x) * 256u + lid_.x;
  if (i >= p.n) { return; }
  switch (p.op) {
    case 0u: { out[i] = a[i] + b[i]; }   // residual add
    case 1u: { out[i] = a[i] * b[i]; }
    default: { out[i] = a[i]; }          // copy
  }
}
`,i=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary
struct EW { n : u32, op : u32, _p0 : u32, _p1 : u32 };
@group(0) @binding(0) var<storage, read_write> io : array<f32>;
@group(0) @binding(1) var<storage, read>       b  : array<f32>;
@group(0) @binding(2) var<uniform>             p  : EW;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let i = (wg_.x + wg_.y * nwg_.x) * 256u + lid_.x;
  if (i >= p.n) { return; }
  switch (p.op) {
    case 0u: { io[i] = io[i] + b[i]; }
    case 1u: { io[i] = io[i] * b[i]; }
    case 3u: { let z = io[i]; io[i] = z / (1.0 + exp(-z)); }   // SiLU
    case 4u: { io[i] = io[i] / (1.0 + exp(-b[i])); }          // io *= sigmoid(b) (attn out-gate)
    default: { }
  }
}
`,o=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary


struct LnP {
  dim : u32,
  eps : f32,
  _p0 : u32, _p1 : u32,
};

@group(0) @binding(0) var<storage, read>       ln_x : array<f32>;
@group(0) @binding(1) var<storage, read_write> ln_y : array<f32>;
@group(0) @binding(2) var<uniform>             lnp  : LnP;

var<workgroup> ln_red : array<f32, 256>;

@compute @workgroup_size(256)
fn layernorm_main(@builtin(workgroup_id) wg : vec3<u32>,
                  @builtin(local_invocation_id) lid : vec3<u32>) {
  let t = wg.x;
  let base = t * lnp.dim;
  let tid = lid.x;

  var s : f32 = 0.0;
  var i : u32 = tid;
  loop {
    if (i >= lnp.dim) { break; }
    s = s + ln_x[base + i];
    i = i + 256u;
  }
  ln_red[tid] = s;
  workgroupBarrier();
  var stride : u32 = 128u;
  loop {
    if (stride == 0u) { break; }
    if (tid < stride) { ln_red[tid] = ln_red[tid] + ln_red[tid + stride]; }
    workgroupBarrier();
    stride = stride >> 1u;
  }
  let mean = ln_red[0] / f32(lnp.dim);
  workgroupBarrier();

  var v : f32 = 0.0;
  i = tid;
  loop {
    if (i >= lnp.dim) { break; }
    let d = ln_x[base + i] - mean;
    v = v + d * d;
    i = i + 256u;
  }
  ln_red[tid] = v;
  workgroupBarrier();
  stride = 128u;
  loop {
    if (stride == 0u) { break; }
    if (tid < stride) { ln_red[tid] = ln_red[tid] + ln_red[tid + stride]; }
    workgroupBarrier();
    stride = stride >> 1u;
  }
  let inv = inverseSqrt(ln_red[0] / f32(lnp.dim) + lnp.eps);
  workgroupBarrier();

  i = tid;
  loop {
    if (i >= lnp.dim) { break; }
    ln_y[base + i] = (ln_x[base + i] - mean) * inv;
    i = i + 256u;
  }
}


struct ModP {
  dim    : u32,
  tokens : u32,
  _p0 : u32, _p1 : u32,
};

@group(0) @binding(0) var<storage, read>       md_x     : array<f32>;
@group(0) @binding(1) var<storage, read>       md_shift : array<f32>;
@group(0) @binding(2) var<storage, read>       md_scale : array<f32>;
@group(0) @binding(3) var<storage, read_write> md_y     : array<f32>;
@group(0) @binding(4) var<uniform>             mdp      : ModP;

@compute @workgroup_size(64)
fn modulate_main(@builtin(global_invocation_id) gid : vec3<u32>,
                 @builtin(num_workgroups) nwg : vec3<u32>) {
  let total = mdp.tokens * mdp.dim;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }
  let c = idx % mdp.dim;
  md_y[idx] = md_x[idx] * (1.0 + md_scale[c]) + md_shift[c];
}


@group(0) @binding(0) var<storage, read>       ag_x     : array<f32>;
@group(0) @binding(1) var<storage, read>       ag_delta : array<f32>;
@group(0) @binding(2) var<storage, read>       ag_gate  : array<f32>;
@group(0) @binding(3) var<storage, read_write> ag_y     : array<f32>;
@group(0) @binding(4) var<uniform>             agp      : ModP;

@compute @workgroup_size(64)
fn add_gated_main(@builtin(global_invocation_id) gid : vec3<u32>,
                  @builtin(num_workgroups) nwg : vec3<u32>) {
  let total = agp.tokens * agp.dim;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }
  let c = idx % agp.dim;
  ag_y[idx] = ag_x[idx] + ag_gate[c] * ag_delta[idx];
}


struct RopeP {
  tokens   : u32,
  heads    : u32,
  head_dim : u32,
  _p0 : u32,
};

@group(0) @binding(0) var<storage, read>       rp_x   : array<f32>;
@group(0) @binding(1) var<storage, read>       rp_cos : array<f32>;
@group(0) @binding(2) var<storage, read>       rp_sin : array<f32>;
@group(0) @binding(3) var<storage, read_write> rp_y   : array<f32>;
@group(0) @binding(4) var<uniform>             rpp    : RopeP;

@compute @workgroup_size(64)
fn rope_interleaved_main(@builtin(global_invocation_id) gid : vec3<u32>,
                         @builtin(num_workgroups) nwg : vec3<u32>) {
  let pairs = rpp.head_dim / 2u;
  let total = rpp.tokens * rpp.heads * pairs;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }

  let pair = idx % pairs;
  let rem  = idx / pairs;
  let head = rem % rpp.heads;
  let tok  = rem / rpp.heads;

  let o = (tok * rpp.heads + head) * rpp.head_dim + pair * 2u;
  let p = tok * rpp.head_dim + pair * 2u;

  let a = rp_x[o];
  let b = rp_x[o + 1u];
  rp_y[o]      = a * rp_cos[p]      - b * rp_sin[p];
  rp_y[o + 1u] = b * rp_cos[p + 1u] + a * rp_sin[p + 1u];
}


const ATT_WG : u32 = 64u;

struct AttnFullP {
  tokens   : u32,
  heads    : u32,
  head_dim : u32,
  scale    : f32,      // 1/sqrt(head_dim)
};

@group(0) @binding(0) var<storage, read>       af_q : array<f32>;
@group(0) @binding(1) var<storage, read>       af_k : array<f32>;
@group(0) @binding(2) var<storage, read>       af_v : array<f32>;
@group(0) @binding(3) var<storage, read_write> af_y : array<f32>;
@group(0) @binding(4) var<uniform>             afp  : AttnFullP;

var<workgroup> af_score : array<f32, 64>;   // one score per lane per tile
var<workgroup> af_red   : array<f32, 64>;
var<workgroup> af_m     : f32;              // running max
var<workgroup> af_l     : f32;              // running sum of exp

@compute @workgroup_size(64)
fn attn_full_main(@builtin(workgroup_id) wg : vec3<u32>,
                  @builtin(local_invocation_id) lid : vec3<u32>,
                  @builtin(num_workgroups) nwg : vec3<u32>) {
  let pair = wg.x + wg.y * nwg.x;             // (token, head), flattened
  let total = afp.tokens * afp.heads;
  if (pair >= total) { return; }
  let head = pair % afp.heads;
  let tok  = pair / afp.heads;
  let hd   = afp.head_dim;
  let lane = lid.x;

  let qo = (tok * afp.heads + head) * hd;

  if (lane == 0u) { af_m = -3.0e38; af_l = 0.0; }
  workgroupBarrier();

  const ACC_MAX : u32 = 8u;
  var acc : array<f32, 8>;
  for (var a : u32 = 0u; a < ACC_MAX; a = a + 1u) { acc[a] = 0.0; }

  var tile : u32 = 0u;
  loop {
    if (tile >= afp.tokens) { break; }

    let j = tile + lane;
    var s : f32 = -3.0e38;
    if (j < afp.tokens) {
      let ko = (j * afp.heads + head) * hd;
      var d : f32 = 0.0;
      for (var i : u32 = 0u; i < hd; i = i + 1u) { d = d + af_q[qo + i] * af_k[ko + i]; }
      s = d * afp.scale;
    }
    af_score[lane] = s;
    af_red[lane] = s;
    workgroupBarrier();

    var stride : u32 = ATT_WG >> 1u;
    loop {
      if (stride == 0u) { break; }
      if (lane < stride) { af_red[lane] = max(af_red[lane], af_red[lane + stride]); }
      workgroupBarrier();
      stride = stride >> 1u;
    }
    let tile_max = af_red[0];
    workgroupBarrier();

    let m_old = af_m;
    let m_new = max(m_old, tile_max);
    let rescale = select(exp(m_old - m_new), 0.0, m_old <= -3.0e38);
    if (lane == 0u) { af_m = m_new; }
    workgroupBarrier();

    var e : f32 = 0.0;
    if (j < afp.tokens) { e = exp(af_score[lane] - m_new); }
    af_red[lane] = e;
    af_score[lane] = e;     // reuse as the weight for the accumulation below
    workgroupBarrier();
    stride = ATT_WG >> 1u;
    loop {
      if (stride == 0u) { break; }
      if (lane < stride) { af_red[lane] = af_red[lane] + af_red[lane + stride]; }
      workgroupBarrier();
      stride = stride >> 1u;
    }
    if (lane == 0u) { af_l = af_l * rescale + af_red[0]; }
    workgroupBarrier();

    var a : u32 = 0u;
    loop {
      let d = lane + a * ATT_WG;
      if (d >= hd || a >= ACC_MAX) { break; }
      var sum : f32 = 0.0;
      for (var t : u32 = 0u; t < ATT_WG; t = t + 1u) {
        let kj = tile + t;
        if (kj < afp.tokens) {
          let vo = (kj * afp.heads + head) * hd;
          sum = sum + af_score[t] * af_v[vo + d];
        }
      }
      acc[a] = acc[a] * rescale + sum;
      a = a + 1u;
    }
    workgroupBarrier();

    tile = tile + ATT_WG;
  }

  let inv_l = 1.0 / af_l;
  var a2 : u32 = 0u;
  loop {
    let d = lane + a2 * ATT_WG;
    if (d >= hd || a2 >= ACC_MAX) { break; }
    af_y[qo + d] = acc[a2] * inv_l;
    a2 = a2 + 1u;
  }
}


struct MmP {
  tokens : u32,
  in_dim : u32,
  out_dim : u32,
  _p0 : u32,
};

@group(0) @binding(0) var<storage, read>       mm_x : array<f32>;
@group(0) @binding(1) var<storage, read>       mm_w : array<f32>;
@group(0) @binding(2) var<storage, read_write> mm_y : array<f32>;
@group(0) @binding(3) var<uniform>             mmp  : MmP;

var<workgroup> mm_red : array<f32, 64>;

@compute @workgroup_size(64)
fn matmul_main(@builtin(workgroup_id) wg : vec3<u32>,
               @builtin(local_invocation_id) lid : vec3<u32>,
               @builtin(num_workgroups) nwg : vec3<u32>) {
  let pair = wg.x + wg.y * nwg.x;
  let total = mmp.tokens * mmp.out_dim;
  if (pair >= total) { return; }
  let o = pair % mmp.out_dim;
  let t = pair / mmp.out_dim;
  let lane = lid.x;

  var s : f32 = 0.0;
  var i : u32 = lane;
  loop {
    if (i >= mmp.in_dim) { break; }
    s = s + mm_x[t * mmp.in_dim + i] * mm_w[o * mmp.in_dim + i];
    i = i + 64u;
  }
  mm_red[lane] = s;
  workgroupBarrier();
  var stride : u32 = 32u;
  loop {
    if (stride == 0u) { break; }
    if (lane < stride) { mm_red[lane] = mm_red[lane] + mm_red[lane + stride]; }
    workgroupBarrier();
    stride = stride >> 1u;
  }
  if (lane == 0u) { mm_y[pair] = mm_red[0]; }
}


struct SgP {
  tokens : u32,
  inner  : u32,
  _p0 : u32, _p1 : u32,
};

@group(0) @binding(0) var<storage, read>       sg_x : array<f32>;
@group(0) @binding(1) var<storage, read_write> sg_y : array<f32>;
@group(0) @binding(2) var<uniform>             sgp  : SgP;

@compute @workgroup_size(64)
fn swiglu_fused_main(@builtin(global_invocation_id) gid : vec3<u32>,
                     @builtin(num_workgroups) nwg : vec3<u32>) {
  let total = sgp.tokens * sgp.inner;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }
  let t = idx / sgp.inner;
  let i = idx % sgp.inner;
  let base = t * sgp.inner * 2u;
  let g = sg_x[base + i];
  sg_y[idx] = (g / (1.0 + exp(-g))) * sg_x[base + sgp.inner + i];
}


struct RmsHP {
  tokens   : u32,
  heads    : u32,
  head_dim : u32,
  eps      : f32,
};

@group(0) @binding(0) var<storage, read>       rh_x : array<f32>;
@group(0) @binding(1) var<storage, read>       rh_w : array<f32>;
@group(0) @binding(2) var<storage, read_write> rh_y : array<f32>;
@group(0) @binding(3) var<uniform>             rhp  : RmsHP;

var<workgroup> rh_red : array<f32, 64>;

@compute @workgroup_size(64)
fn rmsnorm_heads_main(@builtin(workgroup_id) wg : vec3<u32>,
                      @builtin(local_invocation_id) lid : vec3<u32>,
                      @builtin(num_workgroups) nwg : vec3<u32>) {
  let pair = wg.x + wg.y * nwg.x;
  if (pair >= rhp.tokens * rhp.heads) { return; }
  let hd = rhp.head_dim;
  let base = pair * hd;          // [token][head][dim] is contiguous per (token, head)
  let lane = lid.x;

  var s : f32 = 0.0;
  var i : u32 = lane;
  loop {
    if (i >= hd) { break; }
    let v = rh_x[base + i];
    s = s + v * v;
    i = i + 64u;
  }
  rh_red[lane] = s;
  workgroupBarrier();
  var stride : u32 = 32u;
  loop {
    if (stride == 0u) { break; }
    if (lane < stride) { rh_red[lane] = rh_red[lane] + rh_red[lane + stride]; }
    workgroupBarrier();
    stride = stride >> 1u;
  }
  let inv = inverseSqrt(rh_red[0] / f32(hd) + rhp.eps);
  workgroupBarrier();

  i = lane;
  loop {
    if (i >= hd) { break; }
    rh_y[base + i] = rh_x[base + i] * inv * rh_w[i];
    i = i + 64u;
  }
}


struct CopyP {
  tokens     : u32,
  width      : u32,
  src_stride : u32,
  src_off    : u32,
  dst_stride : u32,
  dst_off    : u32,
  _p0 : u32, _p1 : u32,
};

@group(0) @binding(0) var<storage, read>       cp_src : array<f32>;
@group(0) @binding(1) var<storage, read_write> cp_dst : array<f32>;
@group(0) @binding(2) var<uniform>             cpp    : CopyP;

@compute @workgroup_size(64)
fn copy_strided_main(@builtin(global_invocation_id) gid : vec3<u32>,
                     @builtin(num_workgroups) nwg : vec3<u32>) {
  let total = cpp.tokens * cpp.width;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }
  let t = idx / cpp.width;
  let j = idx % cpp.width;
  cp_dst[t * cpp.dst_stride + cpp.dst_off + j] =
    cp_src[t * cpp.src_stride + cpp.src_off + j];
}
`,s=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK4 : u32 = 8u;   // nibbles per u32
const WG4 : u32 = 128u; // lanes per row (matches head_dim on every Bonsai size)
const DPT : u32 = 2u;   // dims per lane (head_dim <= 256 asserted on the host)

struct QP {
  head_dim : u32,
  n_rows   : u32,
  row_base : u32,   // dest row offset = posBase * n_heads_kv (absolute position base)
  _p0      : u32,
};

@group(0) @binding(0) var<storage, read>       x      : array<f32>;  // n_rows * head_dim
@group(0) @binding(1) var<storage, read_write> packed : array<u32>;  // n_rows * words_per_row
@group(0) @binding(2) var<storage, read_write> scales : array<u32>;  // n_rows
@group(0) @binding(3) var<uniform>             p      : QP;

var<workgroup> shared_amax : array<f32, 128>;
var<workgroup> shared_q : array<u32, 128>;

@compute @workgroup_size(128)
fn main(@builtin(workgroup_id) wg : vec3<u32>, @builtin(local_invocation_id) lid : vec3<u32>,
        @builtin(num_workgroups) nwg : vec3<u32>) {
  let row  = wg.x + wg.y * nwg.x;
  let lane = lid.x;
  let hd   = p.head_dim;
  if (row >= p.n_rows) { return; }

  let xv = x[row * hd + lane];
  shared_amax[lane] = abs(xv);
  workgroupBarrier();

  var stride : u32 = 64u;
  loop {
    if (stride == 0u) { break; }
    if (lane < stride) {
      shared_amax[lane] = max(shared_amax[lane], shared_amax[lane + stride]);
    }
    workgroupBarrier();
    stride = stride >> 1u;
  }

  let amax = shared_amax[0];
  let scale_f16 = pack2x16float(vec2<f32>(amax / 7.0, 0.0)) & 0xffffu;
  let scale     = unpack2x16float(scale_f16).x;
  let id        = select(0.0, 1.0 / scale, scale != 0.0);

  let raw = clamp(round(xv * id) + 8.0, 0.0, 15.0);
  shared_q[lane] = u32(raw) & 0xFu;
  workgroupBarrier();

  if (lane == 0u) {
    let row_abs = p.row_base + row;
    scales[row_abs] = scale_f16;
    let words = (hd + QK4 - 1u) / QK4;
    for (var w : u32 = 0u; w < words; w = w + 1u) {
      var v : u32 = 0u;
      for (var k : u32 = 0u; k < QK4; k = k + 1u) {
        let idx = w * QK4 + k;
        v = v | (select(0u, shared_q[idx], idx < hd) << (k * 4u));
      }
      packed[row_abs * words + w] = v;
    }
  }
}
`,u=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct TopKP {
  vocab      : u32,
  n_bins     : u32,
  lo         : f32,   // histogram range, in logit units
  hi         : f32,
  threshold  : f32,   // gather: keep values >= this (ignored by the hist entry point)
  capacity   : u32,   // gather: max pairs the output buffers can hold
  _p0 : u32, _p1 : u32,
};

@group(0) @binding(0) var<storage, read>        logits  : array<f32>;
@group(0) @binding(1) var<storage, read_write>  hist    : array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write>  out_idx : array<u32>;
@group(0) @binding(3) var<storage, read_write>  out_val : array<f32>;
@group(0) @binding(4) var<storage, read_write>  counter : array<atomic<u32>>;
@group(0) @binding(5) var<uniform>              p       : TopKP;

const WG : u32 = 256u;

/** Bin index for a logit value: bin 0 is the TOP of the range, so walking bins in ascending
 *  order walks logits in DESCENDING order — which is the direction the host needs. */
fn bin_of(v : f32) -> u32 {
  let span = max(p.hi - p.lo, 1e-6);
  let f = (p.hi - v) / span;
  let b = i32(floor(f * f32(p.n_bins)));
  return u32(clamp(b, 0, i32(p.n_bins) - 1));
}

@compute @workgroup_size(256)
fn hist_main(@builtin(global_invocation_id) gid : vec3<u32>,
             @builtin(num_workgroups) nwg : vec3<u32>) {
  let stride = nwg.x * nwg.y * WG;
  let start = gid.x + gid.y * nwg.x * WG;
  var i = start;
  loop {
    if (i >= p.vocab) { break; }
    atomicAdd(&hist[bin_of(logits[i])], 1u);
    i = i + stride;
  }
}

@compute @workgroup_size(256)
fn gather_main(@builtin(global_invocation_id) gid : vec3<u32>,
               @builtin(num_workgroups) nwg : vec3<u32>) {
  let stride = nwg.x * nwg.y * WG;
  let start = gid.x + gid.y * nwg.x * WG;
  var i = start;
  loop {
    if (i >= p.vocab) { break; }
    let v = logits[i];
    if (v >= p.threshold) {
      let slot = atomicAdd(&counter[0], 1u);
      if (slot < p.capacity) {
        out_idx[slot] = i;
        out_val[slot] = v;
      }
    }
    i = i + stride;
  }
}
`,d=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK1_0 : u32 = 128u;
const WORDS_PER_BLOCK : u32 = 5u;   // 20 bytes reserved per block (18 used)

@group(0) @binding(0) var<storage, read>       blocks : array<u32>;   // n_blocks * 5
@group(0) @binding(1) var<storage, read_write> out_w  : array<f32>;   // n_blocks * 128
@group(0) @binding(2) var<uniform>             n_blocks : u32;

fn byte_at(block_base: u32, byte_index: u32) -> u32 {
  let word = blocks[block_base + (byte_index >> 2u)];
  let sh   = (byte_index & 3u) * 8u;
  return (word >> sh) & 0xffu;
}

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let block = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;
  if (block >= n_blocks) { return; }
  let bb = block * WORDS_PER_BLOCK;

  let d = unpack2x16float(blocks[bb] & 0xffffu).x;

  let out_base = block * QK1_0;
  for (var j : u32 = 0u; j < QK1_0; j = j + 1u) {
    let byte = byte_at(bb, 2u + (j >> 3u));
    let bit  = (byte >> (j & 7u)) & 1u;
    out_w[out_base + j] = select(-d, d, bit == 1u);
  }
}
`,l=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK1_0 : u32 = 128u;
const WORDS_PER_Q1 : u32 = 5u; // 20-byte GPU block (18 used + 2 pad) — matches upload.ts repack
const WORDS_PER_Q8 : u32 = 8u;
const TILE_Q1 : u32 = 32u;     // Q1_0 blocks per K-tile (32*128 = 4096 K elements)

struct Dims { K : u32, n_cols : u32, n_rows : u32, col_tiles : u32 };

@group(0) @binding(0) var<storage, read> weights : array<u32>;
@group(0) @binding(1) var<storage, read> act_d   : array<u32>;
@group(0) @binding(2) var<storage, read> act_qs  : array<u32>;
@group(0) @binding(3) var<storage, read_write> out : array<f32>;
@group(0) @binding(4) var<uniform> dims : Dims;

var<workgroup> sh_d  : array<u32, 128>;   // TILE_Q1 * 4
var<workgroup> sh_qs : array<u32, 1024>;  // TILE_Q1 * 4 * 8

fn q1_byte(block_base: u32, byte_index: u32) -> u32 {
  let word = weights[block_base + (byte_index >> 2u)];
  return (word >> ((byte_index & 3u) * 8u)) & 0xffu;
}

fn sext8(b: u32) -> i32 {
  return (i32(b) ^ 0x80) - 0x80;
}

@compute @workgroup_size(64)
fn main(@builtin(local_invocation_id) lid : vec3<u32>,
        @builtin(workgroup_id) wid : vec3<u32>,
        @builtin(num_workgroups) nwg : vec3<u32>) {
  let local = lid.x;                 // 0..63
  let wg = wid.x + wid.y * nwg.x;
  let row   = wg / dims.col_tiles;   // uniform across the workgroup
  if (row >= dims.n_rows) { return; } // uniform: whole workgroup returns or none
  let col = (wg % dims.col_tiles) * 64u + local;
  let valid = col < dims.n_cols;

  let n_q1 = dims.K / QK1_0;
  let a_row_q8_base = row * (dims.K / 32u);

  var result : f32 = 0.0;

  var c0 : u32 = 0u;
  loop {
    if (c0 >= n_q1) { break; }
    let cn = min(TILE_Q1, n_q1 - c0);   // q1-blocks in this tile (uniform)
    let n_q8 = cn * 4u;                  // q8-blocks in this tile
    let q8_base = a_row_q8_base + c0 * 4u;

    var t : u32 = local;
    loop { if (t >= n_q8) { break; } sh_d[t] = act_d[q8_base + t]; t = t + 64u; }
    t = local;
    loop { if (t >= n_q8 * WORDS_PER_Q8) { break; } sh_qs[t] = act_qs[q8_base * WORDS_PER_Q8 + t]; t = t + 64u; }
    workgroupBarrier();

    if (valid) {
      var il : u32 = 0u;
      loop {
        if (il >= cn) { break; }
        let i  = c0 + il;
        let wb = (col * n_q1 + i) * WORDS_PER_Q1;
        let d0 = unpack2x16float(weights[wb] & 0xffffu).x;   // per-128 weight scale

        var block_sum : f32 = 0.0;
        for (var k : u32 = 0u; k < 4u; k = k + 1u) {
          let qb    = il * 4u + k;                              // shared q8-block index
          let d1    = unpack2x16float(sh_d[qb] & 0xffffu).x;    // per-32 activation scale
          let qs_sh = qb * WORDS_PER_Q8;

          let sbb  = 2u + k * 4u;
          let sb0  = q1_byte(wb, sbb);
          let sb1  = q1_byte(wb, sbb + 1u);
          let sb2  = q1_byte(wb, sbb + 2u);
          let sb3  = q1_byte(wb, sbb + 3u);

          var acc : i32 = 0;                                    // INTEGER accumulation (order-free)
          for (var wi : u32 = 0u; wi < 8u; wi = wi + 1u) {
            let aword = sh_qs[qs_sh + wi];                      // int8s from shared (one read/4 lanes)
            var sbyte = sb0;
            if (wi >= 6u) { sbyte = sb3; } else if (wi >= 4u) { sbyte = sb2; } else if (wi >= 2u) { sbyte = sb1; }
            let bitbase = (wi & 1u) * 4u;
            for (var m : u32 = 0u; m < 4u; m = m + 1u) {
              let bit = (sbyte >> (bitbase + m)) & 1u;
              let q8  = sext8((aword >> (m * 8u)) & 0xffu);
              acc = acc + select(-q8, q8, bit == 1u);
            }
          }
          block_sum = block_sum + d1 * f32(acc);               // * per-32 scale (k order)
        }
        result = result + d0 * block_sum;                      // * per-128 scale (i order)
        il = il + 1u;
      }
    }
    workgroupBarrier();                 // all threads done reading shared before next tile overwrites
    c0 = c0 + TILE_Q1;
  }

  if (valid) { out[row * dims.n_cols + col] = result; }
}
`,c=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK2_0 : u32 = 128u;
const WORDS_PER_BLOCK : u32 = 9u;   // 36 bytes reserved per block (34 used + 2 pad)

@group(0) @binding(0) var<storage, read>       blocks : array<u32>;   // n_blocks * 9
@group(0) @binding(1) var<storage, read_write> out_w  : array<f32>;   // n_blocks * 128
@group(0) @binding(2) var<uniform>             n_blocks : u32;

fn byte_at(block_base: u32, byte_index: u32) -> u32 {
  let word = blocks[block_base + (byte_index >> 2u)];
  let sh   = (byte_index & 3u) * 8u;
  return (word >> sh) & 0xffu;
}

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let block = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;
  if (block >= n_blocks) { return; }
  let bb = block * WORDS_PER_BLOCK;

  let d = unpack2x16float(blocks[bb] & 0xffffu).x;

  let out_base = block * QK2_0;
  for (var j : u32 = 0u; j < QK2_0; j = j + 1u) {
    let byte_index = 2u + (j >> 2u);
    let byte = byte_at(bb, byte_index);
    let bit_offset = (j & 3u) << 1u;
    let q = (byte >> bit_offset) & 3u;
    out_w[out_base + j] = f32(i32(q) - 1) * d;
  }
}
`,p=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK2_0 : u32 = 128u;
const WORDS_PER_Q2 : u32 = 9u; // 36-byte GPU block (34 used + 2 pad) — matches upload.ts repack
const WORDS_PER_Q8 : u32 = 8u;
const TILE_Q2 : u32 = 32u;     // Q2_0 blocks per K-tile (32*128 = 4096 K elements)

struct Dims { K : u32, n_cols : u32, n_rows : u32, col_tiles : u32 };

@group(0) @binding(0) var<storage, read> weights : array<u32>;
@group(0) @binding(1) var<storage, read> act_d   : array<u32>;
@group(0) @binding(2) var<storage, read> act_qs  : array<u32>;
@group(0) @binding(3) var<storage, read_write> out : array<f32>;
@group(0) @binding(4) var<uniform> dims : Dims;

var<workgroup> sh_d  : array<u32, 128>;   // TILE_Q2 * 4
var<workgroup> sh_qs : array<u32, 1024>;  // TILE_Q2 * 4 * 8

fn q2_byte(block_base: u32, byte_index: u32) -> u32 {
  let word = weights[block_base + (byte_index >> 2u)];
  return (word >> ((byte_index & 3u) * 8u)) & 0xffu;
}

fn sext8(b: u32) -> i32 {
  return (i32(b) ^ 0x80) - 0x80;
}

@compute @workgroup_size(64)
fn main(@builtin(local_invocation_id) lid : vec3<u32>,
        @builtin(workgroup_id) wid : vec3<u32>,
        @builtin(num_workgroups) nwg : vec3<u32>) {
  let local = lid.x;                 // 0..63
  let wg = wid.x + wid.y * nwg.x;
  let row   = wg / dims.col_tiles;   // uniform across the workgroup
  if (row >= dims.n_rows) { return; } // uniform: whole workgroup returns or none
  let col = (wg % dims.col_tiles) * 64u + local;
  let valid = col < dims.n_cols;

  let n_q2 = dims.K / QK2_0;
  let a_row_q8_base = row * (dims.K / 32u);

  var result : f32 = 0.0;

  var c0 : u32 = 0u;
  loop {
    if (c0 >= n_q2) { break; }
    let cn = min(TILE_Q2, n_q2 - c0);   // q2-blocks in this tile (uniform)
    let n_q8 = cn * 4u;                  // q8-blocks in this tile
    let q8_base = a_row_q8_base + c0 * 4u;

    var t : u32 = local;
    loop { if (t >= n_q8) { break; } sh_d[t] = act_d[q8_base + t]; t = t + 64u; }
    t = local;
    loop { if (t >= n_q8 * WORDS_PER_Q8) { break; } sh_qs[t] = act_qs[q8_base * WORDS_PER_Q8 + t]; t = t + 64u; }
    workgroupBarrier();

    if (valid) {
      var il : u32 = 0u;
      loop {
        if (il >= cn) { break; }
        let i  = c0 + il;
        let wb = (col * n_q2 + i) * WORDS_PER_Q2;
        let d0 = unpack2x16float(weights[wb] & 0xffffu).x;   // per-128 weight scale

        var block_sum : f32 = 0.0;
        for (var k : u32 = 0u; k < 4u; k = k + 1u) {
          let qb    = il * 4u + k;                              // shared q8-block index
          let d1    = unpack2x16float(sh_d[qb] & 0xffffu).x;    // per-32 activation scale
          let qs_sh = qb * WORDS_PER_Q8;

          let sbb  = 2u + k * 8u;
          let sb0  = q2_byte(wb, sbb);
          let sb1  = q2_byte(wb, sbb + 1u);
          let sb2  = q2_byte(wb, sbb + 2u);
          let sb3  = q2_byte(wb, sbb + 3u);
          let sb4  = q2_byte(wb, sbb + 4u);
          let sb5  = q2_byte(wb, sbb + 5u);
          let sb6  = q2_byte(wb, sbb + 6u);
          let sb7  = q2_byte(wb, sbb + 7u);

          var acc : i32 = 0;                                    // INTEGER accumulation (order-free)
          for (var wi : u32 = 0u; wi < 8u; wi = wi + 1u) {
            let aword = sh_qs[qs_sh + wi];                      // int8s from shared (one read/4 lanes)
            var sbyte = sb0;
            if (wi == 1u) { sbyte = sb1; }
            else if (wi == 2u) { sbyte = sb2; }
            else if (wi == 3u) { sbyte = sb3; }
            else if (wi == 4u) { sbyte = sb4; }
            else if (wi == 5u) { sbyte = sb5; }
            else if (wi == 6u) { sbyte = sb6; }
            else if (wi == 7u) { sbyte = sb7; }
            for (var m : u32 = 0u; m < 4u; m = m + 1u) {
              let bit_offset = m << 1u;  // 2 bits at ((m & 3) << 1)
              let q2 = (sbyte >> bit_offset) & 3u;  // extract 2-bit value
              let q8 = sext8((aword >> (m * 8u)) & 0xffu);
              acc = acc + (i32(q2) - 1) * q8;  // formula: (q - 1) * a8
            }
          }
          block_sum = block_sum + d1 * f32(acc);               // * per-32 scale (k order)
        }
        result = result + d0 * block_sum;                      // * per-128 scale (i order)
        il = il + 1u;
      }
    }
    workgroupBarrier();                 // all threads done reading shared before next tile overwrites
    c0 = c0 + TILE_Q2;
  }

  if (valid) { out[row * dims.n_cols + col] = result; }
}
`,h=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK8_0 : u32 = 32u;

@group(0) @binding(0) var<storage, read>        activations : array<f32>;   // n_blocks * 32
@group(0) @binding(1) var<storage, read_write>  out_d       : array<u32>;    // n_blocks (f16 in low 16)
@group(0) @binding(2) var<storage, read_write>  out_qs      : array<u32>;    // n_blocks * 8

var<workgroup> shared_amax : array<f32, 32>;
var<workgroup> shared_q : array<u32, 32>;

@compute @workgroup_size(32)
fn main(@builtin(workgroup_id) wg : vec3<u32>, @builtin(local_invocation_id) lid : vec3<u32>,
        @builtin(num_workgroups) nwg : vec3<u32>) {
  let block = wg.x + wg.y * nwg.x;
  let lane  = lid.x;
  let base  = block * QK8_0;

  let x = activations[base + lane];
  shared_amax[lane] = abs(x);
  workgroupBarrier();

  var stride : u32 = 16u;
  loop {
    if (stride == 0u) { break; }
    if (lane < stride) {
      shared_amax[lane] = max(shared_amax[lane], shared_amax[lane + stride]);
    }
    workgroupBarrier();
    stride = stride >> 1u;
  }

  let amax = shared_amax[0];
  let d_f16 = pack2x16float(vec2<f32>(amax / 127.0, 0.0)) & 0xffffu;
  let d     = unpack2x16float(d_f16).x;
  let id    = select(0.0, 1.0 / d, d != 0.0);

  var q : i32 = i32(round(x * id));
  q = clamp(q, -127, 127);

  shared_q[lane] = u32(q) & 0xffu;
  workgroupBarrier();

  if (lane == 0u) {
    out_d[block] = d_f16;
    for (var w : u32 = 0u; w < 8u; w = w + 1u) {
      let o = w * 4u;
      out_qs[block * 8u + w] =
          shared_q[o + 0u]
        | (shared_q[o + 1u] << 8u)
        | (shared_q[o + 2u] << 16u)
        | (shared_q[o + 3u] << 24u);
    }
  }
}
`,m=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct Params { n : u32, eps : f32, _p0 : u32, _p1 : u32 };

@group(0) @binding(0) var<storage, read>       x      : array<f32>;   // n_rows * n
@group(0) @binding(1) var<storage, read>       weight : array<f32>;   // n
@group(0) @binding(2) var<storage, read_write> y      : array<f32>;   // n_rows * n
@group(0) @binding(3) var<uniform>             params : Params;

const WG : u32 = 256u;
var<workgroup> partial : array<f32, WG>;

@compute @workgroup_size(WG)
fn main(@builtin(workgroup_id) wg : vec3<u32>, @builtin(local_invocation_id) lid : vec3<u32>,
        @builtin(num_workgroups) nwg : vec3<u32>) {
  let row = wg.x + wg.y * nwg.x;
  let n    = params.n;
  let base = row * n;
  let tid  = lid.x;

  var ss : f32 = 0.0;
  var i : u32 = tid;
  loop {
    if (i >= n) { break; }
    let v = x[base + i];
    ss = ss + v * v;
    i = i + WG;
  }
  partial[tid] = ss;
  workgroupBarrier();

  var stride : u32 = WG >> 1u;
  loop {
    if (stride == 0u) { break; }
    if (tid < stride) { partial[tid] = partial[tid] + partial[tid + stride]; }
    workgroupBarrier();
    stride = stride >> 1u;
  }

  let mean = partial[0] / f32(n);
  let scale = inverseSqrt(mean + params.eps);

  var o : u32 = tid;
  loop {
    if (o >= n) { break; }
    y[base + o] = x[base + o] * scale * weight[o];
    o = o + WG;
  }
}
`,g=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct RopeP {
  n_heads   : u32,
  head_dim  : u32,
  rot_dim   : u32,   // rope.dimension_count (<= head_dim)
  pos_base  : u32,   // position of the first token in this batch
  freq_base : f32,
  scale     : f32,   // linear rope scaling factor (1.0 = none)
  _p0 : u32, _p1 : u32,
};

@group(0) @binding(0) var<storage, read_write> data : array<f32>;   // [n_tokens * n_heads * head_dim]
@group(0) @binding(1) var<uniform>             p    : RopeP;

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let pairs_per_head = p.rot_dim / 2u;
  let per_token = p.n_heads * pairs_per_head;
  let idx = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;

  let token = idx / per_token;
  let rem   = idx % per_token;
  let head  = rem / pairs_per_head;
  let pair  = rem % pairs_per_head;

  let head_base = (token * p.n_heads + head) * p.head_dim;
  let i0 = head_base + pair;            // (p, p + rot/2)
  let i1 = i0 + pairs_per_head;

  let pos   = f32(p.pos_base + token) * p.scale;
  let exponent = -2.0 * f32(pair) / f32(p.rot_dim);
  let theta = pos * pow(p.freq_base, exponent);
  let c = cos(theta);
  let s = sin(theta);

  let x0 = data[i0];
  let x1 = data[i1];
  data[i0] = x0 * c - x1 * s;
  data[i1] = x0 * s + x1 * c;
}
`,_=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct SampleP { vocab : u32, temperature : f32, _p0 : u32, _p1 : u32 };

@group(0) @binding(0) var<storage, read>       logits  : array<f32>;   // [vocab]
@group(0) @binding(1) var<storage, read_write> argmax  : array<u32>;   // [1] best token id
@group(0) @binding(2) var<storage, read_write> maxval  : array<f32>;   // [1] max logit
@group(0) @binding(3) var<uniform>             p       : SampleP;

const WG : u32 = 256u;
var<workgroup> best_val : array<f32, WG>;
var<workgroup> best_idx : array<u32, WG>;

@compute @workgroup_size(WG)
fn main(@builtin(local_invocation_id) lid : vec3<u32>) {
  let tid = lid.x;
  var bv : f32 = -3.0e38;
  var bi : u32 = 0u;
  var i : u32 = tid;
  loop {
    if (i >= p.vocab) { break; }
    let l = logits[i];
    if (l > bv) { bv = l; bi = i; }
    i = i + WG;
  }
  best_val[tid] = bv;
  best_idx[tid] = bi;
  workgroupBarrier();

  var stride : u32 = WG >> 1u;
  loop {
    if (stride == 0u) { break; }
    if (tid < stride) {
      if (best_val[tid + stride] > best_val[tid]) {
        best_val[tid] = best_val[tid + stride];
        best_idx[tid] = best_idx[tid + stride];
      }
    }
    workgroupBarrier();
    stride = stride >> 1u;
  }

  if (tid == 0u) {
    argmax[0] = best_idx[0];
    maxval[0] = best_val[0];
  }
}
`,b=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct AttnP {
  head_dim   : u32,
  n_kv       : u32,   // number of cached keys (context length so far)
  q_head     : u32,   // this query head index
  kv_head    : u32,   // mapped KV head (GQA: q_head / (n_head/n_head_kv))
  scale      : f32,   // 1/sqrt(head_dim)
  _p0 : u32, _p1 : u32, _p2 : u32,
};

@group(0) @binding(0) var<storage, read>       q  : array<f32>;   // [head_dim] for this query
@group(0) @binding(1) var<storage, read>       k  : array<f32>;   // [n_kv * head_dim]
@group(0) @binding(2) var<storage, read>       v  : array<f32>;   // [n_kv * head_dim]
@group(0) @binding(3) var<storage, read_write> out : array<f32>;  // [head_dim]
@group(0) @binding(4) var<uniform>             p   : AttnP;

@compute @workgroup_size(1)
fn main() {
  let hd = p.head_dim;

  var m : f32 = -3.0e38;             // running max
  var l : f32 = 0.0;                 // running denom
  var acc : array<f32, 256>;         // running weighted V (head_dim <= 256)
  for (var d : u32 = 0u; d < hd; d = d + 1u) { acc[d] = 0.0; }

  for (var t : u32 = 0u; t < p.n_kv; t = t + 1u) {
    var s : f32 = 0.0;
    let kb = t * hd;
    for (var d : u32 = 0u; d < hd; d = d + 1u) { s = s + q[d] * k[kb + d]; }
    s = s * p.scale;

    let m_new = max(m, s);
    let correction = exp(m - m_new);
    let w = exp(s - m_new);
    l = l * correction + w;
    let vb = t * hd;
    for (var d : u32 = 0u; d < hd; d = d + 1u) {
      acc[d] = acc[d] * correction + w * v[vb + d];
    }
    m = m_new;
  }

  let inv = select(0.0, 1.0 / l, l > 0.0);
  for (var d : u32 = 0u; d < hd; d = d + 1u) { out[d] = acc[d] * inv; }
}
`,f=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct BAttnP {
  n_tokens   : u32,
  n_heads    : u32,
  n_heads_kv : u32,
  head_dim   : u32,
  pos_base   : u32,   // absolute position of this batch's first token
  scale      : f32,   // 1/sqrt(head_dim)
  mode : u32, _p1 : u32,   // mode: 0 = f32 cache (default), 1 = 4-bit packed cache
};

@group(0) @binding(0) var<storage, read>       q          : array<f32>;
@group(0) @binding(1) var<storage, read>       k_cache    : array<u32>;
@group(0) @binding(2) var<storage, read>       v_cache    : array<u32>;
@group(0) @binding(3) var<storage, read_write> out        : array<f32>;
@group(0) @binding(4) var<uniform>             p          : BAttnP;
@group(0) @binding(5) var<storage, read> k_scale_buf : array<u32>;
@group(0) @binding(6) var<storage, read> v_scale_buf : array<u32>;

fn readK(mode : u32, e : u32, scale : f32) -> f32 {
  if (mode == 1u) {
    let w = e >> 3u;
    let n = e & 7u;
    let raw = (k_cache[w] >> (n * 4u)) & 0xFu;
    return (f32(raw) - 8.0) * scale;
  }
  return bitcast<f32>(k_cache[e]);
}
fn readV(mode : u32, e : u32, scale : f32) -> f32 {
  if (mode == 1u) {
    let w = e >> 3u;
    let n = e & 7u;
    let raw = (v_cache[w] >> (n * 4u)) & 0xFu;
    return (f32(raw) - 8.0) * scale;
  }
  return bitcast<f32>(v_cache[e]);
}

const WG : u32 = 128u;
const DPT : u32 = 2u;

var<workgroup> red : array<f32, 128>;

@compute @workgroup_size(128)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let idx = wg_.x + wg_.y * nwg_.x;
  let total = p.n_tokens * p.n_heads;
  if (idx >= total) { return; }

  let tid = lid_.x;
  let hd  = p.head_dim;
  let t   = idx / p.n_heads;         // query token in this batch
  let h   = idx % p.n_heads;         // query head
  let kv_head = h / (p.n_heads / p.n_heads_kv);

  let q_base = (t * p.n_heads + h) * hd;
  let kv_per_pos = p.n_heads_kv * hd;
  let last = p.pos_base + t;         // inclusive causal limit

  var qv  : array<f32, 2>;
  var acc : array<f32, 2>;
  for (var i : u32 = 0u; i < DPT; i = i + 1u) {
    let d = tid + i * WG;
    qv[i]  = select(0.0, q[q_base + d], d < hd);
    acc[i] = 0.0;
  }

  var m : f32 = -3.0e38;
  var l : f32 = 0.0;

  for (var pos : u32 = 0u; pos <= last; pos = pos + 1u) {
    var kScale : f32 = 0.0;
    var vScale : f32 = 0.0;
    if (p.mode == 1u) {
      let sIdx = pos * p.n_heads_kv + kv_head;
      kScale = unpack2x16float(k_scale_buf[sIdx]).x;
      vScale = unpack2x16float(v_scale_buf[sIdx]).x;
    }
    let k_base = pos * kv_per_pos + kv_head * hd;
    var part : f32 = 0.0;
    for (var i : u32 = 0u; i < DPT; i = i + 1u) {
      let d = tid + i * WG;
      if (d < hd) { part = part + qv[i] * readK(p.mode, k_base + d, kScale); }
    }
    red[tid] = part;
    workgroupBarrier();

    var stride : u32 = WG / 2u;
    loop {
      if (stride == 0u) { break; }
      if (tid < stride) { red[tid] = red[tid] + red[tid + stride]; }
      workgroupBarrier();
      stride = stride / 2u;
    }

    let s = red[0] * p.scale;

    let m_new = max(m, s);
    let corr  = exp(m - m_new);
    let w     = exp(s - m_new);
    l = l * corr + w;
    let v_base = pos * kv_per_pos + kv_head * hd;
    for (var i : u32 = 0u; i < DPT; i = i + 1u) {
      let d = tid + i * WG;
      if (d < hd) { acc[i] = acc[i] * corr + w * readV(p.mode, v_base + d, vScale); }
    }
    m = m_new;

    workgroupBarrier();
  }

  let inv = select(0.0, 1.0 / l, l > 0.0);
  for (var i : u32 = 0u; i < DPT; i = i + 1u) {
    let d = tid + i * WG;
    if (d < hd) { out[q_base + d] = acc[i] * inv; }
  }
}
`,w=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

@group(0) @binding(0) var<storage, read>       gate : array<f32>;
@group(0) @binding(1) var<storage, read>       up   : array<f32>;
@group(0) @binding(2) var<storage, read_write> out  : array<f32>;
@group(0) @binding(3) var<uniform>             n    : u32;

fn silu(z : f32) -> f32 { return z / (1.0 + exp(-z)); }

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let i = (wg_.x + wg_.y * nwg_.x) * 256u + lid_.x;
  if (i >= n) { return; }
  out[i] = silu(gate[i]) * up[i];
}
`,k=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

struct ConvP {
  in_c   : u32,
  out_c  : u32,
  h      : u32,   // input height
  w      : u32,   // input width
  k      : u32,   // square kernel size (1 or 3 here)
  pad    : u32,
  stride : u32,
  _p0    : u32,
};

@group(0) @binding(0) var<storage, read>       x       : array<f32>;  // [in_c*h*w]
@group(0) @binding(1) var<storage, read>       weight  : array<f32>;  // [out_c*in_c*k*k]
@group(0) @binding(2) var<storage, read>       bias    : array<f32>;  // [out_c]
@group(0) @binding(3) var<storage, read_write> y       : array<f32>;  // [out_c*oh*ow]
@group(0) @binding(4) var<uniform>             p       : ConvP;

fn out_h() -> u32 { return (p.h + 2u * p.pad - p.k) / p.stride + 1u; }
fn out_w() -> u32 { return (p.w + 2u * p.pad - p.k) / p.stride + 1u; }

/**
 * 2-D convolution, NCHW, one thread per output element.
 *
 * Zero padding is done by SKIPPING out-of-range taps rather than by materialising a padded
 * input. Materialising would allocate another full tensor per layer — at decoder resolutions
 * that is hundreds of megabytes of pure copy, on a device that is also holding a language
 * model.
 */
@compute @workgroup_size(64)
fn conv2d_main(@builtin(global_invocation_id) gid : vec3<u32>,
               @builtin(num_workgroups) nwg : vec3<u32>) {
  let oh = out_h();
  let ow = out_w();
  let total = p.out_c * oh * ow;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }

  let ox = idx % ow;
  let oy = (idx / ow) % oh;
  let oc = idx / (ow * oh);

  var acc : f32 = bias[oc];
  for (var ic : u32 = 0u; ic < p.in_c; ic = ic + 1u) {
    let x_plane = ic * p.h * p.w;
    let w_base = ((oc * p.in_c) + ic) * p.k * p.k;
    for (var ky : u32 = 0u; ky < p.k; ky = ky + 1u) {
      let iy = i32(oy * p.stride) + i32(ky) - i32(p.pad);
      if (iy < 0 || iy >= i32(p.h)) { continue; }
      for (var kx : u32 = 0u; kx < p.k; kx = kx + 1u) {
        let ix = i32(ox * p.stride) + i32(kx) - i32(p.pad);
        if (ix < 0 || ix >= i32(p.w)) { continue; }
        acc = acc + x[x_plane + u32(iy) * p.w + u32(ix)] * weight[w_base + ky * p.k + kx];
      }
    }
  }
  y[idx] = acc;
}

struct GroupNormP {
  c       : u32,
  h       : u32,
  w       : u32,
  groups  : u32,
  eps     : f32,
  _p0 : u32, _p1 : u32, _p2 : u32,
};

@group(0) @binding(0) var<storage, read>       gx      : array<f32>;
@group(0) @binding(1) var<storage, read>       gamma   : array<f32>;  // [c]
@group(0) @binding(2) var<storage, read>       beta    : array<f32>;  // [c]
@group(0) @binding(3) var<storage, read_write> gy      : array<f32>;
@group(0) @binding(4) var<uniform>             gp      : GroupNormP;

/**
 * GroupNorm — one WORKGROUP per group, cooperating over that group's whole slab.
 *
 * NOT one thread per group. A group at decoder sizes is (c/groups) x h x w elements — with
 * 128 channels, 32 groups and a 512x512 plane that is over a million values, and a single
 * thread walking it is the same one-lane mistake that made attention 8x slower than it had
 * to be. The mean and variance are a parallel reduction; the normalise pass is grid-strided.
 *
 * Two passes over the slab (mean, then variance) rather than the sum/sum-of-squares trick:
 * at f32 with a million-element reduction the one-pass form loses precision exactly where
 * the variance is small, which is where a VAE's activations live.
 */
var<workgroup> red_sum : array<f32, 256>;

@compute @workgroup_size(256)
fn groupnorm_main(@builtin(workgroup_id) wg : vec3<u32>,
                  @builtin(local_invocation_id) lid : vec3<u32>) {
  let g = wg.x;
  if (g >= gp.groups) { return; }        // uniform across the workgroup — safe with barriers

  let cpg = gp.c / gp.groups;            // channels per group
  let plane = gp.h * gp.w;
  let slab = cpg * plane;                // elements this group owns
  let base = g * slab;
  let tid = lid.x;

  var s : f32 = 0.0;
  var i : u32 = tid;
  loop {
    if (i >= slab) { break; }
    s = s + gx[base + i];
    i = i + 256u;
  }
  red_sum[tid] = s;
  workgroupBarrier();
  var stride : u32 = 128u;
  loop {
    if (stride == 0u) { break; }
    if (tid < stride) { red_sum[tid] = red_sum[tid] + red_sum[tid + stride]; }
    workgroupBarrier();
    stride = stride / 2u;
  }
  let mean = red_sum[0] / f32(slab);
  workgroupBarrier();

  var v : f32 = 0.0;
  i = tid;
  loop {
    if (i >= slab) { break; }
    let d = gx[base + i] - mean;
    v = v + d * d;
    i = i + 256u;
  }
  red_sum[tid] = v;
  workgroupBarrier();
  stride = 128u;
  loop {
    if (stride == 0u) { break; }
    if (tid < stride) { red_sum[tid] = red_sum[tid] + red_sum[tid + stride]; }
    workgroupBarrier();
    stride = stride / 2u;
  }
  let inv_std = 1.0 / sqrt(red_sum[0] / f32(slab) + gp.eps);
  workgroupBarrier();

  i = tid;
  loop {
    if (i >= slab) { break; }
    let ch = g * cpg + (i / plane);
    gy[base + i] = (gx[base + i] - mean) * inv_std * gamma[ch] + beta[ch];
    i = i + 256u;
  }
}

struct UpP {
  c : u32,
  h : u32,
  w : u32,
  scale : u32,
};

@group(0) @binding(0) var<storage, read>       ux : array<f32>;
@group(0) @binding(1) var<storage, read_write> uy : array<f32>;
@group(0) @binding(2) var<uniform>             up : UpP;

/**
 * Nearest-neighbour upsample by an integer factor — what UpDecoderBlock2D does before its
 * convolution (diffusers' Upsample2D default is nearest, and the conv that follows is what
 * turns the blockiness into detail). Bilinear here would be a different model.
 */
@compute @workgroup_size(64)
fn upsample_nearest_main(@builtin(global_invocation_id) gid : vec3<u32>,
                         @builtin(num_workgroups) nwg : vec3<u32>) {
  let oh = up.h * up.scale;
  let ow = up.w * up.scale;
  let total = up.c * oh * ow;
  let idx = gid.x + gid.y * nwg.x * 64u;
  if (idx >= total) { return; }

  let ox = idx % ow;
  let oy = (idx / ow) % oh;
  let ch = idx / (ow * oh);

  let sx = ox / up.scale;
  let sy = oy / up.scale;
  uy[idx] = ux[ch * up.h * up.w + sy * up.w + sx];
}
`,v={causal_conv1d:e,deltanet:n,deltanet_gate:r,deltanet_seq:t,elementwise:a,elementwise_inplace:i,image_ops:o,kv_quant_4bit:s,logit_topk:u,q1_0_dequant:d,q1_0_q8_0_matmul:l,q2_0_dequant:c,q2_0_q8_0_matmul:p,quantize_q8_0:h,rmsnorm:m,rope_imrope:g,sampling:_,softmax_attn:b,softmax_attn_batched:f,swiglu:w,vae_ops:k};export{v as WGSL_SOURCES};
