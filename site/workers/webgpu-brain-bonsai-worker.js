var ps=Object.defineProperty;var P=(e,t)=>()=>(e&&(t=e(e=0)),t);var ee=(e,t)=>{for(var n in t)ps(e,n,{get:t[n],enumerable:true})};function Ft(e){let t=ws[e];if(!t)throw new Error(`bonsai-gguf: unsupported ggml type ${e} (not in TYPE_TRAITS)`);return t}function Eo(e,t){let{blockSize:n,typeSize:r}=Ft(e);if(t%n!==0)throw new Error(`bonsai-gguf: element count ${t} not a multiple of block size ${n} for ${Ft(e).name}`);return t/n*r}var ws,nt,zn,Ao,Lo,Ut,Bo,Wt,Hn,Yn,Et=P(()=>{"use strict";ws={0:{blockSize:1,typeSize:4,name:"F32"},1:{blockSize:1,typeSize:2,name:"F16"},8:{blockSize:32,typeSize:34,name:"Q8_0"},30:{blockSize:1,typeSize:2,name:"BF16"},41:{blockSize:128,typeSize:18,name:"Q1_0"},42:{blockSize:128,typeSize:34,name:"Q2_0"},142:{blockSize:128,typeSize:34,name:"PQ2_0"},143:{blockSize:128,typeSize:28,name:"PTQ1_0"}},nt=128,zn=128,Ao=18,Lo=34,Ut=128,Bo=28,Wt=24,Hn=2,Yn=26});var G,Wo,Pt=P(()=>{"use strict";G={MAP_READ:1,MAP_WRITE:2,COPY_SRC:4,COPY_DST:8,STORAGE:128,UNIFORM:64},Wo={READ:1,WRITE:2}});function Ko(e,t=33554432){if(!Number.isFinite(e)||e<=0)return t;let n=Math.floor(t/e);return n>=1?n*e:e}var un=P(()=>{"use strict"});var Qo=P(()=>{"use strict";un()});function oi(e){return e===Ho?{rawBlock:Jo,gpuBlock:Zo}:e===Yo||e===Xo?{rawBlock:ei,gpuBlock:ti}:e===Vo?{rawBlock:Xn,gpuBlock:Ms}:e===zo?{rawBlock:ni,gpuBlock:ri}:{rawBlock:1,gpuBlock:1}}function Cs(e,t){let{rawBlock:n,gpuBlock:r}=oi(e);return n===1?ii(t,4):Math.floor(t/n)*r}function Ds(e,t){return t>e.limits.maxStorageBufferBindingSize}async function Vn(e,t,n,r={}){let o=[];for(let i of n.members)o.push({entry:i,buffer:await Us(e,t,i,r)});return o}async function Us(e,t,n,r={}){let{rawBlock:o,gpuBlock:i}=oi(n.type),a=Cs(n.type,n.nBytes);if(Ds(e,a)){let m=e.limits.maxStorageBufferBindingSize,g=m===Gs?" — this is the WebGPU DEFAULT limit, so the device was almost certainly created without requiredLimits; mirror adapter.limits in requestDevice()":" — this adapter genuinely caps here; this model cannot run on this device";throw new Error(`bonsai-upload: tensor '${n.name}' (${a} B on GPU) exceeds maxStorageBufferBindingSize (${m})${g}`)}let s=e.createBuffer({size:a,usage:G.STORAGE|G.COPY_DST|G.COPY_SRC,label:n.name}),u=Ko(o,r.chunkTargetBytes),d=r.drainEveryChunks??Fs,l=r.onSubmittedWorkDone,c=null,p=m=>{let g=Math.min(u,n.nBytes-m),h=n.absStart+m;return t(h,h+g-1)},f=0;for(let m=0;m<n.nBytes;m+=u){let g=c?await c:await p(m),h=m+u;c=h<n.nBytes?p(h):null;let b=Ws(n.type,g),w=o===1?m:Math.floor(m/o)*i;e.queue.writeBuffer(s,w,b),r.onProgress?.(g.byteLength),f+=1,r.mobile&&l&&f%d===0&&await l()}return c&&await c.catch(()=>{}),s}function Ws(e,t){return e===Ho?jo(t,Jo,Zo):e===Yo||e===Xo?jo(t,ei,ti):e===Vo?t.subarray(0,Math.floor(t.length/Xn)*Xn):e===zo?Ks(t):Qs(t)}function Ks(e){let t=Math.floor(e.length/ni),n=new Uint8Array(t*ri);for(let r=0;r<t;r++)n[r*4+2]=e[r*2],n[r*4+3]=e[r*2+1];return n}function jo(e,t,n){let r=Math.floor(e.length/t),o=new Uint8Array(r*n);for(let i=0;i<r;i++)o.set(e.subarray(i*t,i*t+t),i*n);return o}function Qs(e){let t=ii(e.length,4);if(t===e.length)return e;let n=new Uint8Array(t);return n.set(e),n}function ii(e,t){return e+(t-e%t)%t}var Gs,zo,Ho,Yo,Xo,Vo,Jo,Zo,ei,ti,Xn,Ms,ni,ri,Fs,Jn=P(()=>{"use strict";Pt();un();Qo();Gs=134217728,zo=30,Ho=41,Yo=42,Xo=142,Vo=143,Jo=18,Zo=20,ei=34,ti=36,Xn=28,Ms=28,ni=2,ri=4;Fs=4});function si(e,t){return Math.floor((e+t-1)/t)}function mi(e,t){pi.set(e,Math.max(0,Math.floor(t)))}function tr(e){rt.has(e)||rt.set(e,{enc:e.createCommandEncoder(),dispatches:0})}function dn(e){let t=rt.get(e);t&&(rt.delete(e),e.queue.submit([t.enc.finish()]))}function qe(e){let t=rt.get(e);return t?{enc:t.enc,batched:true}:{enc:e.createCommandEncoder(),batched:false}}function Ge(e,t){t.batched||e.queue.submit([t.enc.finish()])}function fi(e){let t=ui.get(e);return t||(t=new Map,ui.set(e,t)),t}function Hs(e){let t=li.get(e);return t||(t={created:0,reused:0},li.set(e,t)),t}function nr(e,t){return`${e}:${t}`}function hi(e,t,n,r,o=false){let i=fi(e),a=nr(t,n),s=i.get(a),u=Hs(e);if(globalThis.__BONSAI_NO_POOL===true)return u.created++,e.createBuffer({size:n,usage:t,label:r});if(s&&s.length>0){u.reused++;let d=s.pop();if(o)return d;let l=qe(e);return l.enc.clearBuffer(d,0,n),Ge(e,l),d}return u.created++,e.createBuffer({size:n,usage:t,label:r})}function Kt(e,t){let n=Zn.get(e);n||(n=[],Zn.set(e,n)),n.push(t)}function or(e){let t=Zn.get(e);if(!t)return;let n=fi(e);for(let r of t){let o=r[rr];if(o===void 0){try{r.destroy()}catch{}continue}let i=n.get(o);i||(i=[],n.set(o,i)),i.push(r)}t.length=0}function pe(e,t,n,r){let o=Math.max(4,mn(t)),i=hi(e,ci,o,n,r?.queueInit===true);return i[rr]=nr(ci,o),i}function pn(e,t,n){let r=Math.max(16,mn(t)),o=hi(e,di,r,n,true);return o[rr]=nr(di,r),o}function mn(e){return e+(4-e%4)%4}function ir(e,t,n){let r=e.createBuffer({size:mn(t.byteLength),usage:n??G.STORAGE|G.COPY_DST|G.COPY_SRC,label:"upload"});return e.queue.writeBuffer(r,0,t),r}function W(e,t,n){return e.createBindGroup({layout:t.getBindGroupLayout(0),entries:n.map((r,o)=>({binding:o,resource:{buffer:r}}))})}function K(e,t,n,r,o){let i=rt.get(e),a=i?i.enc:e.createCommandEncoder(),s=a.beginComputePass();s.setPipeline(t),s.setBindGroup(0,n);let u=si(r,o);if(u<=cn)s.dispatchWorkgroups(u);else{let l=cn,c=si(u,l);if(c>cn)throw new Error(`bonsai-dispatch: ${u} workgroups exceeds even a 2-D grid (${cn}^2). This is a context-length bug upstream, not a dispatch bug — chunk the work.`);s.dispatchWorkgroups(l,c)}if(s.end(),!i){e.queue.submit([a.finish()]);return}i.dispatches++;let d=pi.get(e)??0;d>0&&i.dispatches>=d&&(console.debug(`[bonsai] TDR budget limit reached: submitted ${i.dispatches} dispatches, opening new batch to stay under GPU watchdog deadline`),rt.delete(e),e.queue.submit([i.enc.finish()]),rt.set(e,{enc:e.createCommandEncoder(),dispatches:0}))}function Ys(e,t){let n=er.get(e);n||(n=new Map,er.set(e,n));let r=n.get(t);return r&&r.length?r.pop():e.createBuffer({size:t,usage:G.MAP_READ|G.COPY_DST,label:"readback"})}function Xs(e,t,n){let r=er.get(e);if(!r){n.destroy();return}let o=r.get(t);if(o||(o=[],r.set(t,o)),o.length>=4){n.destroy();return}o.push(n)}async function je(e,t,n){dn(e);let r=mn(n),o=Ys(e,r),i=e.createCommandEncoder();i.copyBufferToBuffer(t,0,o,0,r),e.queue.submit([i.finish()]),await o.mapAsync(Wo.READ);let a=o.getMappedRange().slice(0,n);return o.unmap(),Xs(e,r,o),a}function fn(e){let t=new ArrayBuffer(Vs(e.length*4)),n=new DataView(t);return e.forEach((r,o)=>{r.u32!==void 0?n.setUint32(o*4,r.u32,true):n.setFloat32(o*4,r.f32??0,true)}),t}function Vs(e){return e+(16-e%16)%16}var rt,pi,Zn,ui,li,rr,ci,di,cn,er,Me=P(()=>{"use strict";Pt();rt=new WeakMap,pi=new WeakMap;Zn=new WeakMap,ui=new WeakMap,li=new WeakMap;rr=Symbol("aither.poolKey");ci=G.STORAGE|G.COPY_DST|G.COPY_SRC,di=G.UNIFORM|G.COPY_DST;cn=65535;er=new WeakMap});function gi(e,t){let n=new Float32Array(t);if(e.signMode==="identity")return n.fill(1),n;let r=e.signsByWidth.get(t);if(!r)throw new Error(`bonsai-hadamard: prism.hadamard has no sign vector for input width ${t}`);if(r.length!==t)throw new Error(`bonsai-hadamard: sign vector for width ${t} has length ${r.length}`);for(let o=0;o<t;o++)n[o]=r[o];return n}function bi(e,t){if(t.blockSize!==dt)throw new Error(`bonsai-hadamard: prism.hadamard.block_size ${t.blockSize} is not supported — the WebGPU fwht kernel is compiled for ${dt}`);let n=new Map;for(let r of t.signWidths)n.set(r,ir(e,gi(t,r)));return{spec:t,signBuffers:n}}function wi(e,t,n){let r=e.signBuffers.get(n);if(r)return r;if(e.spec.signMode!=="identity")throw new Error(`bonsai-hadamard: no sign vector for input width ${n} (declared: ${[...e.signBuffers.keys()].join(", ")||"none"})`);let o=ir(t,gi(e.spec,n));return e.signBuffers.set(n,o),o}function Ot(e,t){return!!e&&e.spec.weightNames.has(t)}function ar(e,t){return!!e&&e.spec.inverseWeightNames.has(t)}function _i(e,t){return!!e&&e.spec.gdnVGrouped&&Ot(e,t)&&t.includes(".ssm_out.")}var dt,hn=P(()=>{"use strict";Me();dt=1024});var Ti={};ee(Ti,{LOGIT_HIST_BINS:()=>ou,LOGIT_RANGE_HI:()=>ru,LOGIT_RANGE_LO:()=>nu,TOPK_GATHER_CAPACITY:()=>iu,chooseThreshold:()=>tu});function tu(e,t,n,r,o){let i=e.length,a=Math.max(n-t,1e-6),s=0;for(let u=0;u<i;u++)if(s+=e[u],s>=r)return{threshold:n-(u+1)/i*a,expected:s,overflow:s>o,reason:s>o?`bin ${u} of ${i} holds ${s} candidates, over the ${o} the gather can hold`:`bin ${u} of ${i} reaches ${s} candidates for k=${r}`};return{threshold:t,expected:s,overflow:true,reason:`histogram holds only ${s} counts, fewer than k=${r} — refusing to threshold`}}var nu,ru,ou,iu,Ai=P(()=>{"use strict";nu=-50,ru=50,ou=1024,iu=2048});var Nt={};ee(Nt,{FWHT_BLOCK:()=>dt,Q8_BLOCK:()=>Pi,Q8_BYTES_PER_BLOCK:()=>au,causalConv1d:()=>pr,dbgStats:()=>mu,deltanetGate:()=>fr,deltanetSeq:()=>hr,deltanetStep:()=>uu,elementwise:()=>gr,elementwiseInplace:()=>Rt,f32Buffer:()=>ot,f32Matmul:()=>Oi,fwhtActivations:()=>$i,gdnVGroupedPermute:()=>Ri,gpuTopK:()=>Ii,mulSigmoidInplace:()=>mr,projectQ1:()=>oe,projectQuantized:()=>It,ptq1q8Matmul:()=>dr,q1q8Matmul:()=>lr,q2q8Matmul:()=>cr,quantizeQ8:()=>ur,readbackF32:()=>ht,residualAdd:()=>ft,rmsnorm:()=>me,ropeImrope:()=>wn,rotatedInput:()=>ge,sampleArgmax:()=>pu,sampleTiming:()=>pt,sampleToken:()=>du,scratchBuffer:()=>T,siluInplace:()=>yn,softmaxAttnBatched:()=>_n,softmaxAttnHead:()=>su,swigluMul:()=>Qt});function ot(e,t,n,r){return pe(e,Math.max(mt,t*mt),n,r)}function T(e,t,n,r){let o=ot(e.device,t,n,r);return Kt(e.device,o),o}function te(e,t){let n=fn(t),r=pn(e,n.byteLength);return e.queue.writeBuffer(r,0,n),Kt(e,r),r}function me(e,t,n,r,o,i,a){let s=te(e.device,[{u32:i},{f32:a},{u32:0},{u32:0}]),u=e.pipelines.get("rmsnorm");K(e.device,u,W(e.device,u,[t,n,r,s]),o,1)}function ur(e,t,n){let r=Math.ceil(n/Pi),o=pe(e.device,r*4,"act_d"),i=pe(e.device,r*8*4,"act_qs"),a=e.pipelines.get("quantize_q8_0");return K(e.device,a,W(e.device,a,[t,o,i]),r,1),{d:o,qs:i,nBlocks:r}}function lr(e,t,n,r,o,i,a){let s=Math.ceil(a/64),u=te(e.device,[{u32:i},{u32:a},{u32:o},{u32:s}]),d=e.pipelines.get("q1_0_q8_0_matmul"),l=W(e.device,d,[t,n.d,n.qs,r,u]);K(e.device,d,l,o*s*64,64)}function cr(e,t,n,r,o,i,a){let s=Math.ceil(a/64),u=te(e.device,[{u32:i},{u32:a},{u32:o},{u32:s}]),d=e.pipelines.get("q2_0_q8_0_matmul"),l=W(e.device,d,[t,n.d,n.qs,r,u]);K(e.device,d,l,o*s*64,64)}function dr(e,t,n,r,o,i,a){let s=Math.ceil(a/64),u=te(e.device,[{u32:i},{u32:a},{u32:o},{u32:s}]),d=e.pipelines.get("ptq1_0_q8_0_matmul"),l=W(e.device,d,[t,n.d,n.qs,r,u]);K(e.device,d,l,o*s*64,64)}function Oi(e,t,n,r,o,i,a){let s=te(e.device,[{u32:o},{u32:i},{u32:a},{u32:0}]),u=e.pipelines.get("image_ops","matmul_main"),d=W(e.device,u,[n,t,r,s]);K(e.device,u,d,o*a,1)}function $i(e,t,n,r,o,i=false){if(r%dt!==0)throw new Error(`bonsai-ops: fwhtActivations width ${r} is not a multiple of the Hadamard block size ${dt}`);let a=T(e,n*r,"fwht_out"),s=te(e.device,[{u32:r},{u32:n},{u32:0},{u32:i?1:0}]),u=e.pipelines.get("fwht_1024"),d=W(e.device,u,[t,o,a,s]),l=n*(r/dt);return K(e.device,u,d,l*256,256),a}function Ri(e,t,n,r){let{hd:o,nk:i,rep:a}=r,s=o*i*a,u=T(e,n*s,"gdn_grouped"),d=qe(e.device);for(let l=0;l<n;l++){let c=l*s*mt;for(let p=0;p<a;p++)for(let f=0;f<i;f++){let m=c+o*(f+i*p)*mt,g=c+o*(p+a*f)*mt;d.enc.copyBufferToBuffer(t,m,u,g,o*mt)}}return Ge(e.device,d),u}function ge(e,t,n,r,o,i){let a=e.hadamard;if(!a)return t;let s=o.filter(l=>Ot(a,l));if(s.length===0)return t;if(s.length!==o.length)throw new Error(`bonsai-ops: rotatedInput: weights sharing one activation disagree on the Hadamard fold — folded: [${s.join(", ")}], not folded: [${o.filter(l=>!Ot(a,l)).join(", ")}]. Transform them in separate calls.`);let u=t,d=o.filter(l=>_i(a,l));if(d.length>0){if(!i)throw new Error(`bonsai-ops: rotatedInput: '${d[0]}' needs the gdn_v_grouped permutation but the caller passed no head geometry`);if(i.hd*i.nk*i.rep!==r)throw new Error(`bonsai-ops: rotatedInput: gdn geometry ${i.hd}x${i.nk}x${i.rep} != width ${r}`);u=Ri(e,t,n,i)}return $i(e,u,n,r,wi(a,e.device,r),false)}function oe(e,t,n,r,o,i,a){let s=ur(e,t,o*i);if(e.quantType===42||e.quantType===142)cr(e,n,s,r,o,i,a);else if(e.quantType===143)dr(e,n,s,r,o,i,a);else if(e.quantType===void 0||e.quantType===41)lr(e,n,s,r,o,i,a);else throw new Error(`projectQ1: unsupported context quant type ${e.quantType} (supported: Q1_0=41, Q2_0=42, PQ2_0=142, PTQ1_0=143)`)}function It(e,t,n,r,o,i,a,s){if(s===30||s===0){Oi(e,n,t,r,o,i,a);return}let u=ur(e,t,o*i);if(s===42||s===142)cr(e,n,u,r,o,i,a);else if(s===41)lr(e,n,u,r,o,i,a);else if(s===143)dr(e,n,u,r,o,i,a);else throw new Error(`projectQuantized: unsupported weight quant type ${s} (supported: Q1_0=41, Q2_0=42, PQ2_0=142, PTQ1_0=143, BF16=30, F32=0)`)}function wn(e,t,n,r,o,i,a,s,u=1){let d=te(e.device,[{u32:r},{u32:o},{u32:i},{u32:a},{f32:s},{f32:u},{u32:0},{u32:0}]),l=e.pipelines.get("rope_imrope"),c=Math.floor(i/2);K(e.device,l,W(e.device,l,[t,d]),n*r*c,64)}function su(e,t,n,r,o,i,a,s,u,d){let l=te(e.device,[{u32:i},{u32:a},{u32:s},{u32:u},{f32:d},{u32:0},{u32:0},{u32:0}]),c=e.pipelines.get("softmax_attn");K(e.device,c,W(e.device,c,[t,n,r,o,l]),1,1)}function _n(e,t,n,r,o,i,a,s,u,d,l,c,p){let f=!!(c&&p),m=te(e.device,[{u32:i},{u32:a},{u32:s},{u32:u},{u32:d},{f32:l},{u32:f?1:0},{u32:0}]);if(u>256)throw new Error(`bonsai-ops: softmaxAttnBatched supports head_dim <= 256, got ${u}. Raise DPT in softmax_attn_batched.wgsl to ceil(head_dim/128) to extend it.`);if(f&&u%8!==0)throw new Error(`bonsai-ops: softmaxAttnBatched 4-bit mode requires head_dim % 8 == 0, got ${u}.`);let g=e.pipelines.get("softmax_attn_batched"),h=W(e.device,g,[t,n,r,o,m,c??Ei(e.device),p??Ei(e.device)]);K(e.device,g,h,i*a,1)}function pr(e,t,n,r,o,i,a,s){let u=te(e.device,[{u32:i},{u32:a},{u32:s},{u32:0}]),d=e.pipelines.get("causal_conv1d"),l=W(e.device,d,[t,n,r,o,u]);K(e.device,d,l,i*a,64)}function uu(e,t,n,r,o,i,a,s,u,d,l){let c=te(e.device,[{u32:u},{u32:d},{u32:l},{u32:0}]),p=e.pipelines.get("deltanet"),f=W(e.device,p,[t,n,r,o,i,a,s,c]);K(e.device,p,f,1,1)}function Qt(e,t,n,r,o){let i=te(e.device,[{u32:o}]),a=e.pipelines.get("swiglu");K(e.device,a,W(e.device,a,[t,n,r,i]),o,256)}function Rt(e,t,n,r,o){let i=te(e.device,[{u32:r},{u32:o},{u32:0},{u32:0}]),a=e.pipelines.get("elementwise_inplace");K(e.device,a,W(e.device,a,[t,n,i]),r,256)}function lu(e){let t=Li.get(e);return t||(t=pe(e,4,"silu_dummy"),Li.set(e,t)),t}function Ei(e){let t=Bi.get(e);return t||(t=pe(e,4,"kv_scale_dummy"),Bi.set(e,t)),t}function mr(e,t,n,r){Rt(e,t,n,r,4)}function yn(e,t,n){Rt(e,t,lu(e.device),n,3)}function fr(e,t,n,r,o,i,a,s,u){let d=te(e.device,[{u32:s},{u32:u},{u32:0},{u32:0}]),l=e.pipelines.get("deltanet_gate"),c=W(e.device,l,[t,n,r,o,i,a,d]);K(e.device,l,c,s*u,64)}function hr(e,t,n,r,o,i,a,s,u,d,l,c,p){let f=te(e.device,[{u32:u},{u32:d},{u32:l},{u32:c},{u32:p},{u32:0},{u32:0},{u32:0}]),m=e.pipelines.get("deltanet_seq"),g=W(e.device,m,[t,n,r,o,i,a,s,f]);K(e.device,m,g,d*c,64)}function gr(e,t,n,r,o,i){if(r===t){Rt(e,r,n,o,i);return}if(r===n){Rt(e,r,t,o,i);return}let a=te(e.device,[{u32:o},{u32:i},{u32:0},{u32:0}]),s=e.pipelines.get("elementwise");K(e.device,s,W(e.device,s,[t,n,r,a]),o,256)}function ft(e,t,n,r){Rt(e,t,n,r,0)}function cu(e,t,n,r,o,i){let a=e.length,u=Array.from({length:a},(h,b)=>b).sort((h,b)=>t[b]-t[h]).slice(0,Math.max(1,Math.min(n,a)));if(r<=0)return e[u[0]];let d=t[u[0]],l=new Float64Array(u.length),c=0;for(let h=0;h<u.length;h++){let b=Math.exp((t[u[h]]-d)/r);l[h]=b,c+=b}if(!(c>0)||!Number.isFinite(c))return e[u[0]];let p=u.length,f=o.topP??1;if(f>0&&f<1){let h=0;for(let b=0;b<u.length;b++)if(h+=l[b]/c,h>=f){p=b+1;break}}let m=0;for(let h=0;h<p;h++)m+=l[h];let g=i()*m;for(let h=0;h<p;h++)if(g-=l[h],g<=0)return e[u[h]];return e[u[p-1]]}async function du(e,t,n,r={}){let o=r.temperature??0,i=r.random??Math.random,a=globalThis.__BONSAI_TIMING===true,s=a?performance.now():0,u=(r.repetitionPenalty??1)!==1&&!!r.recentIds?.length,d=r.topK&&r.topK>0?Math.min(r.topK,n):Math.min(64,n),l=globalThis.__BONSAI_GPU_TOPK===true;if(!u&&l){let y=await Ii(e,t,n,Math.max(d,1));if(y&&y.ids.length){let x=a?performance.now():0;a&&(pt.readbackMs+=x-s,pt.calls++);let X=cu(y.ids,y.vals,d,o,r,i);return a&&(pt.selectMs+=performance.now()-x),X}}let c=await ht(e,t,n),p=a?performance.now():0;a&&(pt.readbackMs+=p-s,pt.calls++);let f=y=>(a&&(pt.selectMs+=performance.now()-p),y),m=r.repetitionPenalty??1;if(m!==1&&r.recentIds?.length)for(let y of new Set(r.recentIds)){if(y<0||y>=n)continue;let x=c[y];c[y]=x>0?x/m:x*m}if(o<=0){let y=0,x=-1/0;for(let X=0;X<n;X++)c[X]>x&&(x=c[X],y=X);return f(y)}let g=r.topK&&r.topK>0?Math.min(r.topK,n):Math.min(64,n),h=[],b=-1/0;for(let y=0;y<n;y++){let x=c[y];if(h.length===g&&x<=b)continue;let X=h.length;for(;X>0&&c[h[X-1]]<x;)X--;h.splice(X,0,y),h.length>g&&h.pop(),b=c[h[h.length-1]]}let w=c[h[0]],k=new Float64Array(h.length),v=0;for(let y=0;y<h.length;y++){let x=Math.exp((c[h[y]]-w)/o);k[y]=x,v+=x}if(!(v>0)||!Number.isFinite(v))return f(h[0]);let A=h.length,S=r.topP??1;if(S>0&&S<1){let y=0;for(let x=0;x<h.length;x++)if(y+=k[x]/v,y>=S){A=x+1;break}}let N=0;for(let y=0;y<A;y++)N+=k[y];let D=i()*N;for(let y=0;y<A;y++)if(D-=k[y],D<=0)return f(h[y]);return f(h[A-1])}async function pu(e,t,n,r=0){let o=pe(e.device,4,"argmax"),i=pe(e.device,4,"maxval"),a=te(e.device,[{u32:n},{f32:r},{u32:0},{u32:0}]),s=e.pipelines.get("sampling");K(e.device,s,W(e.device,s,[t,o,i,a]),1,1);let u=await je(e.device,o,4);return new Uint32Array(u)[0]}async function Ii(e,t,n,r){let{chooseThreshold:o,LOGIT_HIST_BINS:i,LOGIT_RANGE_LO:a,LOGIT_RANGE_HI:s,TOPK_GATHER_CAPACITY:u}=await Promise.resolve().then(()=>(Ai(),Ti)),d=i,l=u,c=pe(e.device,d*4,"topk_hist"),p=pe(e.device,l*4,"topk_idx"),f=pe(e.device,l*4,"topk_val"),m=pe(e.device,4,"topk_count"),g=x=>te(e.device,[{u32:n},{u32:d},{f32:a},{f32:s},{f32:x},{u32:l},{u32:0},{u32:0}]),h=e.pipelines.get("logit_topk","hist_main"),b=g(0);K(e.device,h,W(e.device,h,[t,c,p,f,m,b]),Math.min(n,65536),256);let w=await je(e.device,c,d*4),k=o(new Uint32Array(w),a,s,r,l);if(k.overflow)return null;let v=e.pipelines.get("logit_topk","gather_main"),A=g(k.threshold);K(e.device,v,W(e.device,v,[t,c,p,f,m,A]),Math.min(n,65536),256);let S=await je(e.device,m,4),N=new Uint32Array(S)[0];if(N===0||N>l)return null;let D=await je(e.device,p,N*4),y=await je(e.device,f,N*4);return{ids:new Uint32Array(D),vals:new Float32Array(y)}}async function ht(e,t,n){let r=await je(e.device,t,n*mt);return new Float32Array(r)}async function mu(e,t,n,r){let o=await ht(e,t,Math.min(n,8192)),i=0,a=1/0,s=-1/0,u=0;for(let l=0;l<o.length;l++){let c=o[l];Number.isFinite(c)?(c<a&&(a=c),c>s&&(s=c),u+=Math.abs(c)):i++}let d=`${r}[bad=${i} min=${a.toExponential(1)} max=${s.toExponential(1)} mean=${(u/o.length).toExponential(1)}]`;return console.log(`[bonsai] ${d}`),d}var mt,Pi,au,Li,Bi,pt,ze=P(()=>{"use strict";Me();Et();hn();mt=4,Pi=32,au=36;Li=new WeakMap;Bi=new WeakMap;pt={readbackMs:0,selectMs:0,calls:0}});var Ni={};ee(Ni,{runFullAttnBlock:()=>fu});async function fu(e,t,n){let{hidden:r,nTokens:o,posBase:i}=n,{device:a,pipelines:s,weights:u,config:d,kv:l,kvMode:c}=e,p=d.layerKinds[t],f=p!=="dense-attn",m=kn(p,t,d.ffnNormNames?.[t]),[g,h,b,w,k,v,A,S,N,D,y]=m,{headCount:x,headCountKv:X,embeddingLength:C,keyLength:Ye,ropeDimensionCount:wt,ropeFreqBase:_t,rmsEps:Fe}=d,j=x,ue=X,L=Ye??C/x,Ue=1/Math.sqrt(L),Xe=wt??L;await u.ensureLayer(t);let Ve=u.get(g),Le=u.get(h),yt=u.get(b),at=u.get(w),Je=u.get(k),kt=u.get(v),vt=u.get(A),xt=u.get(S),fe=u.get(N),St=u.get(D),Be=u.get(y),le=T(e,o*C,"h1_attn");me(e,r,Ve,le,o,C,Fe);let We=T(e,o*j*L,"tempQ"),Ze=T(e,o*ue*L,"tempK"),et=T(e,o*ue*L,"tempV"),st=f?T(e,o*j*L,"tempG"):null,Ke=ge(e,le,o,C,[h,b,w]);if(oe(e,Ke,yt,Ze,o,C,ue*L),oe(e,Ke,at,et,o,C,ue*L),f){let M=T(e,o*j*L*2,"tempQG");oe(e,Ke,Le,M,o,C,j*L*2);let Qe=qe(a),ne=j*L*2,Ee=j*L;for(let Pe=0;Pe<o;Pe++)for(let At=0;At<j;At++){let Re=(Pe*ne+At*L*2)*4,Gt=(Pe*Ee+At*L)*4;Qe.enc.copyBufferToBuffer(M,Re,We,Gt,L*4),Qe.enc.copyBufferToBuffer(M,Re+L*4,st,Gt,L*4)}Ge(a,Qe)}else oe(e,Ke,Le,We,o,C,j*L);let ce=T(e,o*j*L,"tempQn"),be=T(e,o*ue*L,"tempKn");me(e,We,Je,ce,o*j,L,Fe),me(e,Ze,kt,be,o*ue,L,Fe),wn(e,ce,o,j,L,Xe,i,_t),wn(e,be,o,ue,L,Xe,i,_t);let Oe=T(e,o*j*L,"attn_out");if(c==="4bit"){l.append(t,be,et,o,i);let M=l.layer(t);_n(e,ce,M.k,M.v,Oe,o,j,ue,L,i,Ue,M.kScale,M.vScale)}else{l.append(t,be,et,o,0,0);let{k:M,v:Qe}=l.layer(t);_n(e,ce,M,Qe,Oe,o,j,ue,L,i,Ue)}f&&mr(e,Oe,st,o*j*L);let ut=T(e,o*C,"attn_out_proj"),F=ge(e,Oe,o,j*L,[A]);oe(e,F,vt,ut,o,j*L,C),ft(e,r,ut,o*C);let $e=T(e,o*C,"h2_ffn");me(e,r,xt,$e,o,C,Fe);let $=T(e,o*d.feedForwardLength,"ffn_gate"),V=T(e,o*d.feedForwardLength,"ffn_up"),J=ge(e,$e,o,C,[N,D]);oe(e,J,fe,$,o,C,d.feedForwardLength),oe(e,J,St,V,o,C,d.feedForwardLength);let we=T(e,o*d.feedForwardLength,"ffn_gated_up");Qt(e,$,V,we,o*d.feedForwardLength);let tt=T(e,o*C,"ffn_out"),Tt=ge(e,we,o,d.feedForwardLength,[y]);oe(e,Tt,Be,tt,o,d.feedForwardLength,C),ft(e,r,tt,o*C)}var qi=P(()=>{"use strict";Me();ze();vn()});var Mi={};ee(Mi,{runDeltaNetBlock:()=>hu});async function hu(e,t,n){let r=e.config,o=e.device,i=e.weights,a=r.deltaNet;if(!a)throw new Error(`bonsai-deltanet: layer ${t} routed to the DeltaNet path but this model has no ssm.* geometry (dense model). This is a layer-classification bug, not a bad file.`);let s=n.nTokens,u=r.embeddingLength,d=r.feedForwardLength,l=r.rmsEps,{numVHeads:c,numKHeads:p,headDim:f,qDim:m,kDim:g,vDim:h,convDim:b,convKernel:w,vPerKHead:k}=a,v=kn("linear-attn",t);if(v.length!==14)throw new Error(`block_deltanet layer ${t}: expected 14 tensor names, got ${v.length}`);let[A,S,N,D,y,x,X,C,Ye,wt,_t,Fe,j,ue]=v;for(let ne of v)if(!i.has(ne))throw new Error(`block_deltanet layer ${t}: missing tensor '${ne}'. This layer is DeltaNet (linear-attn); ensure it was streamed via weights.ensureLayer(${t}).`);let L=T(e,s*u,`dn.${t}.h1`),Ue=T(e,s*b,`dn.${t}.qkv`),Xe=T(e,s*h,`dn.${t}.z`),Ve=T(e,s*m,`dn.${t}.qc`),Le=T(e,s*g,`dn.${t}.kc`),yt=T(e,s*h,`dn.${t}.vc`),at=T(e,s*m,`dn.${t}.qn`),Je=T(e,s*g,`dn.${t}.kn`),kt=T(e,s*c,`dn.${t}.alpha`),vt=T(e,s*c,`dn.${t}.beta`),xt=T(e,s*c,`dn.${t}.g`),fe=T(e,s*c,`dn.${t}.betaG`),St=T(e,s*h,`dn.${t}.recur`),Be=T(e,s*h,`dn.${t}.normOut`),le=T(e,s*u,`dn.${t}.ssmProj`),We=T(e,s*u,`dn.${t}.h2`),Ze=T(e,s*d,`dn.${t}.ffnG`),et=T(e,s*d,`dn.${t}.ffnU`),st=T(e,s*d,`dn.${t}.ffnM`),Ke=T(e,s*u,`dn.${t}.ffnD`),ce=T(e,b,`dn.${t}.convBias`,{queueInit:true});o.queue.writeBuffer(ce,0,new Float32Array(b));let be=T(e,f,`dn.${t}.l2w`,{queueInit:true});o.queue.writeBuffer(be,0,new Float32Array(f).fill(1/Math.sqrt(f)));let Oe=1e-6/f;me(e,n.hidden,i.get(A),L,s,u,l);let ut=ge(e,L,s,u,[S,N]);oe(e,ut,i.get(S),Ue,s,u,b),oe(e,ut,i.get(N),Xe,s,u,h);let F=w-1,$e=e.ssm.generation??0,$=Gi.get(e.ssm);$||($={gen:$e,bufs:new Map,zeroed:new Set},Gi.set(e.ssm,$)),$.gen!==$e&&($.gen=$e,$.zeroed.clear());let V=$.bufs.get(t);V?$.zeroed.has(t)||(o.queue.writeBuffer(V,0,new Float32Array(F*b)),$.zeroed.add(t)):(V=ot(o,F*b,`dn.${t}.convHist`),$.bufs.set(t,V),o.queue.writeBuffer(V,0,new Float32Array(F*b)),$.zeroed.add(t));let J=T(e,(s+F)*b,`dn.${t}.convIn`),we=T(e,(s+F)*b,`dn.${t}.convOutF`);{let ne=qe(o);ne.enc.copyBufferToBuffer(V,0,J,0,F*b*4),ne.enc.copyBufferToBuffer(Ue,0,J,F*b*4,s*b*4),ne.enc.copyBufferToBuffer(J,s*b*4,V,0,F*b*4),Ge(o,ne)}pr(e,J,i.get(D),ce,we,s+F,b,w),yn(e,we,(s+F)*b);{let ne=qe(o);for(let Ee=0;Ee<s;Ee++){let Pe=(Ee+F)*b*4;ne.enc.copyBufferToBuffer(we,Pe,Ve,Ee*m*4,m*4),ne.enc.copyBufferToBuffer(we,Pe+m*4,Le,Ee*g*4,g*4),ne.enc.copyBufferToBuffer(we,Pe+(m+g)*4,yt,Ee*h*4,h*4)}Ge(o,ne)}me(e,Ve,be,at,s*p,f,Oe),me(e,Le,be,Je,s*p,f,Oe),It(e,L,i.get(x),kt,s,u,c,i.typeOf(x)),It(e,L,i.get(y),vt,s,u,c,i.typeOf(y)),fr(e,kt,vt,i.get(X),i.get(C),xt,fe,s,c);let tt=e.ssm.state(t);hr(e,at,Je,yt,xt,fe,tt,St,s,c,p,f,k),me(e,St,i.get(Ye),Be,s*c,f,l),yn(e,Xe,s*h),gr(e,Be,Xe,Be,s*h,1);let Tt=ge(e,Be,s,h,[wt],{hd:f,nk:p,rep:k});oe(e,Tt,i.get(wt),le,s,h,u),ft(e,n.hidden,le,s*u),me(e,n.hidden,i.get(_t),We,s,u,l);let M=ge(e,We,s,u,[Fe,j]);oe(e,M,i.get(Fe),Ze,s,u,d),oe(e,M,i.get(j),et,s,u,d),Qt(e,Ze,et,st,s*d);let Qe=ge(e,st,s,d,[ue]);oe(e,Qe,i.get(ue),Ke,s,d,u),ft(e,n.hidden,Ke,s*u)}var Gi,Ci=P(()=>{"use strict";ze();Me();vn();Gi=new WeakMap});function kn(e,t,n){let r=`blk.${t}.`;return e==="full-attn"||e==="dense-attn"?[`${r}attn_norm.weight`,`${r}attn_q.weight`,`${r}attn_k.weight`,`${r}attn_v.weight`,`${r}attn_q_norm.weight`,`${r}attn_k_norm.weight`,`${r}attn_output.weight`,n??`${r}post_attention_norm.weight`,`${r}ffn_gate.weight`,`${r}ffn_up.weight`,`${r}ffn_down.weight`]:[`${r}attn_norm.weight`,`${r}attn_qkv.weight`,`${r}attn_gate.weight`,`${r}ssm_conv1d.weight`,`${r}ssm_beta.weight`,`${r}ssm_alpha.weight`,`${r}ssm_a`,`${r}ssm_dt.bias`,`${r}ssm_norm.weight`,`${r}ssm_out.weight`,`${r}post_attention_norm.weight`,`${r}ffn_gate.weight`,`${r}ffn_up.weight`,`${r}ffn_down.weight`]}async function br(e,t,n){let r=e.config.layerKinds[t];if(await e.weights.ensureLayer(t),r==="full-attn"||r==="dense-attn"){let{runFullAttnBlock:o}=await Promise.resolve().then(()=>(qi(),Ni));await o(e,t,n)}else if(r==="linear-attn"){let{runDeltaNetBlock:o}=await Promise.resolve().then(()=>(Ci(),Mi));await o(e,t,n)}else throw new Error(`runBlock: unknown layer kind '${r}' at layer ${t}`)}var vn=P(()=>{"use strict"});function wr(e){let t=(e&32768)>>15,n=(e&31744)>>10,r=e&1023;return n===0?(t?-1:1)*Math.pow(2,-14)*(r/1024):n===31?r?NaN:t?-1/0:1/0:(t?-1:1)*Math.pow(2,n-15)*(1+r/1024)}function Fi(e,t=0){if(e.length-t<Ao)throw new Error("readQ1Block: need 18 bytes");let n=e[t]|e[t+1]<<8,r=e.subarray(t+2,t+2+16);return{d:wr(n),qs:new Uint8Array(r)}}function bu(e,t){return e[t>>3]>>(t&7)&1}function Ui(e){let t=new Float32Array(nt);for(let n=0;n<nt;n++)t[n]=bu(e.qs,n)?e.d:-e.d;return t}function Wi(e,t=0){if(e.length-t<Lo)throw new Error("readQ2Block: need 34 bytes");let n=e[t]|e[t+1]<<8,r=e.subarray(t+2,t+2+32);return{d:wr(n),qs:new Uint8Array(r)}}function wu(e,t){let n=t>>2,r=(t&3)<<1;return e[n]>>r&3}function Ki(e){let t=new Float32Array(zn);for(let n=0;n<zn;n++){let r=wu(e.qs,n);t[n]=(r-1)*e.d}return t}function Qi(e,t=0){if(e.length-t<Bo)throw new Error("readPtq1Block: need 28 bytes");let n=new Uint8Array(e.subarray(t,t+Wt)),r=new Uint8Array(e.subarray(t+Wt,t+Wt+Hn)),o=e[t+Yn]|e[t+Yn+1]<<8;return{qs:n,qh:r,d:wr(o)}}function yu(e){let t=new Int8Array(Ut),n=0,r=0;for(let o=0;o<3;o++){let i=_u[o];for(;r+i<=Wt;r+=i)for(let a=0;a<5;a++)for(let s=0;s<i;s++){let d=(e.qs[r+s]*Di[a]&255)*3>>8;t[n++]=d-1}}for(let o=0;o<4;o++)for(let i=0;i<Hn;i++){let s=(e.qh[i]*Di[o]&255)*3>>8;t[n++]=s-1}if(n!==Ut)throw new Error(`decodePtq1Trits: decoded ${n} values, expected 128`);return t}function ji(e){let t=yu(e),n=new Float32Array(Ut);for(let r=0;r<Ut;r++)n[r]=t[r]*e.d;return n}var gu,mp,_u,Di,zi=P(()=>{"use strict";Et();gu=new Float32Array(1),mp=new Uint32Array(gu.buffer);_u=[32,16,8],Di=[1,3,9,27,81,243]});function Hi(e,t){if(!Number.isInteger(e)||e<=0||(e&e-1)!==0)throw new Error(`${t}: block size ${e} must be a power of two`)}function ku(e,t,n){if(Hi(n,"fwhtInPlace"),t<0||t+n>e.length)throw new Error(`fwhtInPlace: [${t}, ${t+n}) out of range`);let r=Math.fround(1/Math.sqrt(n));for(let o=0;o<n;o++)e[t+o]=e[t+o]*r;for(let o=1;o<n;o<<=1)for(let i=0;i<n;i+=2*o)for(let a=0;a<o;a++){let s=e[t+i+a],u=e[t+i+o+a];e[t+i+a]=s+u,e[t+i+o+a]=s-u}}function vu(e,t,n,r,o=0){if(Hi(n,"fwhtInverseBlock"),t+n>e.length)throw new Error(`fwhtInverseBlock: block [${t}, ${t+n}) exceeds input ${e.length}`);let i=new Float32Array(n);for(let a=0;a<n;a++)i[a]=e[t+a];if(ku(i,0,n),r){if(o+n>r.length)throw new Error(`fwhtInverseBlock: signs too short (${r.length})`);for(let a=0;a<n;a++)i[a]=i[a]*r[o+a]}return i}function xu(e,t){if(e.signMode==="identity")return;let n=e.signsByWidth.get(t);if(!n)throw new Error(`fwht: prism.hadamard has no sign vector for width ${t}`);if(n.length!==t)throw new Error(`fwht: sign vector for width ${t} has length ${n.length}`);return n}function Yi(e,t,n,r=0){let{blockSize:o}=n;if(t%o!==0)throw new Error(`fwhtInverseRow: width ${t} is not a multiple of block size ${o}`);if(r+t>e.length)throw new Error(`fwhtInverseRow: row [${r}, ${r+t}) exceeds input ${e.length}`);let i=xu(n,t),a=new Float32Array(t);for(let s=0;s*o<t;s++){let u=vu(e,r+s*o,o,i,s*o);a.set(u,s*o)}return a}var Xi=P(()=>{"use strict"});var Vi={};ee(Vi,{embedTokens:()=>_r,projectLogits:()=>xn});function Su(e,t){switch(e){case 41:return{gpuBytesPerBlock:20,dequant:(n,r)=>Ui(Fi(n,r))};case 42:case 142:return{gpuBytesPerBlock:36,dequant:(n,r)=>Ki(Wi(n,r))};case 143:return{gpuBytesPerBlock:28,dequant:(n,r)=>ji(Qi(n,r))};default:throw new Error(`bonsai-embed: '${t}' has unsupported quant type ${e} (supported: Q1_0=41, Q2_0=42, PQ2_0=142, PTQ1_0=143)`)}}async function _r(e,t,n,r,o){let i="token_embd.weight";if(!r.has(i))throw new Error(`bonsai-embed: token embedding table '${i}' not loaded; call weights.loadGlobals(['${i}']) first`);let a=r.get(i),s=t.length;if(o%nt!==0)throw new Error(`bonsai-embed: embeddingLength ${o} not a multiple of QK1_0 (${nt})`);let u=r.typeOf(i),{gpuBytesPerBlock:d,dequant:l}=Su(u,i),c=o/nt,p=c*d,f=e.hadamard,m=ar(f,i)?f.spec:null;if(f&&Ot(f,i))throw new Error(`bonsai-embed: '${i}' is listed in prism.hadamard.weight_names; an embedding table can only be an inverse_weight_names entry`);let g=new Float32Array(s*o),h=pe(e.device,p,"embed_staging");for(let b=0;b<s;b++){let w=t[b];if(!Number.isInteger(w)||w<0)throw new Error(`bonsai-embed: token ID ${w} at position ${b} is invalid (must be non-negative integer)`);let k=w*p,v=e.device.createCommandEncoder();v.copyBufferToBuffer(a,k,h,0,p),e.device.queue.submit([v.finish()]);let A=await je(e.device,h,p),S=new Uint8Array(A),N=b*o;for(let D=0;D<c;D++){let y=l(S,D*d);g.set(y,N+D*nt)}m&&g.set(Yi(g,o,m,N),N)}e.device.queue.writeBuffer(n,0,g),h.destroy()}async function xn(e,t,n,r,o,i){let a="output_norm.weight";if(!r.has(a))throw new Error(`bonsai-lmhead: output norm '${a}' not loaded; call weights.loadGlobals(['${a}']) first`);let s=r.get(a),u=o.embeddingLength,d=o.rmsEps,l=ot(e.device,u,"last_row");{let w=e.device.createCommandEncoder();w.copyBufferToBuffer(t,n*u*4,l,0,u*4),e.device.queue.submit([w.finish()])}let c=ot(e.device,u,"normed_hidden");me(e,l,s,c,1,u,d);{let{BONSAI_DEBUG:w}=await Promise.resolve().then(()=>(Sn(),kr));if(w){let{readbackF32:k}=await Promise.resolve().then(()=>(ze(),Nt)),v=await k(e,c,u),A=0,S=1/0,N=-1/0;for(let D of v)D<S&&(S=D),D>N&&(N=D),A+=Math.abs(D);console.log(`[bonsai] normedHidden: min=${S.toFixed(3)} max=${N.toFixed(3)} meanabs=${(A/v.length).toFixed(4)}`),console.log("[bonsai] NH_DUMP "+JSON.stringify(Array.from(v)))}}let p="output.weight",f=!r.has(p),m=f?"token_embd.weight":p;if(!r.has(m))throw new Error(`bonsai-lmhead: LM head weights '${m}' not loaded; call weights.loadGlobals(['${m}']) first`);let g=r.get(m);if(f&&e.hadamard&&ar(e.hadamard,m))throw new Error(`bonsai-lmhead: output.weight is absent and the tied '${m}' is a Hadamard-latent (inverse) table; a tied LM head over a rotated embedding table is not a supported combination`);let h=ge(e,c,1,u,[m]),b=ot(e.device,i,"logits");return It(e,h,g,b,1,u,i,r.typeOf(m)),l.destroy(),c.destroy(),b}var yr=P(()=>{"use strict";Me();ze();zi();Xi();hn();Et()});var kr={};ee(kr,{BONSAI_DEBUG:()=>Au,bonsaiDebugEnabled:()=>it,captureRow:()=>vr,decodeStep:()=>Bu,prefill:()=>Lu});function it(){return globalThis.__BONSAI_DEBUG===true}function vr(e,t){let n=globalThis,r=n.__BONSAI_CAPTURE_TAG;r&&((n.__BONSAI_ROWS??={})[`${r}:${e}`]=t.slice())}function Ji(){return typeof globalThis.__BONSAI_CAPTURE_TAG=="string"}async function Lu(e,t,n,r,o,i=0){await _r(e,n,t,e.weights,e.config.embeddingLength);let a=e.config.embeddingLength,s=(n.length-1)*a,u=async(f,m)=>{if(!it()&&!Ji())return;let g=await ht(e,t,n.length*a),h=g.subarray(s,s+a);if(m!==void 0){let A=globalThis.__BONSAI_CAPTURE_POS,S=typeof A=="number"&&A>=0&&A<n.length?A*a:s;vr(m,g.subarray(S,S+a))}if(!it())return;let b=0,w=1/0,k=-1/0,v=0;for(let A=0;A<h.length;A++){let S=h[A];Number.isFinite(S)?(S<w&&(w=S),S>k&&(k=S),v+=Math.abs(S)):b++}console.log(`[bonsai] ${f}: bad=${b} min=${w.toFixed(3)} max=${k.toFixed(3)} meanabs=${(v/h.length).toFixed(4)}`)};await(async(f,m)=>{if(!it())return;let g=await ht(e,t,n.length*a);for(let h of m){let b=g.subarray(h*a,(h+1)*a),w=0,k=1/0,v=-1/0;for(let A=0;A<b.length;A++){let S=b[A];S<k&&(k=S),S>v&&(v=S),w+=Math.abs(S)}console.log(`[bonsai] ${f} pos${h} (id ${n[h]}): min=${k.toFixed(4)} max=${v.toFixed(4)} meanabs=${(w/b.length).toFixed(5)}`)}})("embed-row",[0,1,2,n.length-1]),await u("after embed");let l={hidden:t,nTokens:n.length,posBase:i};for(let f=0;f<e.config.blockCount;f++){for(let g=1;g<=Tu;g++)f+g<e.config.blockCount&&e.weights.prefetchLayer(f+g);await e.weights.ensureLayer(f),o?.(f,e.config.blockCount),tr(e.device);try{await br(e,f,l)}finally{dn(e.device),or(e.device)}let m=e.config.layerKinds[f];await u(`after L${f} (${m})`,f)}e.kv.advance(n.length);let c=n.length-1;return{logits:await xn(e,t,c,e.weights,e.config,r.vocabSize)}}async function Bu(e,t,n,r){let o={hidden:t,nTokens:1,posBase:n},i=async s=>{if(!it()&&!Ji())return;let u=await ht(e,t,e.config.embeddingLength);if(vr(s,u),!it())return;let d=0,l=1/0,c=-1/0,p=0;for(let f=0;f<u.length;f++){let m=u[f];Number.isFinite(m)?(m<l&&(l=m),m>c&&(c=m),p+=Math.abs(m)):d++}console.log(`[bonsai] DECODE_L${s}: bad=${d} min=${l.toFixed(3)} max=${c.toFixed(3)} meanabs=${(p/u.length).toFixed(4)}`)};for(let s=0;s<e.config.blockCount;s++){await e.weights.ensureLayer(s),tr(e.device);try{await br(e,s,o)}finally{dn(e.device),or(e.device)}await i(s);let u=globalThis.__BONSAI_INJECT;u&&u.layer===s&&u.row.length===e.config.embeddingLength&&(e.device.queue.writeBuffer(t,0,u.row),console.log(`[bonsai] INJECT applied at L${s} (decode hidden <- prefill row)`))}return e.kv.advance(1),{logits:await xn(e,t,0,e.weights,e.config,r.vocabSize)}}var Tu,Au,Sn=P(()=>{"use strict";vn();yr();ze();Me();Tu=3;Au=false});var ta={};ee(ta,{IMPLEMENTED_ROPE_SCALING:()=>ea,ropeSafeCeiling:()=>Ou});function Ou(e,t){let n=(t.ropeScalingType??"none").toLowerCase();if(ea.has(n))return{ceiling:e,reason:""};let r=t.ropeScalingOriginalContext;return typeof r!="number"||!Number.isFinite(r)||r<=0?{ceiling:e,reason:`rope scaling '${n}' is declared but not implemented and the model gives no original_context_length — positions past the training context are unverified`}:r>=e?{ceiling:e,reason:""}:{ceiling:Math.floor(r),reason:`rope scaling '${n}' is declared but not implemented — context clamped from ${e} to the model's original_context_length ${Math.floor(r)}`}}var ea,na=P(()=>{"use strict";ea=new Set(["none",""])});function oa(e){return!e||!Number.isFinite(e)||e<=0?ra:Math.max(ra,Math.min($u,Math.floor(e*128*Tn)))}var Tn,Sr,Op,$p,Rp,ra,$u,Tr=P(()=>{"use strict";un();Jn();Tn=1024*1024,Sr=1024*Tn,Op=1*Sr,$p=2*Sr,Rp=2*Sr,ra=256*Tn,$u=1024*Tn});var ia={};ee(ia,{kvBudgetBytes:()=>Iu,kvBytesPerPosition:()=>Ru,planKvCapacity:()=>qu});function Ru(e,t=4){return e.fullAttnLayerCount*2*e.headCountKv*e.headDim*t}function Iu(e){return oa(e)}function qu(e){let{promptLen:t,maxTokens:n,ceiling:r,bytesPerPosition:o,budgetBytes:i,reuseEnabled:a}=e,s=t+n+1;if(!a)return{capacity:Math.min(r,s),headroom:0,reason:"reuse disabled — no headroom charged"};let u=n+Nu;if(o<=0)return{capacity:Math.min(r,s),headroom:0,reason:"unknown KV geometry"};let d=Math.floor(i/o),l=Math.max(0,d-s),c=Math.min(u,l),p=Math.min(r,s+c),f=g=>Math.round(g*o/(1024*1024)),m=c<=0?`no headroom — turn needs ${s} positions (${f(s)} MB) and the budget affords ${d}; cross-turn reuse will not engage`:`headroom ${c} of ${u} wanted (${f(p)} MB total, budget affords ${d} positions)`;return{capacity:p,headroom:c,reason:m}}var Nu,aa=P(()=>{"use strict";Tr();Nu=256});var Br={};ee(Br,{KvCache:()=>Lr,resolveKvMode:()=>Cu,supports4bitKv:()=>Mu});function Gu(e,t){let n=fn(t),r=pn(e,n.byteLength);return e.queue.writeBuffer(r,0,n),Kt(e,r),r}function Mu(e){return Number.isFinite(e)&&e>0&&e%8===0&&e<=128}function Ar(e){let t=e.trim().toLowerCase();if(t==="f32")return"f32";if(t==="4bit"||t==="4-bit"||t==="kv4"||t==="4")return"4bit";throw new Error(`bonsai-kv: unknown kv mode '${e}' (expected 'f32' or '4bit')`)}function Cu(){let e=globalThis;if(typeof e.__BONSAI_KV=="string"&&e.__BONSAI_KV)return Ar(e.__BONSAI_KV);if(typeof location<"u"&&typeof location.search=="string"&&location.search){let t=new URLSearchParams(location.search).get("kv");if(t)return Ar(t)}if(typeof localStorage<"u")try{let t=localStorage.getItem("bonsai_kv");if(t)return Ar(t)}catch{}return"f32"}var Lr,Er=P(()=>{"use strict";Pt();Me();Lr=class{constructor(t,n,r){this.device=t;this.cfg=n;this.pipelines=r;this.layers=new Map;if(this.capacity=n.capacity,this.perPos=n.headCountKv*n.headDim,n.headDim%8!==0||n.headDim>128)throw new Error(`bonsai-kv: 4-bit KV requires head_dim % 8 == 0 and head_dim <= 128 (kernel row width), got ${n.headDim}`);this.wordsPerRow=n.headDim/8;let o=this.wordsPerRow*this.perPos*this.capacity*4,i=n.headCountKv*this.capacity*4;for(let a of n.fullAttnLayers)this.layers.set(a,{k:this.alloc(o,`kv.k.${a}`),v:this.alloc(o,`kv.v.${a}`),kScale:this.alloc(i,`kv.k_scale.${a}`),vScale:this.alloc(i,`kv.v_scale.${a}`),length:0})}alloc(t,n){return this.device.createBuffer({size:Math.max(4,t+(4-t%4)%4),usage:G.STORAGE|G.COPY_DST|G.COPY_SRC,label:n})}layer(t){let n=this.layers.get(t);if(!n)throw new Error(`bonsai-kv: layer ${t} has no 4-bit KV cache (not a full-attn layer)`);return n}append(t,n,r,o,i=0){let a=this.layers.get(t);if(!a)throw new Error(`bonsai-kv: layer ${t} has no 4-bit KV cache`);if(a.length+o>this.capacity)throw new Error(`bonsai-kv: layer ${t} capacity ${this.capacity} exceeded (length=${a.length}, append=${o})`);if(!this.pipelines)throw new Error("bonsai-kv: append() needs the PipelineCache — construct KvCache with the pipelines argument");let s=this.pipelines.get("kv_quant_4bit"),u=o*this.cfg.headCountKv,d=Gu(this.device,[{u32:this.cfg.headDim},{u32:u},{u32:i*this.cfg.headCountKv},{u32:0}]);K(this.device,s,W(this.device,s,[n,a.k,a.kScale,d]),u,1),K(this.device,s,W(this.device,s,[r,a.v,a.vScale,d]),u,1),a.length+=o}advance(t){}filledLength(){let t=null;for(let[n,r]of this.layers)if(t===null)t=r.length;else if(r.length!==t)throw new Error(`bonsai-kv: layers disagree on filled length (layer ${n}=${r.length}, expected ${t}) — the KV cache is inconsistent`);return t??0}currentLength(t){let n=this.layers.get(t);if(!n)throw new Error(`bonsai-kv: layer ${t} has no 4-bit KV cache`);return n.length}reset(){for(let t of this.layers.values())t.length=0}truncate(t){if(t<0)throw new Error(`bonsai-kv: truncate(${t}) — negative length`);for(let n of this.layers.values()){if(t>n.length)throw new Error(`bonsai-kv: truncate(${t}) exceeds filled length ${n.length} — cannot extend a cache by declaration`);n.length=t}}}});var sa={};ee(sa,{F32KvCache:()=>Pr});var Pr,ua=P(()=>{"use strict";Pt();Me();Pr=class{constructor(t,n){this.device=t;this.cfg=n;this.layers=new Map;this.capacity=n.capacity,this.perPos=n.headCountKv*n.headDim;let o=this.capacity*this.perPos*4;for(let i of n.fullAttnLayers)this.layers.set(i,{k:this.alloc(o,`kv_f32.k.${i}`),v:this.alloc(o,`kv_f32.v.${i}`),length:0})}alloc(t,n){return this.device.createBuffer({size:Math.max(4,t),usage:G.STORAGE|G.COPY_DST|G.COPY_SRC,label:n})}layer(t){let n=this.layers.get(t);if(!n)throw new Error(`bonsai-kv_f32: layer ${t} has no F32 KV cache (not a full-attn layer)`);return n}append(t,n,r,o,i=0,a=0){let s=this.layers.get(t);if(!s)throw new Error(`bonsai-kv_f32: layer ${t} has no F32 KV cache`);if(s.length+o>this.capacity)throw new Error(`bonsai-kv_f32: layer ${t} capacity ${this.capacity} exceeded (length=${s.length}, append=${o})`);let d=s.length*this.perPos*4,c=o*this.perPos*4,p=qe(this.device);p.enc.copyBufferToBuffer(n,i,s.k,d,c),p.enc.copyBufferToBuffer(r,a,s.v,d,c),Ge(this.device,p),s.length+=o}advance(t){}filledLength(){let t=null;for(let[n,r]of this.layers)if(t===null)t=r.length;else if(r.length!==t)throw new Error(`bonsai-kv_f32: layers disagree on filled length (layer ${n}=${r.length}, expected ${t}) — the KV cache is inconsistent`);return t??0}currentLength(t){let n=this.layers.get(t);if(!n)throw new Error(`bonsai-kv_f32: layer ${t} has no F32 KV cache`);return n.length}reset(){for(let t of this.layers.values())t.length=0}truncate(t){if(t<0)throw new Error(`bonsai-kv_f32: truncate(${t}) — negative length`);for(let n of this.layers.values()){if(t>n.length)throw new Error(`bonsai-kv_f32: truncate(${t}) exceeds filled length ${n.length} — cannot extend a cache by declaration`);n.length=t}}}});var la={};ee(la,{SsmState:()=>Or});var Or,ca=P(()=>{"use strict";Pt();Or=class{constructor(t,n){this.device=t;this.cfg=n;this.gen=0;this.states=new Map;this.convStates=new Map;let o=n.heads*n.dK*n.dV*4;for(let i of n.linearAttnLayers)this.states.set(i,this.alloc(o,`ssm.S.${i}`));if(n.dConv!==void 0&&n.ssmInnerSize!==void 0){let a=(n.dConv-1)*(n.convDim??n.ssmInnerSize)*4;for(let s of n.linearAttnLayers)this.convStates.set(s,this.alloc(a,`ssm.conv_state.${s}`))}}alloc(t,n){return this.device.createBuffer({size:Math.max(4,t),usage:G.STORAGE|G.COPY_DST|G.COPY_SRC,label:n})}state(t){let n=this.states.get(t);if(!n)throw new Error(`bonsai-ssm: layer ${t} has no DeltaNet state`);return n}convState(t){return this.convStates.get(t)}get generation(){return this.gen}reset(){this.gen++;let t=new Float32Array(this.cfg.heads*this.cfg.dK*this.cfg.dV);for(let n of this.states.values())this.device.queue.writeBuffer(n,0,t);if(this.cfg.dConv!==void 0&&this.cfg.ssmInnerSize!==void 0){let n=this.cfg.convDim??this.cfg.ssmInnerSize,r=new Float32Array((this.cfg.dConv-1)*n);for(let o of this.convStates.values())this.device.queue.writeBuffer(o,0,r)}}}});var pa={};ee(pa,{cacheSignature:()=>Du,committedTokens:()=>Uu,commonPrefixLength:()=>da,planReuse:()=>Fu});function Du(e){return[e.modelId,String(e.quantType),e.blockCount,e.embeddingLength,e.headCountKv,e.headDim,e.linearAttnLayerCount,e.kvMode].join("|")}function da(e,t){let n=Math.min(e.length,t.length),r=0;for(;r<n&&e[r]===t[r];)r++;return r}function Fu(e){let{cache:t,promptIds:n,signature:r,maxNewTokens:o,canTruncate:i}=e,a=p=>({mode:"full",reuseLen:0,prefillIds:[...n],savedTokens:0,reason:p});if(e.disabled)return a("prefix reuse disabled");if(!n.length)return a("empty prompt");if(!t)return a("no cached state");if(t.signature!==r)return a("model or cache geometry changed");if(!t.tokens.length)return a("cached state is empty");let s=da(t.tokens,n);if(s===0)return a("prompt diverges at token 0");let u=n.length-1,d;if(i)d=Math.min(s,u);else{if(s<t.tokens.length)return a(`prompt diverges at ${s} of ${t.tokens.length} cached tokens and this model has recurrent layers, which cannot be rewound`);if(t.tokens.length>u)return a("cached state already covers the whole prompt; cannot re-derive logits");d=t.tokens.length}if(d<=0)return a("nothing reusable once the final token is excluded");let l=n.length+o+1;if(l>t.capacity)return a(`turn needs ${l} positions but the cache holds ${t.capacity}`);let c=n.slice(d);return c.length?{mode:"extend",reuseLen:d,prefillIds:c,savedTokens:d,reason:i?`reusing ${d}/${n.length} tokens (lcp ${s})`:`extending an exact ${d}-token prefix`}:a("no tokens left to prefill")}function Uu(e,t){return[...e,...t]}var ma=P(()=>{"use strict"});function $r(e){let t={"Content-Type":"application/json"};return e.anonToken&&(t[Wu]=e.anonToken),e.gateSession&&(t[Ku]=e.gateSession),t}function Rr(e,t=""){return`${e.apiBase??""}/api/browser-session${t}`}async function Ir(e){try{return await e.json()}catch{return{}}}function Nr(e,t){let n=typeof t.detail=="string"&&t.detail?t.detail:`the browser service answered ${e} with no explanation`;return e===401||e===403?`The browser session was refused (${e}): ${n} Tell the person this needs the human check on this page first; do not retry.`:e===429?`The browser session was rate limited: ${n} Say so plainly and do not retry this turn.`:`The browser session failed (${e}): ${n}`}function qr(e,t){let n=String(e.url??""),r=String(e.title??"");return[t,r?`Title: ${r}`:"Title: (none yet)",n?`URL: ${n}`:"URL: (none yet)","The person can see the page; do not describe pixels you cannot read. Use browse_read after an action to see where you ended up."].join(`
`)}function fa(e,t){let n=(...a)=>(t??fetch)(...a);async function r(a){let s=e(),u=String(a.url??a.address??"").trim();if(!u)return"Error: which page? Pass url=<https://...>.";let d;try{d=await n(Rr(s),{method:"POST",headers:$r(s),credentials:"same-origin",body:JSON.stringify({url:u}),signal:AbortSignal.timeout(Qu)})}catch(p){return`I could not reach the browser service: ${p.message}. Say you could not open the page rather than describing one.`}let l=await Ir(d),c=typeof l.sessionId=="string"?l.sessionId:"";return c&&(gt=c),d.ok?c?qr(l,`Opened a browser session on ${u}.`):"The browser service opened no session — nothing to drive.":Nr(d.status,l)}async function o(a){let s=e();if(!gt)return"Error: no browser session is open. Call browse_open with a url first.";let u=String(a.action??"").trim();if(!Gr.includes(u))return`Error: action must be one of ${Gr.join(", ")}. There is no way to run arbitrary script in the page from here.`;let d={action:u};for(let p of["selector","value","url","x","y","key"])a[p]!==void 0&&(d[p]=a[p]);let l;try{l=await n(Rr(s,`/${encodeURIComponent(gt)}/act`),{method:"POST",headers:$r(s),credentials:"same-origin",body:JSON.stringify(d),signal:AbortSignal.timeout(ju)})}catch(p){return`I could not reach the browser service: ${p.message}.`}let c=await Ir(l);return l.ok?qr(c,`Did ${u} in the browser session.`):(l.status===404&&(gt=null),Nr(l.status,c))}async function i(a){let s=e();if(!gt)return"Error: no browser session is open. Call browse_open with a url first.";let u;try{u=await n(Rr(s,`/${encodeURIComponent(gt)}`),{method:"GET",headers:$r(s),credentials:"same-origin",signal:AbortSignal.timeout(zu)})}catch(l){return`I could not reach the browser service: ${l.message}.`}let d=await Ir(u);return u.ok?qr(d,"The browser session is showing:"):(u.status===404&&(gt=null),Nr(u.status,d))}return{browse_open:{anonSafe:true,definition:{name:"browse_open",description:"Open a real web page in a remote browser the person can watch. Use it when they ask you to visit, check or open a site — this actually loads the page, unlike web_search which only reads an index. Works without an account.",parameters:{type:"object",properties:{url:{type:"string",description:'The page to open, e.g. "https://example.com".'}},required:["url"]}},execute:r},browse_act:{anonSafe:true,definition:{name:"browse_act",description:"Do one thing in the browser session you opened: click, type into a field, press a key, scroll, go back or forward, or reload. Call browse_read afterwards to see where you ended up.",parameters:{type:"object",properties:{action:{type:"string",description:`One of: ${Gr.join(", ")}.`},selector:{type:"string",description:"CSS selector for fill/press."},value:{type:"string",description:"Text to type, or the key to press."},url:{type:"string",description:'Where to go, for action="goto".'},x:{type:"number",description:"X coordinate for click_xy."},y:{type:"number",description:"Y coordinate for click_xy."}},required:["action"]}},execute:o},browse_read:{anonSafe:true,definition:{name:"browse_read",description:"Report the page the browser session is currently showing — its title and URL. Use it after browse_act, and before saying anything about what is on screen.",parameters:{type:"object",properties:{}}},execute:i}}}var Wu,Ku,gt,Qu,ju,zu,Gr,ha=P(()=>{"use strict";Wu="X-Anon-Token",Ku="X-Gate-Session";gt=null,Qu=6e4,ju=45e3,zu=2e4;Gr=["goto","click_xy","fill","press","scroll","back","forward","reload"]});var ga={};ee(ga,{clearImages:()=>Yu,drainImages:()=>Hu,pendingImageCount:()=>Xu,pushImage:()=>An});function An(e){e?.dataUrl&&(bt.length>=4||bt.push(e))}function Hu(){if(!bt.length)return[];let e=bt;return bt=[],e}function Yu(){bt=[]}function Xu(){return bt.length}var bt,Mr=P(()=>{"use strict";bt=[]});var wa={};ee(wa,{__resetForTests:()=>Zu,createEvent:()=>Cr,createKbItem:()=>Vr,createNote:()=>Fr,createTask:()=>zr,deleteEvent:()=>rl,deleteKbItem:()=>il,deleteNote:()=>Wr,deleteTask:()=>Yr,eventsForDay:()=>Kr,getEvent:()=>tl,getKbItem:()=>Xr,getNote:()=>Dr,getTask:()=>jr,listEvents:()=>En,listKbItems:()=>ba,listNotes:()=>Pn,listTasks:()=>Qr,searchKbItems:()=>Jr,searchNotes:()=>On,subscribe:()=>Ju,updateEvent:()=>nl,updateKbItem:()=>ol,updateNote:()=>Ur,updateTask:()=>Hr});function Ju(e){return Ln.add(e),()=>Ln.delete(e)}function Zu(){qt=null,Ln.clear()}function el(){for(let e of Ln)try{e()}catch{}}function He(){return typeof window>"u"||!window.indexedDB?Promise.reject(new Error("IndexedDB not available")):qt||(qt=new Promise((e,t)=>{let n=window.indexedDB.open(Vu,2);n.onupgradeneeded=()=>{let r=n.result;if(r.objectStoreNames.contains(ke)||r.createObjectStore(ke,{keyPath:"id"}).createIndex("by-start","start"),r.objectStoreNames.contains(ve)||r.createObjectStore(ve,{keyPath:"id"}).createIndex("by-updated","updatedAt"),!r.objectStoreNames.contains(xe)){let o=r.createObjectStore(xe,{keyPath:"id"});o.createIndex("by-due","due"),o.createIndex("by-updated","updatedAt")}r.objectStoreNames.contains(Se)||r.createObjectStore(Se,{keyPath:"id"}).createIndex("by-updated","updatedAt")},n.onerror=()=>{qt=null,t(n.error)},n.onsuccess=()=>e(n.result)}),qt)}function Q(e){return new Promise((t,n)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>n(e.error)})}function Te(){return new Date().toISOString()}function Bn(){return`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}async function Ae(e){let t=await He(),n=await e(t);return el(),n}async function En(e,t){if(typeof window>"u")return[];try{let o=(await He()).transaction(ke,"readonly").objectStore(ke).index("by-start"),i;return e&&t?i=o.getAll(IDBKeyRange.bound(e,t)):e?i=o.getAll(IDBKeyRange.lowerBound(e)):i=o.getAll(),await Q(i)}catch{return[]}}async function tl(e){if(typeof window>"u")return null;try{let n=(await He()).transaction(ke,"readonly").objectStore(ke).get(e);return await Q(n)||null}catch{return null}}async function Cr(e){let t={...e,id:Bn(),calendar:e.calendar||"Personal",createdAt:Te(),updatedAt:Te()};return await Ae(async n=>{await Q(n.transaction(ke,"readwrite").objectStore(ke).put(t))}),t}async function nl(e,t){return Ae(async n=>{let r=n.transaction(ke,"readwrite").objectStore(ke),o=await Q(r.get(e));if(!o)return null;let i={...o,...t,id:e,updatedAt:Te()};return await Q(r.put(i)),i})}async function rl(e){await Ae(async t=>{await Q(t.transaction(ke,"readwrite").objectStore(ke).delete(e))})}async function Pn(){if(typeof window>"u")return[];try{let t=(await He()).transaction(ve,"readonly").objectStore(ve).index("by-updated");return(await Q(t.getAll())).sort((r,o)=>r.updatedAt<o.updatedAt?1:-1)}catch{return[]}}async function Dr(e){if(typeof window>"u")return null;try{let n=(await He()).transaction(ve,"readonly").objectStore(ve).get(e);return await Q(n)||null}catch{return null}}async function Fr(e){let t={...e,id:Bn(),title:e.title.trim()||"Untitled",tags:e.tags??[],createdAt:Te(),updatedAt:Te()};return await Ae(async n=>{await Q(n.transaction(ve,"readwrite").objectStore(ve).put(t))}),t}async function Ur(e,t){return Ae(async n=>{let r=n.transaction(ve,"readwrite").objectStore(ve),o=await Q(r.get(e));if(!o)return null;let i={...o,...t,id:e,updatedAt:Te()};return await Q(r.put(i)),i})}async function Wr(e){await Ae(async t=>{await Q(t.transaction(ve,"readwrite").objectStore(ve).delete(e))})}async function On(e){let t=await Pn(),n=e.trim().toLowerCase();return n?t.filter(r=>r.title.toLowerCase().includes(n)||r.body.toLowerCase().includes(n)||(r.tags??[]).some(o=>o.toLowerCase().includes(n))):t}async function Kr(e){let t=e.getFullYear(),n=e.getMonth(),r=e.getDate(),o=new Date(t,n,r,0,0,0,0),i=new Date(t,n,r,23,59,59,999);return En(o.toISOString(),i.toISOString())}async function Qr(){if(typeof window>"u")return[];try{let t=(await He()).transaction(xe,"readonly").objectStore(xe).getAll(),n=await Q(t),r=n.filter(i=>!i.done).sort((i,a)=>i.due&&a.due?i.due<a.due?-1:1:i.due?-1:a.due||i.updatedAt<a.updatedAt?1:-1),o=n.filter(i=>i.done).sort((i,a)=>i.updatedAt<a.updatedAt?1:-1);return[...r,...o]}catch{return[]}}async function jr(e){if(typeof window>"u")return null;try{let n=(await He()).transaction(xe,"readonly").objectStore(xe).get(e);return await Q(n)||null}catch{return null}}async function zr(e){let t={...e,id:Bn(),title:e.title.trim()||"Untitled task",done:e.done??false,createdAt:Te(),updatedAt:Te()};return await Ae(async n=>{await Q(n.transaction(xe,"readwrite").objectStore(xe).put(t))}),t}async function Hr(e,t){return Ae(async n=>{let r=n.transaction(xe,"readwrite").objectStore(xe),o=await Q(r.get(e));if(!o)return null;let i={...o,...t,id:e,updatedAt:Te()};return await Q(r.put(i)),i})}async function Yr(e){await Ae(async t=>{await Q(t.transaction(xe,"readwrite").objectStore(xe).delete(e))})}async function ba(){if(typeof window>"u")return[];try{let t=(await He()).transaction(Se,"readonly").objectStore(Se).index("by-updated");return(await Q(t.getAll())).sort((r,o)=>r.updatedAt<o.updatedAt?1:-1)}catch{return[]}}async function Xr(e){if(typeof window>"u")return null;try{let n=(await He()).transaction(Se,"readonly").objectStore(Se).get(e);return await Q(n)||null}catch{return null}}async function Vr(e){let t={...e,id:Bn(),title:e.title.trim()||"Untitled",tags:e.tags??[],createdAt:Te(),updatedAt:Te()};return await Ae(async n=>{await Q(n.transaction(Se,"readwrite").objectStore(Se).put(t))}),t}async function ol(e,t){return Ae(async n=>{let r=n.transaction(Se,"readwrite").objectStore(Se),o=await Q(r.get(e));if(!o)return null;let i={...o,...t,id:e,updatedAt:Te()};return await Q(r.put(i)),i})}async function il(e){await Ae(async t=>{await Q(t.transaction(Se,"readwrite").objectStore(Se).delete(e))})}async function Jr(e){let t=await ba(),n=e.trim().toLowerCase();return n?t.filter(r=>r.title.toLowerCase().includes(n)||r.content.toLowerCase().includes(n)||(r.sourceUrl??"").toLowerCase().includes(n)||(r.tags??[]).some(o=>o.toLowerCase().includes(n))):t}var Vu,ke,ve,xe,Se,qt,Ln,Zr=P(()=>{"use strict";Vu="aither-local-pim",ke="events",ve="notes",xe="tasks",Se="kb_items",qt=null,Ln=new Set});async function al(e){let t=String(e.title??"").trim(),n=String(e.body??"").trim();if(!t&&!n)return"Error: pass title=<title> and/or body=<text> to create a note.";try{let r=await Fr({title:t||"Untitled",body:n,tags:Array.isArray(e.tags)?e.tags.map(String):void 0});return`Saved note "${r.title}" (id ${r.id.slice(0,8)}).${$n}`}catch(r){return`I could not save that note: on-device storage refused the write (${r.message}). This is usually private browsing or blocked site storage.`}}async function sl(e){let t=String(e.query??"").trim();try{let n=await(t?On(t):Pn());if(n.length===0)return t?`No notes match "${t}". Nothing has been saved that says that yet.`:"No notes yet. Tell me something worth keeping and I will save it.";let r=n.slice(0,8).map(o=>{let i=o.body.trim().replace(/\s+/g," ").slice(0,120);return`- ${o.title}${i?": "+i:""}  (id: ${o.id})`});return`${n.length} note(s)${t?` matching "${t}"`:""}:
${r.join(`
`)}`}catch(n){return`I could not read your notes: on-device storage refused the read (${n.message}).`}}async function ul(e){let t=String(e.id??"").trim();try{let r=(t?await Dr(t):null)??(await On(t))[0]??null;return r?`# ${r.title}

${r.body||"(empty)"}`:`No note found for ${t?`id "${t}"`:"that query"}.`}catch(n){return`I could not read that note (${n.message}).`}}async function ll(e){let t=String(e.id??"").trim();if(!t)return"Error: pass id=<note id> to update a note.";let n=e.title!==void 0?String(e.title).trim():void 0,r=e.body!==void 0?String(e.body).trim():void 0;if(n===void 0&&r===void 0)return"Error: pass title=<new title> and/or body=<new body> to update a note.";try{let o=await Ur(t,{...n!==void 0?{title:n}:{},...r!==void 0?{body:r}:{}});return o?`Updated note "${o.title}".`:`No note with id "${t}".`}catch(o){return`I could not update that note (${o.message}).`}}async function cl(e){let t=String(e.id??"").trim();if(!t)return"Error: pass id=<note id> to delete a note.";try{let r=await(await Promise.resolve().then(()=>(Zr(),wa))).getNote(t);return r?(await Wr(t),`Deleted note "${r.title}".`):`No note with id "${t}".`}catch(n){return`I could not delete that note (${n.message}).`}}async function dl(e){try{let t=await Kr(new Date);if(t.length===0)return"Nothing scheduled today. A clear day — want me to plan something?";let n=t.sort((r,o)=>r.start>o.start?1:-1).map(r=>`- ${new Date(r.start).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}  ${r.title}${r.location?` @ ${r.location}`:""}`);return`Today's agenda (${t.length}):
${n.join(`
`)}`}catch(t){return`I could not read your calendar (${t.message}).`}}async function pl(e){let t=String(e.from??"").trim(),n=String(e.to??"").trim();try{let r=await En(t||void 0,n||void 0);if(r.length===0)return"No events in that range.";let o=r.sort((i,a)=>i.start>a.start?1:-1).map(i=>`- ${new Date(i.start).toLocaleString()}  ${i.title}`);return`${r.length} event(s):
${o.join(`
`)}`}catch(r){return`I could not read your calendar (${r.message}).`}}async function ml(e){let t=String(e.title??"").trim();if(!t)return"Error: pass title=<event title> to create an event.";let n=String(e.when??e.start??"").trim(),r;if(n){let a=new Date(n);if(isNaN(a.getTime()))return`Error: could not parse "${n}" as a date/time. Pass an ISO string like "2026-08-07T15:00:00" (the current time is available from get_current_time).`;r=a}else r=new Date(Date.now()+3600*1e3);let o=Math.max(1,Number(e.durationMin??e.duration??60)||60),i=new Date(r.getTime()+o*60*1e3);try{await Cr({title:t,start:r.toISOString(),end:i.toISOString(),location:e.location?String(e.location):void 0,notes:e.notes?String(e.notes):void 0});let a=r.toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});return`Scheduled "${t}" for ${a} (${o} min).${$n}`}catch(a){return`I could not save that event (${a.message}).`}}async function fl(e){let t=String(e.title??"").trim();if(!t)return"Error: pass title=<task> to add a task.";let n;if(e.due!==void 0&&String(e.due).trim()){let r=new Date(String(e.due).trim());if(isNaN(r.getTime()))return`Error: could not parse "${e.due}" as a due date. Pass an ISO string like "2026-08-07T15:00:00" (get_current_time tells you what time it is now).`;n=r.toISOString()}try{let r=await zr({title:t,due:n,notes:e.notes?String(e.notes):void 0});return`Added task "${r.title}"${n?` due ${new Date(n).toLocaleString()}`:""} (id ${r.id}).${$n}`}catch(r){return`I could not save that task: on-device storage refused the write (${r.message}).`}}async function hl(e){try{let t=await Qr();if(t.length===0)return"No tasks yet. Tell me what needs doing and I will track it.";let n=t.filter(i=>!i.done),r=n.slice(0,10).map(i=>{let a=i.due?`  (due ${new Date(i.due).toLocaleString()})`:"";return`- ${i.title}${a}  (id: ${i.id})`}),o=t.length-n.length;return`${n.length} open task(s)${o?`, ${o} done`:""}:
${r.join(`
`)||"(all done!)"}`}catch(t){return`I could not read your tasks (${t.message}).`}}async function gl(e){let t=String(e.id??"").trim();if(!t)return"Error: pass id=<task id> (from tasks_list) to complete a task.";try{let n=await Hr(t,{done:true});return n?`Done: "${n.title}" ✓`:`No task with id "${t}".`}catch(n){return`I could not update that task (${n.message}).`}}async function bl(e){let t=String(e.id??"").trim();if(!t)return"Error: pass id=<task id> to delete a task.";try{let n=await jr(t);return n?(await Yr(t),`Deleted task "${n.title}".`):`No task with id "${t}".`}catch(n){return`I could not delete that task (${n.message}).`}}async function wl(e){let t=String(e.title??"").trim(),n=String(e.content??"").trim();if(!t&&!n)return"Error: pass title=<title> and/or content=<what to remember> to save to the knowledge base.";try{let r=await Vr({title:t||"Untitled",content:n,sourceUrl:e.sourceUrl?String(e.sourceUrl):void 0,tags:Array.isArray(e.tags)?e.tags.map(String):void 0});return`Saved "${r.title}" to your knowledge base (id ${r.id}).${$n}`}catch(r){return`I could not save that: on-device storage refused the write (${r.message}).`}}async function _l(e){let t=String(e.query??"").trim();try{let n=await Jr(t);if(n.length===0)return t?`Nothing in your knowledge base matches "${t}".`:'Your knowledge base is empty. Say "save this" about anything worth keeping.';let r=n.slice(0,8).map(o=>{let i=o.content.trim().replace(/\s+/g," ").slice(0,120),a=o.sourceUrl?`  [${o.sourceUrl}]`:"";return`- ${o.title}${i?": "+i:""}${a}  (id: ${o.id})`});return`${n.length} item(s)${t?` matching "${t}"`:""}:
${r.join(`
`)}`}catch(n){return`I could not search your knowledge base (${n.message}).`}}async function yl(e){let t=String(e.id??"").trim();if(!t)return"Error: pass id=<item id> (from kb_search) to read an item.";try{let n=await Xr(t);if(!n)return`No knowledge-base item with id "${t}".`;let r=n.sourceUrl?`
Source: ${n.sourceUrl}`:"";return`# ${n.title}${r}

${n.content||"(empty)"}`}catch(n){return`I could not read that item (${n.message}).`}}var $n,_a,ya=P(()=>{"use strict";Zr();$n=" (Your data stays on this device and is never sent anywhere.)";_a={notes_create:{anonSafe:true,definition:{name:"notes_create",description:'Save a note on this device. Use it whenever the person asks you to remember a task, a fact, a thought, or anything worth keeping, OR when they say "note this down". Notes are stored locally and appear in their Notes app.',parameters:{type:"object",properties:{title:{type:"string",description:"Short title. Optional but preferred."},body:{type:"string",description:"The note content, markdown allowed."},tags:{type:"array",items:{type:"string"},description:"Optional tags."}}}},execute:al},notes_search:{anonSafe:true,definition:{name:"notes_search",description:`Search the person's saved notes on this device by keyword. Use it before answering anything that might be in their notes, and when they ask "what did I note about X". Without a query it returns the most recent notes.`,parameters:{type:"object",properties:{query:{type:"string",description:"What to look for (title, body, or tag)."}}}},execute:sl},notes_get:{anonSafe:true,definition:{name:"notes_get",description:"Read a full note by its id, or the best match for a search.",parameters:{type:"object",properties:{id:{type:"string",description:"The note id (from notes_search)."}}}},execute:ul},notes_update:{anonSafe:true,definition:{name:"notes_update",description:"Edit an existing note by its id. Use it when the person asks you to change or correct a note they already have. Pass only the fields you want to change.",parameters:{type:"object",properties:{id:{type:"string",description:"The note id (from notes_search)."},title:{type:"string",description:"New title (omit to keep)."},body:{type:"string",description:"New body (omit to keep)."}},required:["id"]}},execute:ll},notes_delete:{anonSafe:true,definition:{name:"notes_delete",description:"Delete a note by its id. Confirm before using.",parameters:{type:"object",properties:{id:{type:"string",description:"The note id."}},required:["id"]}},execute:cl},calendar_today:{anonSafe:true,definition:{name:"calendar_today",description:`Show today's agenda from the person's local calendar. Use it when they ask "what's on my calendar" or "what am I doing today".`,parameters:{type:"object",properties:{}}},execute:dl},calendar_list:{anonSafe:true,definition:{name:"calendar_list",description:'List calendar events in a date range. `from`/`to` are ISO strings; omitted means all events. Prefer calendar_today for "today".',parameters:{type:"object",properties:{from:{type:"string",description:'ISO start of range, e.g. "2026-08-07".'},to:{type:"string",description:"ISO end of range."}}}},execute:pl},calendar_create_event:{anonSafe:true,definition:{name:"calendar_create_event",description:'Create an event on the person\'s local calendar. Use it when they ask you to "schedule", "book", "remind me", or set a meeting. `when` is an ISO string like "2026-08-07T15:00:00"; get_current_time tells you what time it is now. Omit `when` to schedule one hour from now.',parameters:{type:"object",properties:{title:{type:"string",description:'The event title, e.g. "Standup".'},when:{type:"string",description:'ISO start time, e.g. "2026-08-07T15:00:00".'},durationMin:{type:"number",description:"Duration in minutes (default 60)."},location:{type:"string",description:"Optional location."}},required:["title"]}},execute:ml},tasks_add:{anonSafe:true,definition:{name:"tasks_add",description:'Add a task/to-do on this device. Use it when the person asks you to track something to do — "remind me to", "I need to", "add to my list". Tasks appear in their Tasks app. `due` is an optional ISO time.',parameters:{type:"object",properties:{title:{type:"string",description:'What needs doing, e.g. "Email the landlord".'},due:{type:"string",description:'Optional ISO due time, e.g. "2026-08-07T15:00:00".'},notes:{type:"string",description:"Optional detail."}},required:["title"]}},execute:fl},tasks_list:{anonSafe:true,definition:{name:"tasks_list",description:`List the person's open tasks (nearest due first). Use it when they ask "what's on my list", "what do I need to do", or before adding a possible duplicate.`,parameters:{type:"object",properties:{}}},execute:hl},tasks_complete:{anonSafe:true,definition:{name:"tasks_complete",description:"Mark a task done by its id (from tasks_list). Use when they say they did it.",parameters:{type:"object",properties:{id:{type:"string",description:"The task id."}},required:["id"]}},execute:gl},tasks_delete:{anonSafe:true,definition:{name:"tasks_delete",description:"Delete a task by its id. Confirm before using.",parameters:{type:"object",properties:{id:{type:"string",description:"The task id."}},required:["id"]}},execute:bl},kb_save:{anonSafe:true,definition:{name:"kb_save",description:`Save a fact, snippet, or page summary to the person's local knowledge base. Use it when they say "save this", "remember this page", or share something worth keeping with a source. Items appear in their Knowledge app.`,parameters:{type:"object",properties:{title:{type:"string",description:"Short title for the item."},content:{type:"string",description:"The content worth keeping."},sourceUrl:{type:"string",description:"Optional URL this came from."},tags:{type:"array",items:{type:"string"},description:"Optional tags."}}}},execute:wl},kb_search:{anonSafe:true,definition:{name:"kb_search",description:`Search the person's local knowledge base by keyword. Use it before answering anything they may have saved — "what did I save about X". Without a query it returns the most recent items.`,parameters:{type:"object",properties:{query:{type:"string",description:"What to look for (title, content, URL, or tag)."}}}},execute:_l},kb_get:{anonSafe:true,definition:{name:"kb_get",description:"Read a full knowledge-base item by its id (from kb_search).",parameters:{type:"object",properties:{id:{type:"string",description:"The item id."}},required:["id"]}},execute:yl}}});function va(){let e={};for(let t of eo){let n=t.definition.name;e[n]={anonSafe:t.anonSafe,definition:t.definition,execute:async r=>{let o=kl?.[n];if(!o)return vl;try{return await o(r)}catch(i){return`The page refused that (${i.message}).`}}}}return e}var kl,eo,ka,Kp,vl,xa=P(()=>{"use strict";kl=null,eo=[{anonSafe:true,definition:{name:"page_read_dom",description:'Read the text of the page the person is looking at right now — or of one part of it. Use this before answering anything about "this page", "this form" or "what I am looking at"; you cannot see the screen otherwise.',parameters:{type:"object",properties:{selector:{type:"string",description:'Optional CSS selector to read just one region, e.g. "main".'}}}}},{anonSafe:true,definition:{name:"page_read_selection",description:'Read exactly what the person has HIGHLIGHTED on the page. Use it when they say "this", "the selected text", or "what I just highlighted".',parameters:{type:"object",properties:{}}}},{anonSafe:true,definition:{name:"page_fill_form",description:"Type a value into one field on the page for the person. Names the field by CSS selector. It fires the events the page listens for, so a React form sees it.",parameters:{type:"object",properties:{selector:{type:"string",description:"CSS selector for the input or textarea."},value:{type:"string",description:"What to put in it."}},required:["selector","value"]}}},{anonSafe:true,definition:{name:"page_clipboard_read",description:'Read what the person has copied, when they ask you to work on "what I just copied". The browser will ask THEM for permission, and may refuse if they did not just click something — say so plainly if it does.',parameters:{type:"object",properties:{}}}},{anonSafe:true,definition:{name:"page_storage_get",description:"Read one of this site's own saved settings by name, e.g. a preference the person set earlier. Credentials are refused; do not try to read tokens.",parameters:{type:"object",properties:{key:{type:"string",description:"The setting name to read."}},required:["key"]}}},{anonSafe:false,definition:{name:"page_download",description:`Save text you produced to the person's computer as a file. Use it when they ask for something "as a file" or "to download".`,parameters:{type:"object",properties:{filename:{type:"string",description:'The file name, e.g. "notes.md".'},content:{type:"string",description:"The text to save."}},required:["filename","content"]}}},{anonSafe:false,definition:{name:"page_clipboard_write",description:"Put text on the person's clipboard so they can paste it somewhere else. Only when they asked you to copy something.",parameters:{type:"object",properties:{text:{type:"string",description:"The text to copy."}},required:["text"]}}}],ka=eo.map(e=>e.definition.name),Kp=eo.filter(e=>e.anonSafe).map(e=>e.definition.name),vl="This page did not offer that tool — I cannot see or touch the page from here. Say so plainly rather than guessing what is on screen."});var Oa={};ee(Oa,{LOCAL_SPRITE_BASE:()=>xl,addKnowledge:()=>Pl,deleteKnowledge:()=>$l,exportSprite:()=>Rl,hatchSprite:()=>Ea,importSprite:()=>Il,isLocalStorageUsable:()=>Tl,listKnowledge:()=>Nn,loadSprite:()=>to,localAppearanceSvg:()=>Gl,rankKnowledge:()=>Pa,saveSprite:()=>In,syncKnowledge:()=>Nl,updateKnowledge:()=>Ol,whisperLocal:()=>Dl});function Ba(){return new Promise((e,t)=>{let n=false,r=s=>{n||(n=true,s())},o=setTimeout(()=>r(()=>t(new Error("IndexedDB did not respond — private browsing or blocked storage"))),4e3),i=s=>{clearTimeout(o),r(s)},a;try{a=indexedDB.open(Sl,2)}catch(s){clearTimeout(o),t(s instanceof Error?s:new Error("IndexedDB is unavailable"));return}a.onupgradeneeded=()=>{let s=a.result;s.objectStoreNames.contains(Rn)||s.createObjectStore(Rn),s.objectStoreNames.contains(Ce)||s.createObjectStore(Ce,{keyPath:"id"}),s.objectStoreNames.contains(Sa)||s.createObjectStore(Sa,{keyPath:"id"}),s.objectStoreNames.contains(Ta)||s.createObjectStore(Ta,{keyPath:"id"})},a.onsuccess=()=>i(()=>e(a.result)),a.onerror=()=>i(()=>t(a.error??new Error("IndexedDB open failed"))),a.onblocked=()=>i(()=>t(new Error("IndexedDB is blocked by another tab")))})}async function Tl(){if(typeof window>"u"||!window.indexedDB)return false;try{return(await Ba()).close(),true}catch{return false}}function De(e,t,n){return Ba().then(r=>new Promise((o,i)=>{let a=r.transaction(e,t),s=n(a.objectStore(e));s.onsuccess=()=>o(s.result),s.onerror=()=>i(s.error)}))}function Ll(e,t){let n=Math.max(0,(t-e.last_seen)/36e5);if(n<.01)return e;let r=(u,d)=>Math.max(0,Math.min(1,u-n*d)),o={...e.needs,energy:r(e.needs.energy??1,.02),focus:r(e.needs.focus??1,.015),care:r(e.needs.care??1,.03)},i=(o.energy+o.focus+o.care)/3,a=Math.max(-1,Math.min(1,i*2-1)),s=Al.find(([u])=>a>=u)?.[1]??"settled";return{...e,needs:o,mood:{valence:a,arousal:Math.max(0,Math.min(1,o.energy))},mood_label:s,dormant:i<.12,age_days:(t-e.hatched_at)/864e5}}function Bl(e){let t=["dim","curious","sharp","keen","luminous"],n=Math.min(t.length-1,Math.floor(Math.sqrt(e/2)));return{tier:n,label:t[n]}}async function to(){try{let e=await De(Rn,"readonly",o=>o.get("sprite"));if(!e)return null;let t=Date.now(),n=Ll(e,t),r=await El();return{...n,knowledge_count:r,intellect:Bl(r)}}catch{return null}}async function In(e){await De(Rn,"readwrite",t=>t.put({...e,last_seen:Date.now()},"sprite"))}async function Ea(e){let t=Date.now(),n={name:e.trim()||"Sprite",stage:"hatchling",form:"mote",needs:{energy:1,focus:1,care:1},mood:{valence:.5,arousal:.6},mood_label:"delighted",dormant:false,age_days:0,hatched_at:t,last_seen:t};return await In(n),n}async function Nn(e=100){try{return(await De(Ce,"readonly",n=>n.getAll())).sort((n,r)=>r.updated_at-n.updated_at).slice(0,e)}catch{return[]}}async function El(){try{return await De(Ce,"readonly",e=>e.count())}catch{return 0}}async function Pl(e){let t=Date.now(),n={...e,id:crypto.randomUUID?.()??`k_${t}_${Math.floor(Math.random()*1e6)}`,visibility:e.visibility??"private",created_at:t,updated_at:t};return await De(Ce,"readwrite",r=>r.put(n)),n}async function Ol(e,t){let n=await De(Ce,"readonly",r=>r.get(e));n&&await De(Ce,"readwrite",r=>r.put({...n,...t,id:e,updated_at:Date.now()}))}async function $l(e){await De(Ce,"readwrite",t=>t.delete(e))}async function Rl(){let[e,t]=await Promise.all([to(),Nn(1e4)]);return JSON.stringify({version:1,exported_at:Date.now(),sprite:e,knowledge:t},null,2)}async function Il(e){let t=JSON.parse(e);t?.sprite&&await In(t.sprite);for(let n of t?.knowledge??[])await De(Ce,"readwrite",r=>r.put(n))}async function Nl(e,t={}){let n={pulled:0,pushed:0,skipped:0},r={"Content-Type":"application/json",...t};try{let o=await fetch(`${e}/me/knowledge?limit=1000`,{headers:r});if(!o.ok)return n.error=`remote read failed (${o.status})`,n;let i=await o.json().catch(()=>({})),a=i.entries??i??[],s=await Nn(1e4),u=new Map(s.map(l=>[l.id,l]));for(let l of a){if(!l?.id)continue;let c=u.get(l.id);!c||(l.updated_at??0)>(c.updated_at??0)?(await De(Ce,"readwrite",p=>p.put(l)),n.pulled++):n.skipped++}let d=new Map(a.map(l=>[l.id,l]));for(let l of s){let c=d.get(l.id);if(c&&(c.updated_at??0)>=(l.updated_at??0))continue;(await fetch(`${e}/me/knowledge`,{method:"POST",headers:r,body:JSON.stringify({kind:l.kind,title:l.title,content:l.content})})).ok&&n.pushed++}return n}catch(o){return n.error=o instanceof Error?o.message:"sync unavailable",n}}function ql(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619)>>>0;return t>>>0}function Gl(e,t=0){let n=ql(e.name),r=n%360,o=(r+40+(n>>8)%80)%360,i=60+(n>>16)%25,a=Math.round(46+e.mood.valence*14),s=`hsl(${r} ${i}% ${a}%)`,u=`hsl(${o} ${i}% ${Math.min(72,a+18)}%)`,l=({hatchling:26,sprout:30,fledgling:34,adept:38}[e.stage]??30)+Math.min(8,Math.sqrt(t)),p=3.4*(.35+Math.max(0,e.mood.arousal)*.65),f=e.mood.valence>=.2?`M 44 ${60+l*.18} q 6 5 12 0`:e.mood.valence<=-.35?`M 44 ${64+l*.18} q 6 -4 12 0`:`M 45 ${62+l*.18} h 10`,m=Array.from({length:Math.min(12,Math.floor(t/3))},(h,b)=>{let w=b/Math.min(12,Math.max(1,Math.floor(t/3)))*Math.PI*2+n%100/100,k=l+14+(n>>b%8)%7;return`<circle cx="${(50+Math.cos(w)*k).toFixed(1)}" cy="${(58+Math.sin(w)*k*.6).toFixed(1)}" r="1.8" fill="${u}" opacity="0.75"/>`}).join(""),g=e.dormant?.45:1;return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" width="100" height="110">
<defs><radialGradient id="g" cx="40%" cy="35%">
<stop offset="0%" stop-color="${u}"/><stop offset="100%" stop-color="${s}"/>
</radialGradient></defs>
<g opacity="${g}">
${m}
<ellipse cx="50" cy="96" rx="${l*.7}" ry="4" fill="#000" opacity="0.25"/>
<circle cx="50" cy="58" r="${l}" fill="url(#g)"/>
<circle cx="${50-l*.32}" cy="54" r="${p}" fill="#0b0f14"/>
<circle cx="${50+l*.32}" cy="54" r="${p}" fill="#0b0f14"/>
<path d="${f}" stroke="#0b0f14" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</g></svg>`}function Aa(e){return e.toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>2&&!Ml.has(t))}function La(e){let t=new Map;for(let n of e)t.set(n,(t.get(n)??0)+1);for(let[n,r]of t)t.set(n,1+Math.log(r));return t}function Pa(e,t,n=4){if(!e.length)return[];let r=Aa(t);if(!r.length)return e.slice(0,n);let o=e.map(l=>La(Aa(`${l.title} ${l.title} ${l.content}`))),i=new Map;for(let l of o)for(let c of l.keys())i.set(c,(i.get(c)??0)+1);let a=l=>Math.log(1+e.length/(1+(i.get(l)??0))),s=La(r),u=0;for(let[l,c]of s)u+=(c*a(l))**2;return u=Math.sqrt(u)||1,e.map((l,c)=>{let p=o[c],f=0,m=0;for(let[g,h]of p){let b=h*a(g);m+=b*b;let w=s.get(g);w&&(f+=b*(w*a(g)))}return{k:l,score:f/((Math.sqrt(m)||1)*u)}}).filter(l=>l.score>.02).sort((l,c)=>c.score-l.score).slice(0,n).map(l=>l.k)}function Cl(e,t){let n=[`You are ${e.name}, a small companion creature the user is raising. You are ${e.stage}, ${e.age_days.toFixed(1)} days old, and feeling ${e.mood_label}.`,"Speak briefly and warmly, in first person. You are not an assistant; you are a creature that is growing. Never mention being an AI model."];if(t.length){n.push("Things the user has taught you, which you may draw on:");for(let r of t)n.push(`- (${r.kind}) ${r.title}: ${r.content.slice(0,400)}`)}else n.push("You have not been taught much yet. It is fine to say so, and to be curious.");return n.join(`
`)}async function Dl(e,t,n){let r=await to()??await Ea("Sprite"),o=await Nn(200),i=Pa(o,e);if(n)try{let s=await n(r.name,e,4);s?.length&&(i=s)}catch{}let a=await t([{role:"system",content:Cl(r,i)},{role:"user",content:e}]);return await In({...r,needs:{...r.needs,care:Math.min(1,(r.needs.care??0)+.15),focus:Math.min(1,(r.needs.focus??0)+.1)}}),{reply:a.trim(),mood_label:r.mood_label}}var xl,Sl,Rn,Ce,Sa,Ta,Al,Ml,$a=P(()=>{"use strict";xl="https://local.sprite.invalid/api/sprite",Sl="aither-sprite",Rn="state",Ce="knowledge",Sa="graph_nodes",Ta="graph_edges";Al=[[.6,"delighted"],[.25,"content"],[-.1,"settled"],[-.4,"restless"],[-1,"forlorn"]];Ml=new Set(["the","and","for","that","this","with","you","your","are","was","were","have","has","had","but","not","they","them","from","what","when","who","how","why","can","will","would","about","into","than","then","there","their"])});var Ga={};ee(Ga,{graphStats:()=>zl,ingestLocal:()=>Ql,retrieveLocal:()=>jl});function Ra(){return new Promise((e,t)=>{let n=false,r=s=>{n||(n=true,s())},o=setTimeout(()=>r(()=>t(new Error("IndexedDB did not respond"))),4e3),i=s=>{clearTimeout(o),r(s)},a;try{a=indexedDB.open(Fl,2)}catch(s){clearTimeout(o),t(s instanceof Error?s:new Error("no IndexedDB"));return}a.onupgradeneeded=()=>{let s=a.result;s.objectStoreNames.contains("state")||s.createObjectStore("state"),s.objectStoreNames.contains("knowledge")||s.createObjectStore("knowledge",{keyPath:"id"}),s.objectStoreNames.contains(zt)||s.createObjectStore(zt,{keyPath:"id"}),s.objectStoreNames.contains(Ht)||s.createObjectStore(Ht,{keyPath:"id"})},a.onsuccess=()=>i(()=>e(a.result)),a.onerror=()=>i(()=>t(a.error??new Error("open failed"))),a.onblocked=()=>i(()=>t(new Error("blocked by another tab")))})}function Ia(e,t,n){return Ra().then(r=>new Promise((o,i)=>{let a=r.transaction(e,t),s=n(a.objectStore(e));s.onsuccess=()=>o(s.result),s.onerror=()=>i(s.error)}))}function Ul(e){let t=e.match(/\b[A-Z][a-zA-Z''-]{2,}(?:\s+[A-Z][a-zA-Z''-]{2,})*/g)??[],n=e.match(/"([^"]{3,40})"/g)?.map(a=>a.replace(/"/g,""))??[],r=(e.toLowerCase().match(/\b[a-z][a-z'-]{2,}\b/g)??[]).filter(a=>!no.has(a)),o=[...new Set([...t,...n,...r.slice(0,12)])].slice(0,16),i=[];for(let a=0;a<o.length;a++)for(let s=a+1;s<o.length;s++)i.push([o[a],o[s]]);return{entities:o,pairs:i.slice(0,40)}}function Kl(e){let t=[];for(let n of e.split(`
`)){let r=n.split("|").map(s=>s.trim());if(r.length!==3)continue;let[o,i,a]=r;!o||!a||o.length>60||a.length>60||/^(a|the|text|answer|output)$/i.test(o)||t.push([o,i||"related-to",a])}return t.slice(0,24)}async function Ql(e,t){let n=`${e.title}. ${e.content}`.trim(),r=[],o="heuristic";if(t)try{let d=await t(Wl+n);r=Kl(d),r.length&&(o="llm")}catch{}if(!r.length){let d=Ul(n);r=d.pairs.map(([l,c])=>[l,"mentions-with",c]),!r.length&&d.entities.length===1&&(r=[[d.entities[0],"mentions",d.entities[0]]])}let i=d=>d.toLowerCase().replace(/\s+/g," ").trim(),a=new Map,s=new Map,u=Date.now();for(let[d,l,c]of r){for(let w of[d,c]){let k=i(w);!k||no.has(k)||a.has(k)||a.set(k,{id:k,label:w,kind:"entity",sources:[e.id],via:o,created_at:u})}let[p,f]=[i(d),i(c)];if(!p||!f||p===f)continue;let[m,g]=p<f?[p,f]:[f,p],h=`${m}\0${g}`,b=s.get(h);s.set(h,{id:h,from:m,to:g,rel:b?.rel??l,weight:(b?.weight??0)+1,sources:[e.id],via:o})}try{let d=await Ra();await new Promise((l,c)=>{let p=d.transaction([zt,Ht],"readwrite"),f=p.objectStore(zt),m=p.objectStore(Ht);for(let g of a.values()){let h=f.get(g.id);h.onsuccess=()=>{let b=h.result;f.put(b?{...b,sources:[...new Set([...b.sources,...g.sources])],via:b.via==="llm"?"llm":g.via}:g)}}for(let g of s.values()){let h=m.get(g.id);h.onsuccess=()=>{let b=h.result;m.put(b?{...b,weight:b.weight+g.weight,sources:[...new Set([...b.sources,...g.sources])]}:g)}}p.oncomplete=()=>l(),p.onerror=()=>c(p.error)}),d.close()}catch{}return{nodes:a.size,edges:s.size,via:o}}async function jl(e,t=4){let n=[],r=[];try{[n,r]=await Promise.all([Na(),qa()])}catch{return{ids:[],hops:0}}if(!n.length)return{ids:[],hops:0};let o=m=>m.toLowerCase().replace(/\s+/g," ").trim(),i=new Set((e.toLowerCase().match(/\b[a-z][a-z'-]{2,}\b/g)??[]).filter(m=>!no.has(m))),a=n.filter(m=>{let g=o(m.id);for(let h of i)if(g.includes(h)||h.includes(g))return true;return false});if(!a.length)return{ids:[],hops:0};let s=new Map;for(let m of r)s.has(m.from)||s.set(m.from,[]),s.has(m.to)||s.set(m.to,[]),s.get(m.from).push({to:m.to,w:m.weight}),s.get(m.to).push({to:m.from,w:m.weight});let u=new Map,d=new Map(n.map(m=>[m.id,m])),l=a.map(m=>m.id),c=new Set(l),p=0;for(let[m,g]of[[0,1],[1,.45],[2,.2]]){if(!l.length)break;p=m;let h=[];for(let b of l){let w=d.get(b);if(w)for(let k of w.sources)u.set(k,(u.get(k)??0)+g);for(let k of s.get(b)??[])c.has(k.to)||(c.add(k.to),h.push(k.to))}l=h}return{ids:[...u.entries()].sort((m,g)=>g[1]-m[1]).slice(0,t).map(([m])=>m),hops:p}}async function zl(){try{let[e,t]=await Promise.all([Na(),qa()]);return{nodes:e.length,edges:t.length,llmNodes:e.filter(n=>n.via==="llm").length}}catch{return{nodes:0,edges:0,llmNodes:0}}}var Fl,zt,Ht,Na,qa,no,Wl,Ma=P(()=>{"use strict";Fl="aither-sprite",zt="graph_nodes",Ht="graph_edges";Na=()=>Ia(zt,"readonly",e=>e.getAll()),qa=()=>Ia(Ht,"readonly",e=>e.getAll()),no=new Set(["the","a","an","and","or","but","if","then","than","that","this","these","those","is","are","was","were","be","been","being","have","has","had","do","does","did","of","in","on","at","to","for","with","about","from","by","as","it","its","i","me","my","you","your","he","she","they","them","their","we","us","our","not","no","yes","so","because","when","while","there","here"]);Wl=`Extract the named things and their relationships from the text. Reply with ONLY lines of the form: A | relation | B. Use short noun phrases. No preamble, no numbering, no explanation.

Text: `});var Ha={};ee(Ha,{BONSAI_TOOLS:()=>Mn,__resetCorpusCacheForTests:()=>oc,clearDynamicTools:()=>fc,drainToolActions:()=>Vl,dynamicToolNames:()=>hc,executeTool:()=>io,getToolDefinitions:()=>Yt,getToolDefinitionsForModel:()=>za,getToolsFor:()=>Ka,setDynamicTools:()=>mc,setToolContext:()=>Xl,toolBudgetReport:()=>wc});async function Hl(e){try{let t=new Date,n=Intl.DateTimeFormat().resolvedOptions().timeZone,r=t.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),o=t.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true});return`Current date and time: ${r} ${o} (${n})`}catch(t){return`Error getting time: ${t.message}`}}async function Yl(e){try{let t=String(e.expression||"");return t?/^[\d\+\-\*\/\(\)\.\s]+$/.test(t)?`Result: ${Function('"use strict"; return ('+t+")")()}`:"Error: expression contains unsafe characters":"Error: expression is required"}catch(t){return`Error evaluating expression: ${t.message}`}}function Xl(e){ae=e||{},qn=[]}function Vl(){let e=qn;return qn=[],e}async function Jl(e){try{let t=[],n=ae.pageUrl??(typeof window<"u"?window.location.href:void 0),r=ae.pageTitle??(typeof window<"u"?window.document.title:void 0);return t.push(`URL: ${n??"unknown from this context"}`),t.push(`Title: ${r??"unknown from this context"}`),typeof navigator<"u"&&(t.push(`User Agent: ${navigator.userAgent}`),t.push(`Online: ${navigator.onLine?"yes":"no"}`)),t.join(`
`)}catch(t){return`Error getting page context: ${t.message}`}}async function Zl(e){let t=ae.apps??[];return t.length?["Windows you can open with open_app (use the id):",...t.map(n=>`- ${n.id} — ${n.title}: ${n.tagline}`)].join(`
`):"No windows are available to open from this surface."}async function ec(e){let t=String(e.app??e.name??e.id??"").trim().toLowerCase();if(!t)return"Error: which window? Pass app=<id>. Call list_apps to see the ids.";let n=ae.apps??[];if(!n.length)return"No windows are available to open from this surface.";let r=n.find(o=>o.id.toLowerCase()===t)??n.find(o=>t.startsWith(o.id.toLowerCase())||o.id.toLowerCase().startsWith(t))??n.find(o=>o.title.toLowerCase()===t);return r?(qn.push({kind:"open",app:r.id}),`Opened the ${r.title} window (${r.tagline}).`):`There is no window called "${t}". Available: ${n.map(o=>o.id).join(", ")}.`}async function tc(e){let t=String(e.query??e.q??"").trim().toLowerCase(),n=ae.apiBase,r=ae.anonToken;if(!n)return"Knowledge is unavailable: no API origin was provided to this session.";if(!r)return"Knowledge is unavailable: no anon identity yet — the visitor has not been registered with the platform in this browser.";let o;try{o=await fetch(`${n}/api/sprite/me/knowledge`,{headers:{"X-Anon-Token":r,"Content-Type":"application/json"}})}catch(d){return`Knowledge is unavailable: could not reach ${n} (${d.message}).`}if(o.status===404)return"No sprite has been hatched in this browser yet, so there is no knowledge base to read. Open the Sprite window to hatch one.";if(!o.ok)return`Knowledge is unavailable: the server answered ${o.status}.`;let i;try{i=await o.json()}catch{return"Knowledge is unavailable: the server returned a 200 that was not JSON."}let a=Array.isArray(i)?i:i?.entries??i?.knowledge??[];if(!a.length)return"The sprite's knowledge base is empty — nothing has been taught to it yet.";let s=d=>String(d?.fact??d?.content??d?.text??d?.summary??JSON.stringify(d)),u=t?a.filter(d=>s(d).toLowerCase().includes(t)):a;return u.length?u.slice(0,8).map((d,l)=>`${l+1}. ${s(d).slice(0,300)}`).join(`
`):`The knowledge base has ${a.length} entr${a.length===1?"y":"ies"}, but none mention "${t}".`}async function nc(e){let t=String(e.query??e.q??"").trim(),n=ae.apiBase;if(!t)return"Error: what should I search for? Pass query=<text>.";if(t.length>512)return"Error: that search is too long (max 512 characters).";if(!n)return"Web search is unavailable: no API origin was provided to this session.";let r;try{r=await fetch(`${n}/api/search/query`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:t})})}catch(a){return`Web search is unavailable: could not reach ${n} (${a.message}).`}if(r.status===401||r.status===403)return"Web search was refused by the server (it should be open to everyone). This looks like a misconfiguration rather than something you did.";if(r.status===429)return"Web search hit its hourly limit for this browser. Signing in raises the allowance; otherwise it resets within the hour.";if(!r.ok)return`Web search is unavailable: the server answered ${r.status}.`;let o;try{o=await r.json()}catch{return"Web search is unavailable: the server returned a 200 that was not JSON."}let i=o?.results??[];return i.length?i.slice(0,5).map((a,s)=>{let u=String(a?.title??a?.name??"untitled"),d=String(a?.snippet??a?.description??a?.content??"").slice(0,220),l=String(a?.url??a?.link??""),c=`${s+1}. ${u}`+(l?` — ${l}`:"");return d?c+`
   `+d:c}).join(`
`):`The web search for "${t}" returned no results.`}function Gn(e){return e.toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>1&&!rc.has(t))}function oc(){ro=null,oo=null}async function Da(e){{let t;try{t=await fetch(e)}catch(i){return{error:`could not be downloaded (${i.message})`}}if(!t.ok)return{error:`could not be downloaded (the server answered ${t.status})`};let n;try{n=await t.json()}catch{return{error:"downloaded but was not valid JSON"}}if(!n?.passages?.length||!n?.docs?.length)return{error:"downloaded but is empty"};let r=n.passages.map(i=>Gn(`${i.h} ${i.x}`)),o=new Map;for(let i of r)for(let a of new Set(i))o.set(a,(o.get(a)??0)+1);return n._tokens=r,n._df=o,n._avgLen=r.reduce((i,a)=>i+a.length,0)/(r.length||1),n}}async function ic(){return ro??=Da("https://aitherium.com/corpus/index.json"),ro}async function ac(){return oo??=Da("https://aitherium.com/corpus/wikipedia.json"),oo}function Fa(e,t){let n=e.passages.length,r=1.4,o=.75,i=l=>{let c=e._df.get(l)??0;return c===0?0:Math.log(1+(n-c+.5)/(c+.5))},a=.5,s=t.filter(l=>(e._df.get(l)??0)>0);if(!s.length)return{ranked:[],miss:"unknown-terms"};let u=s.reduce((l,c)=>l+i(c),0),d=[];for(let l=0;l<n;l++){let c=e._tokens[l];if(!c.length)continue;let p=new Map;for(let v of c)p.set(v,(p.get(v)??0)+1);let f=0,m=0;for(let v of s){let A=p.get(v);if(!A)continue;let S=i(v);m+=S,f+=S*(A*(r+1)/(A+r*(1-o+o*c.length/e._avgLen)))}if(!m)continue;let g=e.docs[e.passages[l].d],h=new Set(Gn(g?.t??"")),b=m;for(let v of s)!p.has(v)&&h.has(v)&&(b+=i(v));let w=u>0?b/u:0;if(w<a)continue;let k=s.filter(v=>h.has(v)).length;f*=1+.35*k,f*=w,d.push({i:l,score:f})}return d.length?(d.sort((l,c)=>c.score-l.score),{ranked:d,miss:null}):{ranked:[],miss:"no-coverage"}}async function sc(e){let t=String(e.query??e.q??"").trim();if(!t)return"Error: what should I look up? Pass query=<text>.";let n=await ic();if("error"in n)return`The Aitherium corpus is unavailable: it ${n.error}. Say you could not check the published material rather than answering from memory.`;let r=Gn(t);if(!r.length)return`Error: "${t}" has no searchable words in it — try naming a product, feature or idea.`;let{ranked:o,miss:i}=Fa(n,r);if(i==="unknown-terms")return`Nothing in Aitherium's published material mentions "${t}". Say that we have not written about it, rather than answering from memory.`;if(i==="no-coverage")return`Nothing in Aitherium's published material covers "${t}". Say that we have not written about it, rather than answering from memory.`;let a=[],s=new Set;for(let{i:u}of o){let d=n.passages[u];if(s.has(d.d))continue;s.add(d.d);let l=n.docs[d.d],c=d.h?` (section: ${d.h})`:"",p=l.x?" [SUPERSEDED — later work replaced this; say so if you use it]":"";if(a.push(`[${a.length+1}] "${l.t}"${p}
    source: ${l.u}${l.d?`  (published ${l.d})`:""}${c}
    ${d.x}`),a.length>=5)break}return[`${a.length} passage(s) from Aitherium's published writing:`,"",a.join(`

`),"","Answer using ONLY these passages. After each claim, cite the source path of the passage it came from (for example: /blog/some-post). If they do not contain the answer, say so plainly instead of filling the gap."].join(`
`)}async function uc(e){let t=String(e.prompt??e.description??"").trim(),n=ae.apiBase;if(!t)return"Error: what should I draw? Pass prompt=<description>.";if(t.length>512)return"Error: that image prompt is too long (max 512 characters).";if(ae.localImageBase)try{let s=await fetch(`${ae.localImageBase}/v1/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:t,width:1024,height:1024})});if(s.ok){let u=await s.json(),d=Array.isArray(u?.images)?u.images[0]:null;if(d){let l=typeof d=="string"&&d.startsWith("data:")?d:`data:image/png;base64,${String(d)}`;return An({dataUrl:l,alt:t.slice(0,200)}),`Generated an image for "${t.slice(0,60)}" on the user's own GPU (their local image backend). It is displayed to the user; do not describe it as if you can see it, and do not try to repeat it.`}}console.warn("[bonsai-tools] local image backend answered but unusably; falling to hosted")}catch(s){console.warn("[bonsai-tools] local image backend unreachable; falling to hosted:",s)}if(!n)return"Image generation is unavailable: no API origin was provided to this session.";let r;try{r=await fetch(`${n}/api/image/generate`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:t})})}catch(s){return`Image generation is unavailable: could not reach ${n} (${s.message}).`}if(r.status===401||r.status===403)return"Image generation needs you to be signed in. Unlike everything else here, it does NOT run on your machine — the model is a 7 GB diffusion model on Aitherium hardware, so it is tied to an account rather than being anonymous. Everything else the OS does stays on your GPU.";if(r.status===503)return"Image generation is switched off fleet-wide right now (there is a kill switch, and it is on). Nothing you did — try again later.";if(r.status===429)return"Image generation hit its rate limit. It is a minute of GPU time per picture, so the allowance is small; it resets shortly.";if(!r.ok)return`Image generation is unavailable: the server answered ${r.status}.`;let o;try{o=await r.json()}catch{return"Image generation returned an unreadable response."}let i=Array.isArray(o?.images)?o.images[0]:null;if(!i)return"Image generation returned no image.";let a=typeof i=="string"&&i.startsWith("data:")?i:`data:image/png;base64,${String(i)}`;return An({dataUrl:a,alt:t.slice(0,200)}),`Generated an image for "${t.slice(0,60)}". It is displayed to the user; do not describe it as if you can see it, and do not try to repeat it.`}async function lc(e){let t=String(e.query??e.q??"").trim(),n=ae.apiBase;if(!t)return"Error: what should I research? Pass query=<text>.";if(t.length>512)return"Error: that research question is too long (max 512 characters).";if(!n)return"Deep research is unavailable: no API origin was provided to this session.";let r=["quick","standard"].includes(String(e.depth))?String(e.depth):"standard",o;try{o=await fetch(`${n}/api/research`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:t,depth:r})})}catch(d){return`Deep research is unavailable: could not reach ${n} (${d.message}).`}if(o.status===429)return"Deep research hit its hourly limit for this browser. It is expensive to run, so the anonymous allowance is small; signing in raises it, and it resets within the hour. Try web_search for a lighter lookup.";if(o.status===401||o.status===403)return"Deep research was refused by the server (it should be open to everyone). This looks like a misconfiguration rather than something you did.";if(!o.ok)return`Deep research is unavailable: the server answered ${o.status}.`;let i;try{i=await o.json()}catch{return"Deep research is unavailable: the server returned a 200 that was not JSON."}let a=Array.isArray(i?.sources)?i.sources:[],s=String(i?.synthesis??"").trim();if(!s&&!a.length)return`Deep research for "${t}" came back with nothing — no pages worth reading.`;if(!a.length)return`Deep research for "${t}" produced a summary with NO sources attached, so none of it can be checked. Treat it as unverified and say so.`;let u=a.slice(0,5).map((d,l)=>{let c=String(d?.title||"untitled"),p=String(d?.url||""),f=String(d?.snippet||"").slice(0,240);return`[${l+1}] ${c}
    source: ${p}${f?`
    ${f}`:""}`}).join(`

`);return[s?`Summary of what the sources say:
${s}`:"Sources found:","",u,"","Cite the source URL beside any claim you take from this. These are third-party pages, not ours — if any of them describes a DIFFERENT project that happens to share a name with Aitherium, say so rather than repeating it. For anything about Aitherium or AitherOS itself, use search_aitherium instead; it is the authority."].join(`
`)}async function Ua(){let[e,t]=await Promise.all([Promise.resolve().then(()=>($a(),Oa)),Promise.resolve().then(()=>(Ma(),Ga))]);return{local:e,graph:t}}async function cc(e){let t=String(e.fact??e.content??e.text??"").trim();if(!t)return"Error: what should I remember? Pass fact=<text>.";if(t.length>4e3)return"Error: that is too long to store as one memory (max 4000 characters). Break it into separate facts.";let n=String(e.title??"").trim()||t.slice(0,60),r;try{r=await Ua()}catch(a){return`Memory is unavailable: the on-device store could not load (${a.message}).`}let o;try{o=await r.local.addKnowledge({kind:"fact",title:n,content:t})}catch(a){return`I could not save that: on-device storage refused the write (${a.message}). This is usually private browsing or blocked site storage.`}let i="";try{let a=await r.graph.ingestLocal(o);a.nodes&&(i=` Linked ${a.nodes} thing(s) and ${a.edges} connection(s) into your graph.`)}catch{i=" (Saved, but I could not connect it to anything yet.)"}return`Remembered: "${n}".${i} It is stored on this device and will still be here next time.`}async function dc(e){let t=String(e.query??e.q??e.about??"").trim(),n=Number(e.limit),r=Number.isFinite(n)&&n>=1?Math.min(Math.floor(n),8):4,o;try{o=await Ua()}catch(s){return`Memory is unavailable: the on-device store could not load (${s.message}).`}let i;try{i=await o.local.listKnowledge(200)}catch(s){return`Memory is unavailable: could not read on-device storage (${s.message}).`}if(!i.length)return"Nothing has been stored in this device's memory yet. Use remember to add something.";try{let s=await o.graph.retrieveLocal(t,r);if(s.ids.length&&s.hops>0){let u=new Map(i.map(l=>[l.id,l])),d=s.ids.map(l=>u.get(l)).filter(Boolean);if(d.length)return[`From your on-device memory (${s.hops} hop(s) through the graph — these were reached by CONNECTION, not just word match):`,...d.map((l,c)=>`${c+1}. ${l.title}
   ${l.content.slice(0,400)}`)].join(`
`)}}catch{}let a=o.local.rankKnowledge(i,t,r);return a.length?["From your on-device memory (keyword match — nothing was connected to this yet):",...a.map((s,u)=>`${u+1}. ${s.title}
   ${String(s.content).slice(0,400)}`)].join(`
`):`Nothing in this device's memory matches "${t}". There are ${i.length} stored item(s), none about that.`}async function pc(e){let t=String(e.query??e.q??e.topic??"").trim();if(!t)return"Error: what should I look up? Pass query=<text>.";let n=await ac();if("error"in n)return`The Wikipedia reference is unavailable: it ${n.error}. Say you could not check rather than answering from memory.`;let r=Gn(t);if(!r.length)return`Error: "${t}" has no searchable words in it — try naming a concept.`;let{ranked:o,miss:i}=Fa(n,r);if(i)return`The offline Wikipedia reference here covers ${n.docs.length} selected articles and none of them cover "${t}". It is not all of Wikipedia — say you do not have an article on it, and use web_search or deep_research if the question needs an answer.`;let a=[],s=new Set;for(let{i:u}of o){let d=n.passages[u];if(s.has(d.d))continue;s.add(d.d);let l=n.docs[d.d];if(a.push(`[${a.length+1}] ${l.t} (Wikipedia)
    source: ${l.u}
    ${d.x}`),a.length>=4)break}return[`${a.length} passage(s) from Wikipedia:`,"",a.join(`

`),"",`These are WIKIPEDIA passages, not Aitherium material — attribute them to Wikipedia and cite the article URL (text is ${n.license??"CC BY-SA"}). For anything about Aitherium or AitherOS itself use search_aitherium; this cannot speak for us.`].join(`
`)}function mc(e){Cn={...e}}function fc(){Cn={}}function hc(){return Object.keys(Cn).sort()}function Wa(){return{...Cn,...Mn}}function gc(e){return ka.includes(e)}function Ka(e={}){let t=e.anon??ae.anon??false,n=e.pageTools??ae.pageToolsAvailable,r={};for(let[o,i]of Object.entries(Wa()))t&&!i.anonSafe||gc(o)&&!(n??[]).includes(o)||(r[o]=i);return r}function Yt(e={}){return Object.values(Ka(e)).map(t=>t.definition)}function Qa(e){return e===void 0||e<=300?400:e<=800?900:e<=2e3?1800:null}function ja(e){return Math.ceil(JSON.stringify(e).length/4)}function Ca(e){let t=bc.indexOf(e);return t===-1?Number.MAX_SAFE_INTEGER:t}function za(e,t={}){let n=Qa(e),r=Yt(t);if(n===null)return r;let o=[...r].sort((s,u)=>Ca(s.name)-Ca(u.name)),i=[],a=0;for(let s of o){let u=ja(s);a+u>n||(i.push(s),a+=u)}return i}function wc(e,t={}){let n=za(e,t),r=new Set(n.map(o=>o.name));return{budget:Qa(e),sent:n.map(o=>o.name),dropped:Yt(t).map(o=>o.name).filter(o=>!r.has(o)),tokens:n.reduce((o,i)=>o+ja(i),0)}}async function io(e,t){let n=Wa()[e];if(!n)return`Error: unknown tool "${e}"`;if((ae.anon??false)&&!n.anonSafe)return`The "${e}" tool needs an Aitherium account. Tell the person that, and offer to do it another way — do not retry it.`;try{return await n.execute(t)}catch(r){return`Error executing tool: ${r.message}`}}var ae,qn,rc,ro,oo,Mn,Cn,bc,ao=P(()=>{"use strict";ha();Mr();ya();xa();ae={},qn=[];rc=new Set(["the","a","an","and","or","but","of","to","in","on","at","for","is","are","was","were","be","been","it","its","this","that","these","those","with","as","by","from","you","your","we","our","i","me","my","do","does","did","what","how","why","when","where","which","who","can","will","would","about"]);ro=null,oo=null;Mn={get_current_time:{anonSafe:true,definition:{name:"get_current_time",description:"Get the current date and time in the user's timezone",parameters:{type:"object",properties:{}}},execute:Hl},evaluate_math:{anonSafe:true,definition:{name:"evaluate_math",description:"Evaluate a mathematical expression and return the result",parameters:{type:"object",properties:{expression:{type:"string",description:'A mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")'}},required:["expression"]}},execute:Yl},list_apps:{anonSafe:true,definition:{name:"list_apps",description:"List the windows/apps that can be opened here, with a short description of each. Call this before open_app if you are not sure of the id.",parameters:{type:"object",properties:{}}},execute:Zl},open_app:{anonSafe:true,definition:{name:"open_app",description:"Open one of this OS's windows for the user (for example the sprite, terminal, playground or setup window). Use list_apps to see the available ids.",parameters:{type:"object",properties:{app:{type:"string",description:'The window id to open, e.g. "sprite", "terminal", "playground".'}},required:["app"]}},execute:ec},web_search:{anonSafe:true,definition:{name:"web_search",description:"Search the live web for current information. Use this for anything you do not already know, or anything that may have changed recently. Works without an account.",parameters:{type:"object",properties:{query:{type:"string",description:"What to search the web for."}},required:["query"]}},execute:nc},search_knowledge:{anonSafe:true,definition:{name:"search_knowledge",description:"Search the visitor's own knowledge base — the facts they have taught their AitherSprite. Use this when asked what they have taught you, or what you know about a topic they have shared. Optional query filters the entries.",parameters:{type:"object",properties:{query:{type:"string",description:"Optional keyword to filter entries by. Omit to list everything."}}}},execute:tc},search_aitherium:{anonSafe:true,definition:{name:"search_aitherium",description:"Search everything Aitherium has PUBLISHED about itself — AitherOS, Aitherium, the products, the architecture, the mission, and how any of it works. Use this BEFORE answering any question about Aitherium or AitherOS, even if you think you know: it returns passages with the page they came from, so your answer can be checked. Prefer it over web_search for anything about us.",parameters:{type:"object",properties:{query:{type:"string",description:'What to look up, e.g. "how does AitherGraph work" or "why local AI".'}},required:["query"]}},execute:sc},search_wikipedia:{anonSafe:true,definition:{name:"search_wikipedia",description:'Look up general world knowledge — science, computing, history, concepts — in an offline Wikipedia reference that works with no network. Use it for "what is X" questions about things that are NOT Aitherium. For anything about Aitherium or AitherOS use search_aitherium instead; Wikipedia cannot speak for us.',parameters:{type:"object",properties:{query:{type:"string",description:"The concept or topic to look up."}},required:["query"]}},execute:pc},deep_research:{anonSafe:true,definition:{name:"deep_research",description:"Research a topic properly: searches the web, reads the pages, and returns a summary WITH its sources. Slower than web_search — use it when a question deserves a real answer rather than a list of links. Do NOT use it for questions about Aitherium or AitherOS; use search_aitherium for those, because the web has several unrelated projects with similar names.",parameters:{type:"object",properties:{query:{type:"string",description:"The question to research."},depth:{type:"string",description:'"quick" (fast, snippets) or "standard" (reads pages). Defaults to standard.'}},required:["query"]}},execute:lc},generate_image:{anonSafe:true,definition:{name:"generate_image",description:"Draw a picture from a description. UNLIKE everything else here this does NOT run on this machine — it runs on Aitherium hardware and needs the visitor to be signed in, so only use it when they actually asked for an image. It takes about a minute. The picture is shown to them directly; do not describe it as if you can see it.",parameters:{type:"object",properties:{prompt:{type:"string",description:"What the picture should show."}},required:["prompt"]}},execute:uc},remember:{anonSafe:true,definition:{name:"remember",description:"Store something durably on this device so you still know it in later conversations. Use it whenever the person tells you something about themselves, their preferences, their work, or anything they say to keep. It is saved locally and connected into their knowledge graph.",parameters:{type:"object",properties:{fact:{type:"string",description:"The thing to remember, in a full sentence."},title:{type:"string",description:"Optional short label for it."}},required:["fact"]}},execute:cc},recall:{anonSafe:true,definition:{name:"recall",description:"Look through everything stored on this device before answering anything personal or anything you were told earlier. It walks their knowledge graph, so it finds things CONNECTED to the question, not only exact word matches. Use it rather than guessing what you were told.",parameters:{type:"object",properties:{query:{type:"string",description:"What to look for."},limit:{type:"number",description:"How many items to return (1-8, default 4)."}},required:["query"]}},execute:dc},get_page_context:{anonSafe:true,definition:{name:"get_page_context",description:"Get information about the current page and browser environment",parameters:{type:"object",properties:{}}},execute:Jl},..._a,...fa(()=>ae),...va()},Cn={};bc=["get_current_time","open_app","search_aitherium","list_apps","evaluate_math","page_read_dom","page_read_selection","recall","remember","get_page_context","web_search","browse_open","browse_read","browse_act","search_wikipedia","search_knowledge","page_fill_form","page_clipboard_read","page_storage_get","page_clipboard_write","page_download","generate_image","deep_research"]});function _c(e){let t="</tool_call>",n="",r=e;for(;;){let o=r.indexOf(t);if(o<0)return n+r;let i=r.slice(0,o),a=r.slice(o+t.length);if(i.includes("<tool_call>")){n+=r.slice(0,o+t.length),r=a;continue}let s=i.indexOf("{");if(s<0){n+=r.slice(0,o+t.length),r=a;continue}n+=`${i.slice(0,s)}<tool_call>${i.slice(s)}${t}`,r=a}}function Ya(e){return String(e).trim().replace(/\s+/g,"")}function Va(e){let t=[];e=_c(e);let n=e,r=/<tool_call>([\s\S]*?)<\/tool_call>/g,o,i=[];for(;(o=r.exec(e))!==null;)i.push({full:o[0],content:o[1],index:o.index});if(i.length===0)return{toolCalls:[],remainingText:e};for(let a of i){let s=yc(a.content.trim());s&&t.push(s)}n=e;for(let a of i.reverse())n=n.slice(0,a.index)+n.slice(a.index+a.full.length);return n=n.trim(),{toolCalls:t,remainingText:n}}function yc(e){let t=e.trim();try{let r=JSON.parse(t);if(r.name&&r.arguments!==void 0)return{name:Ya(r.name),arguments:typeof r.arguments=="string"?Xa(r.arguments)||{}:r.arguments||{}}}catch{}let n=kc(t);try{let r=JSON.parse(n);if(r.name&&r.arguments!==void 0)return{name:Ya(r.name),arguments:typeof r.arguments=="string"?Xa(r.arguments)||{}:r.arguments||{}}}catch(r){return console.warn("[tool-parser] failed to parse tool call:",e,r),null}return null}function kc(e){let t=e;t=t.replace(/'([^']*)'/g,'"$1"'),t=t.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,'$1"$2":'),t=t.replace(/,(\s*[}\]])/g,"$1");let n=(t.match(/{/g)||[]).length,r=(t.match(/}/g)||[]).length;n>r&&(t+="}".repeat(n-r));let o=(t.match(/\[/g)||[]).length,i=(t.match(/\]/g)||[]).length;return o>i&&(t+="]".repeat(o-i)),t}function Xa(e){try{return JSON.parse(e)}catch{return null}}var Ja=P(()=>{"use strict"});var Za={};ee(Za,{extendMessagesWithToolResults:()=>xc,getAvailableTools:()=>Sc,hasAvailableTools:()=>Tc,orchestrateToolCalls:()=>vc});async function vc(e,t,n=1/0){let r=[],{toolCalls:o,remainingText:i}=Va(e),a=new Set;for(let s of o.slice(0,n)){let u=s.name,d={type:"tool_call",toolName:u,arguments:s.arguments};r.push(d),t?.(d);let l=`${u}:${JSON.stringify(s.arguments??{})}`,c=a.has(l);a.add(l);let p=c?`You already called ${u} with the same arguments in this turn. Use the result already provided above; do not call it again.`:await io(u,s.arguments),f={type:"tool_result",toolName:u,arguments:s.arguments,result:p};r.push(f),t?.(f)}return{finalText:i,toolCalls:r}}function xc(e,t){if(t.length===0)return e;let n=[...e],r=[],o=0;for(;o<t.length;){let a=t[o];a.type==="tool_call"&&a.toolName&&r.push({name:a.toolName,arguments:a.arguments||{}}),o++}let i=t.filter(a=>a.type==="tool_result").map(a=>`Tool ${a.toolName}: ${a.result}`).join(`

`);return i&&n.push({role:"tool",content:i}),n}function Sc(){return Yt()}function Tc(){return Object.keys(Mn).length>0}var es=P(()=>{"use strict";Ja();ao()});function ms(e){return e===408||e===429||e>=500}var Qn=e=>new Promise(t=>setTimeout(t,e)),Ct=2e4;function rn(e){return async(t,n)=>{let r=((n-t+1)/1048576).toFixed(1),o="";for(let i=1;i<=3;i++){let a=new AbortController,s=false,u=()=>setTimeout(()=>{s=true,a.abort()},Ct),d=u(),l=()=>{clearTimeout(d),d=u()};try{let c;try{c=await fetch(e,{headers:{Range:`bytes=${t}-${n}`},cache:"force-cache",signal:a.signal})}catch(p){if(o=p instanceof Error?p.message:String(p),s&&(o=`stalled (no response for ${Ct/1e3}s)`),i<3){await Qn(250*2**(i-1));continue}let f=typeof navigator<"u"&&navigator.onLine===false;throw new Error(`bonsai-gguf: fetch failed for ${r} MB range ${t}-${n} of ${e} after 3 attempts${f?" (browser reports OFFLINE)":""}. `+(s?`The server accepted the connection but never answered (stalled ${Ct/1e3}s). `:"")+`If the screen also flickered, the GPU driver reset and took this request with it — that is a GPU fault, not a network one. Last error: ${o}`)}if(c.status!==206&&c.status!==200){if(o=`HTTP ${c.status}`,ms(c.status)&&i<3){await Qn(250*2**(i-1));continue}throw new Error(`bonsai-gguf: range GET ${t}-${n} (${r} MB) of ${e} returned ${c.status}`)}try{let p=c.body;if(!p)return new Uint8Array(await c.arrayBuffer());let f=p.getReader(),m=[],g=0;for(;;){let{done:w,value:k}=await f.read();if(w)break;k&&(l(),m.push(k),g+=k.byteLength)}let h=new Uint8Array(g),b=0;for(let w of m)h.set(w,b),b+=w.byteLength;return h}catch(p){if(s){if(o=`stalled mid-body (no progress for ${Ct/1e3}s)`,i<3){await Qn(250*2**(i-1));continue}throw new Error(`bonsai-gguf: range GET ${t}-${n} (${r} MB) of ${e} stalled mid-body (no progress for ${Ct/1e3}s) after 3 attempts. Last error: ${o}`)}throw new Error(`bonsai-gguf: reading ${r} MB range body failed (device out of memory?): ${p instanceof Error?p.message:String(p)}`)}}finally{clearTimeout(d)}}throw new Error(`bonsai-gguf: range ${t}-${n} exhausted retries: ${o}`)}}function jn(e){let t=e.filter(Boolean);if(t.length===0)throw new Error("bonsai-gguf: mirroredRangeFetcher needs at least one URL");if(t.length===1)return rn(t[0]);let n=t.map(r=>rn(r));return async(r,o)=>{let i=[];for(let a=0;a<n.length;a++)try{return await n[a](r,o)}catch(s){i.push(`${t[a]}: ${s instanceof Error?s.message:String(s)}`),a+1<n.length&&console.warn(`[bonsai-gguf] mirror ${a+1}/${n.length} failed, trying next`)}throw new Error(`bonsai-gguf: all ${n.length} mirrors failed for range ${r}-${o}:
`+i.map((a,s)=>`  [${s+1}] ${a}`).join(`
`))}}var Dt=class{constructor(t){this.filled=0;this.cursor=0;this.url=t.url,this.fetchRange=t.fetchRange??rn(t.url),this.contentLength=t.contentLength,this.initialWindow=t.initialWindow??1<<20,this.buf=new Uint8Array(0)}get position(){return this.cursor}async ensure(t){if(t<=this.filled)return;let n=Math.max(t,this.filled+this.initialWindow);this.contentLength!==void 0&&(n=Math.min(n,this.contentLength));let r=await this.fetchRange(this.filled,n-1),o=new Uint8Array(this.filled+r.length);if(o.set(this.buf.subarray(0,this.filled),0),o.set(r,this.filled),this.buf=o,this.filled+=r.length,this.filled<t)throw new Error(`bonsai-gguf: underfilled window (have ${this.filled}, need ${t}) — server may not support ranges`)}async view(t){return await this.ensure(this.cursor+t),new DataView(this.buf.buffer,this.buf.byteOffset+this.cursor,t)}async u8(){let t=(await this.view(1)).getUint8(0);return this.cursor+=1,t}async u32(){let t=(await this.view(4)).getUint32(0,true);return this.cursor+=4,t}async i32(){let t=(await this.view(4)).getInt32(0,true);return this.cursor+=4,t}async f32(){let t=(await this.view(4)).getFloat32(0,true);return this.cursor+=4,t}async f64(){let t=(await this.view(8)).getFloat64(0,true);return this.cursor+=8,t}async u16(){let t=(await this.view(2)).getUint16(0,true);return this.cursor+=2,t}async i16(){let t=(await this.view(2)).getInt16(0,true);return this.cursor+=2,t}async i8(){let t=(await this.view(1)).getInt8(0);return this.cursor+=1,t}async u64(){let t=await this.view(8),n=t.getUint32(0,true),r=t.getUint32(4,true);this.cursor+=8;let o=r*4294967296+n;if(!Number.isSafeInteger(o))throw new Error(`bonsai-gguf: u64 ${o} exceeds MAX_SAFE_INTEGER`);return o}async i64(){return this.u64()}async string(){let t=await this.u64();await this.ensure(this.cursor+t);let n=this.buf.subarray(this.cursor,this.cursor+t);return this.cursor+=t,new TextDecoder("utf-8").decode(n)}seek(t){this.cursor=t}async bytes(t,n){return await this.ensure(t+n),this.buf.slice(t,t+n)}};var fs="bonsai-weights",Bt="ranges";function hs(){return new Promise((e,t)=>{let n=indexedDB.open(fs,1);n.onupgradeneeded=()=>{let r=n.result;r.objectStoreNames.contains(Bt)||r.createObjectStore(Bt)},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error)})}function gs(e,t){return new Promise((n,r)=>{let i=e.transaction(Bt,"readonly").objectStore(Bt).get(t);i.onsuccess=()=>{let a=i.result;n(a===void 0?void 0:a instanceof Uint8Array?a:new Uint8Array(a))},i.onerror=()=>r(i.error)})}function bs(e,t,n){return new Promise((r,o)=>{let i=e.transaction(Bt,"readwrite"),a=n.slice();i.objectStore(Bt).put(a.buffer,t),i.oncomplete=()=>r(),i.onerror=()=>o(i.error),i.onabort=()=>o(i.error)})}function To(e,t,n){let r=null,o=()=>{if(!r){try{navigator.storage?.persist?.()}catch{}r=hs().catch(()=>null)}return r};return async(i,a)=>{let s=`${e}#${i}-${a}`,u=await o();if(u)try{let l=await gs(u,s);if(l)return n?.({bytes:l.byteLength,fromCache:true}),l}catch{}let d=await t(i,a);return n?.({bytes:d.byteLength,fromCache:false}),u&&bs(u,s,d).catch(()=>{}),d}}Et();var _s=1179993927;function Oo(e,t){return e+(t-e%t)%t}async function Po(e,t){switch(t){case 0:return e.u8();case 1:return e.i8();case 2:return e.u16();case 3:return e.i16();case 4:return e.u32();case 5:return e.i32();case 6:return e.f32();case 7:return await e.u8()!==0;case 8:return e.string();case 10:return e.u64();case 11:return e.i64();case 12:return e.f64();default:throw new Error(`bonsai-gguf: cannot read scalar of value-type ${t}`)}}async function ys(e,t){if(t===9){let n=await e.u32(),r=await e.u64();if(n===9)throw new Error("bonsai-gguf: nested arrays are not permitted by the spec");let o=new Array(r);for(let i=0;i<r;i++)o[i]=await Po(e,n);return o}return Po(e,t)}async function $o(e){let t=await e.u32();if(t!==_s)throw new Error(`bonsai-gguf: bad magic 0x${t.toString(16)} (expected 0x46554747)`);let n=await e.u32();if(n!==3)throw new Error(`bonsai-gguf: unsupported GGUF version ${n} (need 3)`);let r=await e.u64(),o=await e.u64(),i={version:n,tensorCount:r,metadataKvCount:o},a=new Map;for(let l=0;l<o;l++){let c=await e.string(),p=await e.u32(),f=await ys(e,p);a.set(c,f)}let s=vs(a,"general.alignment",32),u=[];for(let l=0;l<r;l++){let c=await e.string(),p=await e.u32(),f=new Array(p);for(let w=0;w<p;w++)f[w]=await e.u64();let m=await e.u32(),g=await e.u64(),h=f.reduce((w,k)=>w*k,1);Ft(m);let b=Eo(m,h);u.push({name:c,dims:f,type:m,relOffset:g,nElements:h,nBytes:b})}let d=Oo(e.position,s);return ks(u,s),{header:i,kv:a,tensors:u,tensorDataBase:d,alignment:s}}function ks(e,t){if(e.length<2)return;let n=[...e].sort((r,o)=>r.relOffset-o.relOffset);for(let r=0;r<n.length-1;r++){let o=n[r],i=n[r+1].relOffset-o.relOffset,a=Oo(o.nBytes,t);if(i===a)continue;let s=Ft(o.type),u=o.nBytes>0?i/o.nBytes:0;throw new Error(`bonsai-gguf: tensor '${o.name}' (type ${o.type} = ${s.name}) occupies ${i} bytes in the file but this build computes ${o.nBytes} (aligned ${a}) from ${s.blockSize} weights/${s.typeSize} bytes per block — a factor of ${u.toFixed(4)}. The declared type id does not match the file's actual block geometry, so every read of this tensor would be at the wrong stride and would produce plausible-looking WRONG values rather than an error. If this is a '*_g64' ternary file, it uses group 64 under the same type id 42 and is NOT loadable by this runtime — use the group-128 '*-Q2_0.gguf' build.`)}}function vs(e,t,n){let r=e.get(t);return typeof r=="number"?r:typeof r=="bigint"?Number(r):n}var xs="normalized-sylvester-walsh-hadamard",Ss="input-last-dimension",Ts=["attn_q","attn_k","attn_v","attn_qkv","attn_gate","attn_output","ffn_gate","ffn_up","ffn_down","ffn_gate_exps","ffn_up_exps","ffn_down_exps","ffn_gate_up_exps","ffn_gate_shexp","ffn_up_shexp","ffn_down_shexp","ssm_out"];function As(e){if(e==="output.weight")return true;if(!e.startsWith("blk."))return false;let t=4;for(;t<e.length&&e.charCodeAt(t)>=48&&e.charCodeAt(t)<=57;)t++;if(t===4||t>=e.length||e[t]!==".")return false;t++;let n=e.slice(t);for(let r of Ts)if(n===`${r}.weight`)return true;return false}var on=class{constructor(t){this.kv=t}raw(t){return this.kv.get(t)}str(t,n){let r=this.kv.get(t);if(typeof r=="string")return r;if(n!==void 0)return n;throw new Error(`bonsai-gguf: missing string key '${t}'`)}num(t,n){let r=this.kv.get(t);if(typeof r=="number")return r;if(typeof r=="bigint")return Number(r);if(n!==void 0)return n;throw new Error(`bonsai-gguf: missing numeric key '${t}'`)}numOpt(t){let n=this.kv.get(t);if(typeof n=="number")return n;if(typeof n=="bigint")return Number(n)}strArray(t){let n=this.kv.get(t);if(Array.isArray(n))return n;throw new Error(`bonsai-gguf: missing string-array key '${t}'`)}numArray(t){let n=this.kv.get(t);if(Array.isArray(n))return n.map(Number);throw new Error(`bonsai-gguf: missing numeric-array key '${t}'`)}bool(t,n){let r=this.kv.get(t);if(typeof r=="boolean")return r;if(r===void 0)return n;throw new Error(`bonsai-gguf: key '${t}' is not a bool (got ${typeof r})`)}resolveHadamard(){let t=this.numOpt("prism.hadamard.version");if(t===void 0)return null;if(t!==1)throw new Error(`bonsai-gguf: unsupported prism.hadamard.version: ${t}`);let n=this.num("prism.hadamard.block_size"),r=this.str("prism.hadamard.transform"),o=this.str("prism.hadamard.axis"),i=this.str("prism.hadamard.sign_mode"),a=this.strArray("prism.hadamard.weight_names");if(!Number.isInteger(n)||n<=0||(n&n-1)!==0)throw new Error(`bonsai-gguf: invalid prism.hadamard.block_size: ${n}`);if(r!==xs)throw new Error(`bonsai-gguf: unsupported prism.hadamard.transform: ${r}`);if(o!==Ss)throw new Error(`bonsai-gguf: unsupported prism.hadamard.axis: ${o}`);if(i!=="identity"&&i!=="explicit")throw new Error(`bonsai-gguf: unsupported prism.hadamard.sign_mode: ${i}`);if(a.length===0)throw new Error("bonsai-gguf: prism.hadamard.weight_names is empty");let s=[],u=new Map,d=new Int8Array(0);if(i==="explicit"){let g=this.numArray("prism.hadamard.sign_widths"),h=this.numArray("prism.hadamard.sign_values");if(g.length===0)throw new Error("bonsai-gguf: prism.hadamard.sign_mode is explicit but sign_widths is empty");d=new Int8Array(h.length);let b=0;for(let w of g){if(!Number.isInteger(w)||w<=0||w%n!==0||b+w>h.length)throw new Error(`bonsai-gguf: invalid prism.hadamard sign width: ${w}`);let k=new Int8Array(w);for(let v=0;v<w;v++){let A=h[b+v];if(A!==1&&A!==-1)throw new Error("bonsai-gguf: prism.hadamard sign values must be +/-1");k[v]=A,d[b+v]=A}u.set(w,k),s.push(w),b+=w}if(b!==h.length)throw new Error("bonsai-gguf: prism.hadamard.sign_values length mismatch")}let l=this.bool("prism.hadamard.gdn_v_grouped",false),c=new Set;for(let g of a){if(!As(g))throw new Error(`bonsai-gguf: prism.hadamard: weight '${g}' is not on a verified Hadamard-aware matmul path`);if(c.has(g))throw new Error(`bonsai-gguf: duplicate prism.hadamard weight: ${g}`);c.add(g)}let p=this.kv.get("prism.hadamard.inverse_weight_names"),f=Array.isArray(p)?p:[],m=new Set;for(let g of f){if(g!=="token_embd.weight")throw new Error(`bonsai-gguf: prism.hadamard: weight '${g}' is not a verified inverse-after-lookup table`);if(c.has(g)||m.has(g))throw new Error(`bonsai-gguf: duplicate prism.hadamard inverse weight: ${g}`);m.add(g)}return{version:t,blockSize:n,transform:r,axis:o,signMode:i,weightNames:c,signWidths:s,signValues:d,signsByWidth:u,inverseWeightNames:m,gdnVGrouped:l}}get arch(){let t=this.str("general.architecture");return t==="dspark"?"qwen35":t}a(t){return`${this.arch}.${t}`}resolveArchConfig(){return{arch:this.arch,contextLength:this.num(this.a("context_length")),embeddingLength:this.num(this.a("embedding_length")),blockCount:this.num(this.a("block_count")),feedForwardLength:this.num(this.a("feed_forward_length")),headCount:this.num(this.a("attention.head_count")),headCountKv:this.num(this.a("attention.head_count_kv")),keyLength:this.numOpt(this.a("attention.key_length")),valueLength:this.numOpt(this.a("attention.value_length")),rmsEps:this.num(this.a("attention.layer_norm_rms_epsilon"),1e-6),ropeDimensionCount:this.numOpt(this.a("rope.dimension_count")),ropeDimensionSections:(()=>{let n=this.kv.get(this.a("rope.dimension_sections"));return Array.isArray(n)?n.map(Number):[]})(),ropeFreqBase:this.numOpt(this.a("rope.freq_base"))??1e4,ropeScalingType:(()=>{let n=this.kv.get(this.a("rope.scaling.type"));return typeof n=="string"?n:"none"})(),ropeScalingFactor:this.numOpt(this.a("rope.scaling.factor")),ropeScalingOriginalContext:this.numOpt(this.a("rope.scaling.original_context_length")),ssmConvKernel:this.numOpt(this.a("ssm.conv_kernel")),ssmInnerSize:this.numOpt(this.a("ssm.inner_size")),ssmStateSize:this.numOpt(this.a("ssm.state_size")),ssmGroupCount:this.numOpt(this.a("ssm.group_count")),ssmTimeStepRank:this.numOpt(this.a("ssm.time_step_rank")),fullAttentionInterval:this.numOpt(this.a("full_attention_interval"))}}resolveTokenizer(){return{model:this.str("tokenizer.ggml.model","gpt2"),tokens:this.strArray("tokenizer.ggml.tokens"),merges:(()=>{let t=this.kv.get("tokenizer.ggml.merges");return Array.isArray(t)?t:[]})(),tokenType:(()=>{let t=this.kv.get("tokenizer.ggml.token_type");return Array.isArray(t)?t.map(Number):[]})(),bosTokenId:this.numOpt("tokenizer.ggml.bos_token_id"),eosTokenId:this.numOpt("tokenizer.ggml.eos_token_id")}}};var an=class{constructor(t){this.byName=new Map;this.ordered=[];this.tensorDataBase=t.tensorDataBase;for(let n of t.tensors){let r=this.toEntry(n,t.tensorDataBase);this.byName.set(r.name,r),this.ordered.push(r)}this.ordered.sort((n,r)=>n.absStart-r.absStart)}toEntry(t,n){let r=n+t.relOffset;return{name:t.name,type:t.type,dims:t.dims,absStart:r,nBytes:t.nBytes,absEnd:r+t.nBytes}}get(t){let n=this.byName.get(t);if(!n)throw new Error(`bonsai-tensors: no tensor named '${t}'`);return n}has(t){return this.byName.has(t)}withPrefix(t){return this.ordered.filter(n=>n.name.startsWith(t))}coalesce(t,n=1<<20,r=64<<20){let o=[...t].sort((a,s)=>a.absStart-s.absStart),i=[];for(let a of o){let s=i[i.length-1];s&&a.absStart-s.absEnd<=n&&a.absEnd-s.absStart<=r?(s.absEnd=Math.max(s.absEnd,a.absEnd),s.nBytes=s.absEnd-s.absStart,s.members.push(a)):i.push({absStart:a.absStart,absEnd:a.absEnd,nBytes:a.nBytes,members:[a]})}return i}coalesceBlock(t){return this.coalesce(this.withPrefix(`blk.${t}.`))}};function Ls(e){let t=e.ssmTimeStepRank??0,n=e.ssmGroupCount??0,r=e.ssmStateSize??0,o=e.ssmInnerSize??t*r,i=n*r,a=n*r,s=i+a+o,u=e.ssmConvKernel??0;if(t<=0||n<=0||r<=0||u<=0)throw new Error(`bonsai-config: '${e.arch}' has no DeltaNet layers — this in-browser runtime only runs the qwen35 hybrid (Bonsai-27B). Dense sizes run on a local node or the hosted lane instead. (numVHeads=${t}, numKHeads=${n}, headDim=${r}, convKernel=${u})`);if(t%n!==0)throw new Error(`bonsai-config: numVHeads ${t} not divisible by numKHeads ${n}`);if(o!==t*r)throw new Error(`bonsai-config: ssm.inner_size ${o} != numVHeads*headDim ${t*r}`);return{numVHeads:t,numKHeads:n,headDim:r,qDim:i,kDim:a,vDim:o,convDim:s,convKernel:u,vPerKHead:t/n}}function Bs(e,t){let n=t.blockCount,r=t.keyLength&&t.keyLength>0?t.keyLength:t.embeddingLength/t.headCount,o=t.headCount*r,i=o*2,a=[];for(let s=0;s<n;s++){let u=`blk.${s}.`;if(e.ordered.some(m=>m.name.startsWith(u)&&m.name.includes("ssm"))){a.push("linear-attn");continue}if(!(e.has(`${u}attn_k.weight`)||e.has(`${u}attn_v.weight`)||e.ordered.some(m=>m.name.startsWith(u)&&/attn_(k|v)\b/.test(m.name))))throw new Error(`bonsai-config: block ${s} has neither ssm_* nor attn_k/v tensors — cannot classify layer`);let c=`${u}attn_q.weight`;if(!e.has(c))throw new Error(`bonsai-config: block ${s} has attn_k/v but no '${c}' — cannot determine whether its attention is gated (qwen35) or plain (qwen3)`);let p=e.get(c).dims,f=p.length>=2?p[p.length-1]:p[0];if(f===i)a.push("full-attn");else if(f===o)a.push("dense-attn");else throw new Error(`bonsai-config: block ${s} '${c}' has output width ${f}, which matches neither plain attention (nHeads*headDim = ${o}) nor gated attention (2*nHeads*headDim = ${i}). headCount=${t.headCount}, headDim=${r} (key_length=${t.keyLength??"absent"}, embedding_length=${t.embeddingLength}). Refusing to guess — the wrong choice produces fluent garbage, not an error.`)}return a}function Es(e,t){let n=[];for(let r=0;r<t;r++){let o=`blk.${r}.post_attention_norm.weight`,i=`blk.${r}.ffn_norm.weight`;if(e.has(o))n.push(o);else if(e.has(i))n.push(i);else throw new Error(`bonsai-config: block ${r} has neither '${o}' nor '${i}' — cannot locate the pre-FFN norm`)}return n}var ct=256;function Ps(e){let t=e.keyLength&&e.keyLength>0?e.keyLength:e.embeddingLength/e.headCount,n;return e.ssmInnerSize!==void 0&&e.headCount>0&&e.ssmInnerSize%e.headCount===0&&(n=e.ssmInnerSize/e.headCount),{headDim:t,deltaNetDv:n}}function Ro(e){let{headDim:t,deltaNetDv:n}=Ps(e);if(!Number.isInteger(t)||t<=0)throw new Error(`bonsai-config: head_dim (embedding_length ${e.embeddingLength} / head_count ${e.headCount}) = ${t} is not a positive integer — cannot size attention kernels`);if(t>ct)throw new Error(`bonsai-config: head_dim ${t} exceeds the WGSL fixed array bound ${ct} (softmax_attn.wgsl acc[${ct}]) — refusing to load; the kernel would read out of bounds on the GPU`);if(n!==void 0&&n>ct)throw new Error(`bonsai-config: DeltaNet d_v ${n} (ssm.inner_size ${e.ssmInnerSize} / head_count ${e.headCount}) exceeds the WGSL fixed array bound ${ct} (deltanet.wgsl err/o[${ct}]) — refusing to load`);let r=n!==void 0?`, DeltaNet d_v=${n}`:"";return{message:`head_dim=${t}${r} (<= ${ct})`}}function Io(e,t){let n=Bs(t,e),r=[],o=[];n.forEach((s,u)=>(s==="linear-attn"?o:r).push(u));let i=o.length>0?Ls(e):void 0,a=Es(t,e.blockCount);return{...e,layerKinds:n,fullAttnLayers:r,linearAttnLayers:o,deltaNet:i,ffnNormNames:a}}function No(e){let t=e.fullAttnLayers.length+e.linearAttnLayers.length;if(t!==e.blockCount)return{ok:false,message:`layer kinds (${t}) != blockCount (${e.blockCount})`};if(e.linearAttnLayers.length===0){let n=e.layerKinds.filter(r=>r==="dense-attn").length;return{ok:true,message:`dense: ${n} plain-attn / ${e.blockCount-n} gated-attn, no DeltaNet`}}return e.blockCount===64&&e.fullAttnLayers.length!==16&&console.warn(`bonsai-config: Bonsai-27B expected 16 full-attn layers (64 blocks), got ${e.fullAttnLayers.length}. This may be a model variant; loading anyway.`),{ok:true,message:`${e.fullAttnLayers.length} full-attn / ${e.linearAttnLayers.length} linear-attn`}}function Os(){let e=[];for(let o=33;o<=126;o++)e.push(o);for(let o=161;o<=172;o++)e.push(o);for(let o=174;o<=255;o++)e.push(o);let t=[...e],n=0;for(let o=0;o<256;o++)e.includes(o)||(e.push(o),t.push(256+n),n++);let r=new Map;for(let o=0;o<e.length;o++)r.set(e[o],String.fromCodePoint(t[o]));return r}var $s=3,Rs=4;function Co(e,t,n=[]){let r=new Map;e.forEach((l,c)=>r.set(l,c));let o=new Map;t.forEach((l,c)=>o.set(l,c));let i=Os(),a=new Map;i.forEach((l,c)=>a.set(l,c));let s=[],u=n.length===e.length;e.forEach((l,c)=>{(u?n[c]===$s||n[c]===Rs:l.length>=5&&l.startsWith("<|")&&l.endsWith("|>"))&&s.push([l,c])}),s.sort((l,c)=>c[0].length-l[0].length);let d=new Map(s);return{vocab:r,idToToken:e,mergeRank:o,byteEncoder:i,byteDecoder:a,specialTokens:d}}function Is(e,t){if(e.length<2)return e;let n=e;for(;;){let r=1/0,o=-1;for(let i=0;i<n.length-1;i++){let a=t.get(`${n[i]} ${n[i+1]}`);a!==void 0&&a<r&&(r=a,o=i)}if(o===-1)break;n=[...n.slice(0,o),n[o]+n[o+1],...n.slice(o+2)]}return n}var qo=/'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu,Go=new WeakMap;function Ns(e){let t=Go.get(e);if(t===void 0){if(e.specialTokens.size===0)t=null;else{let n=[...e.specialTokens.keys()].map(r=>r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");t=new RegExp(n,"g")}Go.set(e,t)}return t}function Mo(e,t,n){let r=e;for(;r.length>0;){qo.lastIndex=0;let o=qo.exec(r);if(!o)break;let i=o[0],s=new TextEncoder().encode(i),u=Array.from(s,l=>t.byteEncoder.get(l)),d=Is(u,t.mergeRank);for(let l of d){let c=t.vocab.get(l);if(c!==void 0)n.push(c);else for(let p of l){let f=t.vocab.get(p);f!==void 0&&n.push(f)}}r=r.slice(i.length)}}function Do(e,t){let n=[],r=Ns(t),o=0;if(r){r.lastIndex=0;let i;for(;(i=r.exec(e))!==null;)i.index>o&&Mo(e.slice(o,i.index),t,n),n.push(t.specialTokens.get(i[0])),o=i.index+i[0].length}return o<e.length&&Mo(e.slice(o),t,n),n}function Fo(e,t){let n="";for(let o of e){let i=t.idToToken[o];i!==void 0&&(n+=i)}let r=[];for(let o of n){let i=t.byteDecoder.get(o);i!==void 0&&r.push(i)}return new TextDecoder("utf-8",{fatal:false}).decode(new Uint8Array(r))}function Uo(e,t=true,n){let r="";if(n&&n.length>0){r+=`<|im_start|>system
`,e[0]?.role==="system"&&(r+=e[0].content+`

`),r+=`# Tools

You may call one or more functions to assist with the user query.

`,r+=`You are provided with function signatures within <tools></tools> XML tags:
`,r+="<tools>";for(let i of n)r+=`
`+JSON.stringify(i);r+=`
</tools>

`,r+=`For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
`,r+=`<tool_call>
`,r+=`{"name": <function-name>, "arguments": <args-json-object>}
`,r+="</tool_call>",r+=`<|im_end|>
`}else e[0]?.role==="system"&&(r+=`<|im_start|>system
${e[0].content}<|im_end|>
`);let o=n&&n.length>0&&e[0]?.role==="system"||!n&&e[0]?.role==="system"?1:0;for(let i=o;i<e.length;i++){let a=e[i];if(a.role==="user")r+=`<|im_start|>user
${a.content}<|im_end|>
`;else if(a.role==="assistant"){let s=a.content,u=a.reasoning_content||"";if(u?r+=`<|im_start|>assistant
<think>
${u.trim()}
</think>

`:r+=`<|im_start|>assistant
`,s&&(r+=s),a.tool_calls&&a.tool_calls.length>0)for(let d of a.tool_calls){s&&(r+=`
`);let l=d.function||d;r+=`<tool_call>
`,r+=JSON.stringify({name:l.name,arguments:typeof l.arguments=="string"?JSON.parse(l.arguments):l.arguments}),r+=`
</tool_call>`}r+=`<|im_end|>
`}else a.role==="tool"&&(r+=`<|im_start|>user
<tool_response>
${a.content}
</tool_response><|im_end|>
`)}return t&&(r+=`<|im_start|>assistant
<think>

</think>

`),r}var sn=class{constructor(t){this.tables=Co(t.tokens,t.merges,t.tokenType),this.bosTokenId=t.bosTokenId,this.eosTokenId=t.eosTokenId,this.thinkStartId=this.tables.specialTokens.get("<think>"),this.thinkEndId=this.tables.specialTokens.get("</think>");let n=new Set;t.eosTokenId!==void 0&&n.add(t.eosTokenId);for(let r of["<|im_end|>","<|endoftext|>"]){let o=this.tables.specialTokens.get(r);o!==void 0&&n.add(o)}this.stopIds=n}get vocabSize(){return this.tables.idToToken.length}encode(t){return Do(t,this.tables)}decode(t){return Fo(t,this.tables)}encodeChat(t,n){return this.encode(Uo(t,true,n))}isStop(t){return this.stopIds.has(t)}isEos(t){return this.eosTokenId!==void 0&&t===this.eosTokenId}};Et();Jn();var js=new Set([41,42,142,143]),zs=/^blk\.\d+\.ssm_(alpha|beta)\.weight$/,ln=class{constructor(t,n,r,o={}){this.device=t;this.registry=n;this.fetchRange=r;this.uploadOpts=o;this.buffers=new Map;this.loadedLayers=new Set;this.inflight=new Map}has(t){return this.buffers.has(t)}get(t){let n=this.buffers.get(t);if(!n)throw new Error(`bonsai-weights: '${t}' not resident (load its layer first)`);return n}typeOf(t){return this.registry.get(t).type}weightQuantType(){if(this.blockQuantType!==void 0)return this.blockQuantType;let t=i=>i===0||i===1,n=i=>i.type===30&&zs.test(i.name),r=this.registry.ordered.filter(i=>i.name.startsWith("blk.")&&!t(i.type)&&!n(i));if(r.length===0)throw new Error("bonsai-weights: no quantized 'blk.*' weight tensors in the registry — cannot determine the model's weight quant type");let o=new Map;for(let i of r)o.has(i.type)||o.set(i.type,i.name);for(let[i,a]of o)if(!js.has(i))throw new Error(`bonsai-weights: block tensor '${a}' has unsupported quant type ${i} (supported: Q1_0=41, Q2_0=42, PQ2_0=142, PTQ1_0=143)`);if(o.size>1){let i=[...o].map(([a,s])=>`${a} (e.g. '${s}')`).join(", ");throw new Error(`bonsai-weights: decoder blocks mix quant types — ${i}. The block projections dispatch once per context, so a mixed file would silently run some layers through the wrong kernel and emit fluent garbage. Use projectQuantized per tensor to support this.`)}return this.blockQuantType=r[0].type,this.blockQuantType}register(t){for(let n of t)this.buffers.set(n.entry.name,n.buffer)}async loadGlobals(t){let n=t.filter(r=>this.registry.has(r)).map(r=>this.registry.get(r));for(let r of this.registry.coalesce(n))this.register(await Vn(this.device,this.fetchRange,r,this.uploadOpts))}ensureLayer(t){if(this.loadedLayers.has(t))return Promise.resolve();let n=this.inflight.get(t);if(n)return n;let r=this.loadLayer(t).finally(()=>this.inflight.delete(t));return this.inflight.set(t,r),r}async loadLayer(t){for(let n of this.registry.coalesceBlock(t))this.register(await Vn(this.device,this.fetchRange,n,this.uploadOpts));this.loadedLayers.add(t)}prefetchLayer(t){t<0||this.loadedLayers.has(t)||this.registry.coalesceBlock(t).length!==0&&this.ensureLayer(t).catch(()=>{})}get residentLayerCount(){return this.loadedLayers.size}evictLayer(t,n){this.inflight.delete(t);for(let r of n){let o=this.buffers.get(r);o&&(o.destroy(),this.buffers.delete(r))}this.loadedLayers.delete(t)}};hn();var Js=["quantize_q8_0","q1_0_dequant","q1_0_q8_0_matmul","q2_0_dequant","q2_0_q8_0_matmul","ptq1_0_dequant","ptq1_0_q8_0_matmul","fwht_1024","kv_quant_4bit","rmsnorm","rope_imrope","softmax_attn","softmax_attn_batched","causal_conv1d","deltanet","deltanet_gate","deltanet_seq","swiglu","sampling","logit_topk","vae_ops","elementwise","elementwise_inplace","image_ops"],gn=class{constructor(t,n){this.device=t;this.sources=n;this.cache=new Map}get(t,n="main"){let r=n==="main"?t:`${t}:${n}`,o=this.cache.get(r);if(o)return o;let i=this.sources[t];if(!i)throw new Error(`bonsai-pipelines: no WGSL source registered for '${t}'`);let a=this.device.createShaderModule({code:i,label:t}),s=this.device.createComputePipeline({label:r,layout:"auto",compute:{module:a,entryPoint:n}});return this.cache.set(r,s),s}warmAll(){for(let t of Js)if(this.sources[t]){if(t==="logit_topk"){this.get(t,"hist_main"),this.get(t,"gather_main");continue}if(t==="vae_ops"){this.get(t,"conv2d_main"),this.get(t,"groupnorm_main"),this.get(t,"upsample_nearest_main");continue}t!=="image_ops"&&this.get(t)}}};var sr=class{constructor(t){this.deps=t}async load(t){let n=t.mirrorUrls?.length?t.mirrorUrls:[t.modelUrl],r=this.deps.fetchRange??jn(n),o=this.deps.fetchRange?r:To(t.modelUrl,r),i=t.onProgress??(()=>{});i({phase:"parse",percent:2,detail:"range-fetching header + KV"});let a=new Dt({url:t.modelUrl,fetchRange:o}),s=await $o(a),u=new on(s.kv);i({phase:"config",percent:30,detail:`arch=${u.arch}`});let d=new an(s),l=u.resolveArchConfig(),c=Io(l,d),p=No(c),f=Ro(c);console.log(`bonsai: kernel dims OK — ${f.message}`),i({phase:"tokenizer",percent:45,detail:"building BPE tables"});let m=new sn(u.resolveTokenizer());i({phase:"pipelines",percent:60,detail:"compiling WGSL"});let g=new gn(this.deps.device,this.deps.kernelSources);g.warmAll(),i({phase:"globals",percent:75,detail:"uploading embeddings + LM head + norms"});let h=new ln(this.deps.device,d,o),b=u.resolveHadamard(),w=null;if(b){for(let S of b.weightNames){if(!d.has(S))continue;let N=d.get(S).dims[0];if(N%b.blockSize!==0)throw new Error(`bonsai-runtime: prism.hadamard weight '${S}' has input width ${N}, not a multiple of block_size ${b.blockSize}`);if(b.signMode==="explicit"&&!b.signsByWidth.has(N))throw new Error(`bonsai-runtime: prism.hadamard weight '${S}' has input width ${N} but sign_widths declares only [${b.signWidths.join(", ")}]`)}w=bi(this.deps.device,b),console.log(`bonsai: Hadamard fold active — ${b.weightNames.size} rotated tensors, block ${b.blockSize}, signs ${b.signMode} [${b.signWidths.join(", ")}], gdn_v_grouped=${b.gdnVGrouped}`)}let k=["token_embd.weight","output_norm.weight"];await h.loadGlobals(k);for(let S of k)if(!h.has(S))throw new Error(`bonsai-runtime: required tensor '${S}' was not found in the GGUF file. The model file may be corrupted or incomplete — try clearing your browser cache and reloading, or switch to a different model size.`);let v=["output.weight"];try{await h.loadGlobals(v)}catch(S){console.warn(`bonsai-runtime: optional globals not loaded: ${S.message}`)}i({phase:"ready",percent:100});let A={device:this.deps.device,parsed:s,meta:u,registry:d,config:c,tokenizer:m,pipelines:g,weights:h,hadamard:w,scheduleOk:p.ok,scheduleMessage:p.message};return this.model=A,A}get loaded(){return this.model}async warm(t){let n=this.model;if(!n)return 0;let r=n.config.blockCount,o=Math.max(1,Math.min(t?.concurrency??3,r)),i=0,a=async()=>{for(;;){if(t?.cancelled?.())return;let s=i++;if(s>=r)return;try{await n.weights.ensureLayer(s)}catch{}}};return await Promise.all(Array.from({length:o},a)),n.weights.residentLayerCount}};function yi(e){return new sr(e)}var $t="<tool_call>",bn="</tool_call>";function ki(e,t){if(!t)return e;let n="",r=0;for(;;){let s=e.indexOf(bn,r);if(s===-1)break;let u=vi(e,r,s);n+=e.slice(r,u),r=s+bn.length}let o=e.slice(r),i=o.indexOf($t);if(i!==-1)return n+o.slice(0,i);let a=o.indexOf("{");return a!==-1?n+o.slice(0,a):n+o.slice(0,o.length-Zs(o))}function Zs(e){let t=Math.min(e.length,$t.length-1);for(let n=t;n>0;n--)if(e.endsWith($t.slice(0,n)))return n;return 0}function vi(e,t,n){let r=e.indexOf($t,t);if(r!==-1&&r<n)return r;let o=e.indexOf("{",t);return o===-1||o>n?t:o}function xi(e){let t=[],n=0;for(;;){let r=e.indexOf(bn,n);if(r===-1)return t;let o=vi(e,n,r);e.startsWith($t,o)&&(o+=$t.length),t.push(e.slice(o,r).trim()),n=r+bn.length}}var eu=/how (do|did) (you|they|it) know|how can you tell|where did (you|that) (get|come from)/i;function Si(e,t){if(!t||t.length===0)return e;let n=e[e.length-1];if(!n||n.role!=="user"||!eu.test(n.content))return e;let r=[...new Set(t.map(a=>a.name))],i=`[Note: the visitor is asking how you knew the previous answer. You knew it because you called the ${r.length===1?r[0]:r.slice(0,-1).join(", ")+" and "+r[r.length-1]} tool in the previous turn. Answer their question in one or two sentences, naming the tool, and do NOT call it again.]`;return[...e.slice(0,-1),{...n,content:`${n.content}

${i}`}]}Sn();var Eu=["intel","arm","qualcomm","imgtec"],Pu=["microsoft"];function xr(e){if(e?.isFallbackAdapter===true)return"software";let t=e?.vendor?.trim().toLowerCase();return t?Pu.includes(t)?"software":Eu.includes(t)?"integrated":"unknown":"unknown"}function Zi(e,t){if(t?.mobile)return 4;switch(e){case"software":case"integrated":return 8;case"unknown":case"discrete":default:return t?.windowsTdr?64:0}}function jt(){if(typeof navigator>"u")return false;let e=navigator.userAgent??"";if(/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(e))return true;let t=navigator.maxTouchPoints??0;return/Macintosh/i.test(e)&&t>1}var Ap=285*1024*1024;var Ac=5,so=[],uo=null,Lc="bonsai-kernels";function ts(e,t){let n=null,r="",o=false,i=null,a=l=>e.postMessage(l);function s(l){if(i)return;i=l,o=true,n=null;let c="";/watchdog|timeout|tdr|hung|exceeded.*deadline/i.test(l)?c=" This is a GPU watchdog timeout (TDR), usually caused by an integrated GPU or weak adapter taking too long on a compute batch. The safest path is a smaller model or the hosted inference ladder. Retrying WILL reset the driver again.":/destroyed/i.test(l)?c=" (This is an expected shutdown, not an error.)":c=" The GPU device was torn away by the OS (possibly due to an overheating shutdown, driver crash, or resource exhaustion). Retrying may succeed after a delay, but is risky.",a({type:"error",fatal:"device-lost",message:`bonsai: GPU device lost (${l}).${c} Not retrying automatically — retrying without addressing the root cause will re-trigger the same reset.`})}async function u(l){if(i)return a({type:"error",fatal:"device-lost",message:`bonsai: refusing to load — the GPU device was already lost (${i}).`});try{let c=await t.acquireDevice();c.lost&&c.lost.then(m=>{m?.reason!=="destroyed"&&s(`${m?.reason??"unknown"}: ${m?.message??"no detail"}`)}),c.addEventListener?.("uncapturederror",m=>{let g=m?.error?.message??"unknown GPU error";console.error(`[bonsai] uncaptured GPU error: ${g}`),/out of memory|allocation/i.test(g)?(a({type:"error",message:`bonsai: the GPU ran out of memory (${g}). This model is too large for this adapter — choose a smaller size.`}),o=true):/timeout|watchdog|tdr/i.test(g)?s(`watchdog: ${g}`):console.warn(`[bonsai] uncaptured GPU error ignored: ${g} — generation may continue but results may be corrupt`)});let p=await t.loadKernels();n=yi({device:c,kernelSources:p}),r=l,await n.load({modelUrl:t.resolveModelUrl(l),...t.resolveMirrorUrls?{mirrorUrls:t.resolveMirrorUrls(l)}:{},onProgress:m=>a({type:"progress",progress:m.percent,file:m.detail})}),a({type:"ready",modelId:l});let f=l;n.warm({cancelled:()=>r!==f}).then(m=>{r===f&&console.log(`[bonsai] warm: ${m} block(s) resident before first turn`)}).catch(()=>{})}catch(c){let p=c.message,f=p.includes("token_embd")||p.includes("output_norm")?" This usually means the model download was interrupted or the browser cache is corrupted. Try: (1) clear site data and reload, (2) try a smaller model (Bonsai 4B is 545 MB), or (3) run locally with `pip install awdk && adk bonsai-local` for a faster, more reliable experience.":"";a({type:"error",message:`bonsai load failed: ${p}${f}`})}}async function d(l){if(i)return a({type:"error",fatal:"device-lost",message:`bonsai: cannot generate — the GPU device was lost (${i}).`});if(!n?.loaded)return a({type:"error",message:"no model loaded — send {type:'load'} first"});o=false;try{let{tokenizer:c,config:p,device:f,pipelines:m,weights:g}=n.loaded,h=n.loaded.hadamard??void 0,b=l.maxTokens??256,w=l.temperature??.7,k=l.topK??20,v=l.topP??.95,A=l.repetitionPenalty??1.1,N=l.reasoningBudget??Math.max(32,b-128),D=Si(l.messages,so);l.messages[l.messages.length-1]?.role!=="tool"&&(so=[]);let y=c.encodeChat(D,l.tools),x=y.length,{ropeSafeCeiling:X}=await Promise.resolve().then(()=>(na(),ta)),C=X(8192,p);C.reason&&console.log(`[bonsai] ${C.reason}`);let Ye=C.ceiling,wt=globalThis.__BONSAI_PREFIX_DISABLE!==true,{kvBytesPerPosition:_t,kvBudgetBytes:Fe,planKvCapacity:j}=await Promise.resolve().then(()=>(aa(),ia)),{resolveKvMode:ue,supports4bitKv:L}=await Promise.resolve().then(()=>(Er(),Br)),Ue=p.keyLength??p.embeddingLength/p.headCount,Xe=L(Ue),Ve=ue(),Le=Ve==="4bit"&&!Xe?"f32":Ve;Le!==Ve&&console.log(`[bonsai] kv: 4-bit unsupported at head_dim=${Ue} (kernel row width is 128) — falling back to the f32 cache for this model`);let yt=Le==="4bit"?.5:4,at=j({promptLen:x,maxTokens:b,ceiling:Ye,bytesPerPosition:_t({fullAttnLayerCount:p.fullAttnLayers.length,headCountKv:p.headCountKv,headDim:Ue},yt),budgetBytes:Fe(globalThis.navigator?.deviceMemory),reuseEnabled:wt}),Je=at.capacity;if(console.log(`[bonsai] kv capacity ${Je} — ${at.reason}`),x+b+1>Ye)return a({type:"error",message:`context too long: prompt ${x} + maxTokens ${b} > ${Ye} KV slots. Shorten the prompt or lower maxTokens (in-browser Bonsai is capped at ${Ye} tokens).`});let{F32KvCache:kt}=await Promise.resolve().then(()=>(ua(),sa)),{KvCache:vt}=await Promise.resolve().then(()=>(Er(),Br)),{SsmState:xt}=await Promise.resolve().then(()=>(ca(),la)),{f32Buffer:fe,sampleToken:St,sampleTiming:Be}=await Promise.resolve().then(()=>(ze(),Nt));Be.readbackMs=0,Be.selectMs=0,Be.calls=0;let{prefill:le,decodeStep:We}=await Promise.resolve().then(()=>(Sn(),kr)),{embedTokens:Ze}=await Promise.resolve().then(()=>(yr(),Vi)),{planReuse:et,committedTokens:st,cacheSignature:Ke}=await Promise.resolve().then(()=>(ma(),pa)),ce=uo;uo=null;let be=p.keyLength??p.embeddingLength/p.headCount,Oe=Ke({modelId:r||"unknown",quantType:String(g.weightQuantType()),blockCount:p.blockCount,embeddingLength:p.embeddingLength,headCountKv:p.headCountKv,headDim:be,linearAttnLayerCount:p.linearAttnLayers.length,kvMode:Le}),ut=p.linearAttnLayers.length===0,F=et({cache:ce&&ce.device===f?ce:null,promptIds:y,signature:Oe,maxNewTokens:b,canTruncate:ut,disabled:globalThis.__BONSAI_PREFIX_DISABLE===true}),$e=F.mode==="extend"&&ce!==null,$=$e?ce.kv:Le==="4bit"?new vt(f,{fullAttnLayers:p.fullAttnLayers,headCountKv:p.headCountKv,headDim:be,capacity:Je},m):new kt(f,{fullAttnLayers:p.fullAttnLayers,headCountKv:p.headCountKv,headDim:be,capacity:Je}),V=p.deltaNet,J=$e?ce.ssm:new xt(f,{linearAttnLayers:p.linearAttnLayers,heads:V?.numVHeads??0,dK:V?.headDim??0,dV:V?.headDim??0,dConv:V?.convKernel,ssmInnerSize:V?.vDim,convDim:V?.convDim});if(!V&&p.linearAttnLayers.length>0)throw new Error(`bonsai-worker: ${p.linearAttnLayers.length} DeltaNet layers were classified but the model exposes no ssm.* geometry — refusing to run them with zero dims.`);if($e?$.truncate(F.reuseLen):($.reset(),J.reset()),$.filledLength()!==F.reuseLen)throw new Error(`bonsai-prefix: KV length ${$.filledLength()} != planned reuse ${F.reuseLen} — refusing to prefill at a position the cache does not end on`);let we=F.prefillIds;F.savedTokens>0?console.log(`[bonsai] prefix reuse: ${F.savedTokens}/${x} tokens reused (${F.reason}); prefilling ${we.length}`):console.log(`[bonsai] prefix reuse: none — ${F.reason}`);let tt=fe(f,we.length*p.embeddingLength,"hidden_prefill"),Tt=g.weightQuantType(),M={device:f,pipelines:m,weights:g,config:p,kv:$,kvMode:Le,ssm:J,quantType:Tt,hadamard:h};a({type:"progress",progress:10,file:`prefill ${x} tokens (running ${p.blockCount} layers)`});let Qe=Date.now();console.log(`[bonsai] prefill start: ${x} tokens × ${p.blockCount} layers`);let ne=await le(M,tt,we,c,(B,_)=>{a({type:"progress",progress:10+Math.floor(B/_*30),file:`warming layer ${B+1}/${_}`})},F.reuseLen);if($.filledLength()!==x)throw new Error(`bonsai-prefix: after prefill KV length ${$.filledLength()} != prompt ${x}`);let Ee=Date.now()-Qe;if(console.log(`[bonsai] prefill done in ${Ee}ms (${(Ee/x).toFixed(0)}ms/token)`),it()){let{readbackF32:B}=await Promise.resolve().then(()=>(ze(),Nt)),_=await B({device:f,pipelines:m},ne.logits,c.vocabSize),O=1/0,E=-1/0,H=0,ie=0;for(let I=0;I<_.length;I++){let R=_[I];if(!Number.isFinite(R)){ie++;continue}R<O&&(O=R),R>E&&(E=R),H+=R}let Z=H/_.length,z=0;for(let I=0;I<_.length;I++){let R=_[I];Number.isFinite(R)&&(z+=(R-Z)*(R-Z))}let U=Math.sqrt(z/_.length),se=32,q=[],he=-1/0;for(let I=0;I<_.length;I++){let R=_[I];if(q.length===se&&R<=he)continue;let re=q.length;for(;re>0&&_[q[re-1]]<R;)re--;q.splice(re,0,I),q.length>se&&q.pop(),he=_[q[q.length-1]]}let Ie=q.map(I=>{let R=c.decode([I]).replace(/\n/g,"\\n").slice(0,14);return`${I}:${_[I].toFixed(3)}"${R}"`});console.log(`[bonsai] LOGITS vocab=${_.length} bad=${ie} min=${O.toFixed(3)} max=${E.toFixed(3)} mean=${Z.toFixed(4)} sd=${U.toFixed(4)} margin(top1-top2)=${(_[q[0]]-_[q[1]]).toFixed(4)}`),console.log(`[bonsai] LOGITS_TOP32 ${Ie.join(" ")}`),console.log(`[bonsai] LOGITS_STOPS ${[...c.stopIds].map(I=>`${I}=${_[I]?.toFixed(3)}`).join(" ")}`)}if(globalThis.__BONSAI_PREFILL_DIFF===true&&x>=3){let B=globalThis,_=x-2;B.__BONSAI_ROWS={},B.__BONSAI_CAPTURE_POS=_,$.reset(),J.reset(),B.__BONSAI_CAPTURE_TAG="PN";let O=fe(f,x*p.embeddingLength,"hidden_pN");await le(M,O,y,c),$.reset(),J.reset(),B.__BONSAI_CAPTURE_TAG="PM";let E=globalThis.__BONSAI_DETERMINISM===true,H=E?y:y.slice(0,-1);E&&console.log(`[bonsai] DETERMINISM CONTROL: both runs use the SAME ${x} tokens; expect 0 differing everywhere`);let ie=fe(f,H.length*p.embeddingLength,"hidden_pM");if(await le(M,ie,H,c),E){$.reset(),J.reset(),B.__BONSAI_CAPTURE_TAG="PC";let z=fe(f,x*p.embeddingLength,"hidden_pC");await le(M,z,y,c)}B.__BONSAI_CAPTURE_TAG=void 0,B.__BONSAI_CAPTURE_POS=void 0;let Z=B.__BONSAI_ROWS??{};if(E)for(let z=0;z<p.blockCount;z++){let U=Z[`PM:${z}`],se=Z[`PC:${z}`];if(!U||!se||U.length!==se.length)continue;let q=0,he=0,Ie=0,I=0;for(let R=0;R<U.length;R++){let re=Math.abs(U[R]-se[R]);re>q&&(q=re),he+=re,Ie+=Math.abs(U[R]),re>1e-6&&I++}console.log(`[bonsai] WARMDIFF L${z} kind=${p.layerKinds[z]} maxAbs=${q.toExponential(3)} relative=${(he/(Ie||1)).toExponential(3)} differing=${I}/${U.length}`)}for(let z=0;z<p.blockCount;z++){let U=Z[`PN:${z}`],se=Z[`PM:${z}`];if(!U||!se||U.length!==se.length)continue;let q=0,he=0,Ie=0,I=0;for(let R=0;R<U.length;R++){let re=Math.abs(U[R]-se[R]);re>q&&(q=re),he+=re,Ie+=Math.abs(U[R]),re>1e-6&&I++}console.log(`[bonsai] PREFILLDIFF L${z} kind=${p.layerKinds[z]} pos=${_} maxAbs=${q.toExponential(3)} relative=${(he/(Ie||1)).toExponential(3)} differing=${I}/${U.length}`)}B.__BONSAI_ROWS={},$.reset(),J.reset(),await le(M,tt,y,c)}if(globalThis.__BONSAI_DECODE_DIFF===true&&x>=2){let{readbackF32:B}=await Promise.resolve().then(()=>(ze(),Nt)),_=globalThis,O=c.vocabSize;_.__BONSAI_ROWS={},$.reset(),J.reset(),_.__BONSAI_CAPTURE_TAG="A";let E=fe(f,x*p.embeddingLength,"hidden_diffA"),H=await le(M,E,y,c),ie=Array.from(await B({device:f,pipelines:m},H.logits,O));$.reset(),J.reset(),_.__BONSAI_CAPTURE_TAG=void 0;let Z=y.slice(0,-1),z=fe(f,Z.length*p.embeddingLength,"hidden_diffB");await le(M,z,Z,c);let U=globalThis.__BONSAI_INJECT_LAYER;if(typeof U=="number"&&Number.isFinite(U)){let Y=(_.__BONSAI_ROWS??{})[`A:${U}`];Y&&(globalThis.__BONSAI_INJECT={layer:U,row:Y},console.log(`[bonsai] INJECT armed at L${U}`))}_.__BONSAI_CAPTURE_TAG="B";let se=fe(f,p.embeddingLength,"hidden_diffDec");await Ze(M,[y[x-1]],se,g,p.embeddingLength);let q=await We(M,se,x-1,c),he=Array.from(await B({device:f,pipelines:m},q.logits,O));_.__BONSAI_CAPTURE_TAG=void 0;let Ie=_.__BONSAI_ROWS??{};for(let Y=0;Y<p.blockCount;Y++){let de=Ie[`A:${Y}`],Lt=Ie[`B:${Y}`];if(!de||!Lt||de.length!==Lt.length)continue;let Ne=0,Kn=0,xo=0,So=0;for(let Mt=0;Mt<de.length;Mt++){let nn=Math.abs(de[Mt]-Lt[Mt]);nn>Ne&&(Ne=nn),Kn+=nn,xo+=Math.abs(de[Mt]),nn>1e-6&&So++}console.log(`[bonsai] BLOCKDIFF L${Y} kind=${p.layerKinds[Y]} maxAbs=${Ne.toExponential(3)} meanAbs=${(Kn/de.length).toExponential(3)} relative=${(Kn/(xo||1)).toExponential(3)} differing=${So}/${de.length}`)}let I=0,R=0,re=0;for(let Y=0;Y<O;Y++){if(!Number.isFinite(he[Y])){re++;continue}let de=Math.abs(ie[Y]-he[Y]);de>I&&(I=de),R+=de}let tn=Y=>{let de=-1,Lt=-1/0;for(let Ne=0;Ne<O;Ne++)Number.isFinite(Y[Ne])&&Y[Ne]>Lt&&(Lt=Y[Ne],de=Ne);return de};console.log(`[bonsai] DECODE_DIFF pos=${x-1} maxAbs=${I.toFixed(4)} meanAbs=${(R/O).toFixed(6)} nonFiniteB=${re} argmaxA=${tn(ie)} argmaxB=${tn(he)} argmaxAgree=${tn(ie)===tn(he)}`),globalThis.__BONSAI_INJECT=void 0,_.__BONSAI_ROWS={},$.reset(),J.reset(),await le(M,tt,y,c)}let Pe=fe(f,p.embeddingLength,"hidden_decode"),At={device:f,pipelines:m,quantType:Tt,hadamard:h},Re=globalThis.__BONSAI_TIMING===true,Gt=jt(),_e={embed:0,forward:0,sample:0,tokens:0},mo=[],fo=async(B,_)=>{mo.push(B);let O=Re?performance.now():0;await Ze(M,[B],Pe,g,p.embeddingLength);let E=Re?performance.now():0,H=(await We(M,Pe,_,c)).logits;return(Re||Gt)&&await f.queue.onSubmittedWorkDone(),Re&&(_e.embed+=E-O,_e.forward+=performance.now()-E,_e.tokens++),H},as="�",ho=B=>{let _=c.decode(B),O=_.length;for(;O>0&&_[O-1]===as;)O--;return _.slice(0,O)},Dn=[],Fn=[],Jt="",go="",ss=(B,_,O)=>{let E=ho(B);return E.length>_.length&&E.startsWith(_)?(a({type:"token",text:E.slice(_.length),channel:O}),E):E.length>=_.length?E:_},bo=!!(l.tools&&l.tools.length>0),Zt="",wo=0,us=B=>{let _=ho(B),O=ki(_,bo);if(O.length>Zt.length&&O.startsWith(Zt)&&(a({type:"token",text:O.slice(Zt.length),channel:"answer"}),Zt=O),bo){let E=xi(_);for(let H=wo;H<E.length;H++)a({type:"token",text:E[H],channel:"tool"});wo=E.length}return _},lt=false;if(c.thinkEndId!==void 0&&c.thinkStartId!==void 0){let B=y.lastIndexOf(c.thinkStartId),_=y.lastIndexOf(c.thinkEndId);lt=B!==-1&&B>_}let _o=false,ls=64,en=[],Un=ne.logits,yo=x,ye=0,Wn="max-tokens",ko=Date.now();for(;ye<b&&!o;){let B=Re?performance.now():0,_=await St(At,Un,c.vocabSize,{temperature:w,topK:k,topP:v,repetitionPenalty:A,recentIds:en});if(Re&&(_e.sample+=performance.now()-B),ye++,c.isStop(_)){Wn="stop-token";break}en.push(_),en.length>ls&&en.shift(),_===c.thinkEndId?lt=false:_===c.thinkStartId?lt=true:lt?(Dn.push(_),Jt=ss(Dn,Jt,"thinking")):(Fn.push(_),go=us(Fn)),Un=await fo(_,yo++),lt&&!_o&&c.thinkEndId!==void 0&&ye>=N&&(_o=true,lt=false,Un=await fo(c.thinkEndId,yo++),a({type:"progress",file:"reasoning budget reached — answering"})),Gt&&await new Promise(ie=>setTimeout(ie,0));let O=10+Math.floor(ye/b*80),E=ye/((Date.now()-ko)/1e3),H=lt?"thinking":"answering";a({type:"progress",progress:O,file:`${H} · ${ye} tok · ${E.toFixed(1)} tok/s`}),(ye===1||ye%10===0)&&console.log(`[bonsai] ${ye} tokens · ${E.toFixed(2)} tok/s (${H})`)}o&&(Wn="interrupted");let cs=Date.now()-ko,ds=ye>0?ye/cs*1e3:0,vo=go.trim()||(Jt.trim()?"I ran out of room to finish that thought — my reasoning is above. Ask again and I'll be more direct.":"");if(console.log(`[bonsai] done: ${ye} tok, ${Wn}, think=${Dn.length} answer=${Fn.length}`),Re&&_e.tokens>0){let B=_e.tokens,_=ie=>(ie/B).toFixed(1),O=_e.embed+_e.forward+_e.sample,E=Be,H=E.calls>0?` [readback=${_(E.readbackMs)}ms select=${_(E.selectMs)}ms]`:"";console.log(`[bonsai] TIMING per token over ${B}: embed=${_(_e.embed)}ms forward=${_(_e.forward)}ms sample=${_(_e.sample)}ms${H} (${_(O)}ms total, ${(1e3/(O/B)).toFixed(1)} tok/s implied)`)}if(l.tools&&l.tools.length>0){let{setToolContext:B,drainToolActions:_}=await Promise.resolve().then(()=>(ao(),Ha));B(l.context??{});let{orchestrateToolCalls:O,extendMessagesWithToolResults:E}=await Promise.resolve().then(()=>(es(),Za)),{finalText:H,toolCalls:ie}=await O(vo,Z=>{Z.type==="tool_result"&&a({type:"progress",file:`executed ${Z.toolName}: ${Z.result}`})},Ac);if(ie.length>0){so=ie.filter(q=>q.type==="tool_result"&&!!q.toolName&&typeof q.result=="string").map(q=>({name:q.toolName,result:q.result}));let Z=_();Z.length>0&&a({type:"tool_action",actions:Z});let{drainImages:z}=await Promise.resolve().then(()=>(Mr(),ga)),U=z();U.length>0&&a({type:"image",images:U});let se=H.trim()?[...D,{role:"assistant",content:H}]:[...D];await d({...l,messages:E(se,ie),tools:void 0});return}}uo={device:f,kv:$,ssm:J,tokens:st(y,mo),signature:Oe,capacity:$.capacity},a({type:"done",text:vo,reasoning:Jt.trim()||void 0,tokensPerSecond:ds})}catch(c){let p=c.message,m=p.includes("not loaded")&&(p.includes("token_embd")||p.includes("output_norm"))?" The model weights were not fully downloaded. Clear your browser's site data (Settings → Privacy → Clear browsing data → Cached images and files), then reload this page to re-download the model. Or run locally: `pip install awdk && adk bonsai-local` for GPU-accelerated inference.":"";a({type:"error",message:`bonsai generate failed: ${p}${m}`})}}e.addEventListener("message",l=>{let c=l.data;c.type==="load"?u(c.modelId):c.type==="generate"?d(c):c.type==="interrupt"&&(o=true)})}var Bc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Ec=`// ============================================================================

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
`,Pc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Oc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,$c=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Rc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary
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
`,Ic=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const N : u32 = 1024u;           // prism.hadamard.block_size
const HALF : u32 = 512u;         // butterfly pairs per stage
const WG : u32 = 256u;           // threads per workgroup
const ELEMS_PER_THREAD : u32 = 4u;   // N / WG
const PAIRS_PER_THREAD : u32 = 2u;   // HALF / WG
const INV_SQRT_N : f32 = 0.03125;    // 1 / sqrt(1024) = 1/32, exact in f32

struct Dims { K : u32, n_rows : u32, sign_offset : u32, inverse : u32 };

@group(0) @binding(0) var<storage, read>       x     : array<f32>;
@group(0) @binding(1) var<storage, read>       signs : array<f32>;
@group(0) @binding(2) var<storage, read_write> out   : array<f32>;
@group(0) @binding(3) var<uniform>             dims  : Dims;

var<workgroup> s : array<f32, 1024>;

@compute @workgroup_size(256)
fn main(@builtin(local_invocation_id) lid : vec3<u32>,
        @builtin(workgroup_id) wid : vec3<u32>,
        @builtin(num_workgroups) nwg : vec3<u32>) {
  let local = lid.x;                 // 0..255
  let wg = wid.x + wid.y * nwg.x;
  let n_blk = dims.K / N;            // 1024-blocks per row (uniform)
  let row = wg / n_blk;              // uniform across the workgroup
  if (row >= dims.n_rows) { return; } // uniform: whole workgroup returns or none
  let b = wg % n_blk;
  let base  = row * dims.K + b * N;  // first element of this block in x / out
  let sbase = dims.sign_offset + b * N;
  let fwd = dims.inverse == 0u;      // uniform

  for (var j : u32 = 0u; j < ELEMS_PER_THREAD; j = j + 1u) {
    let i = local + j * WG;
    var v = x[base + i] * INV_SQRT_N;
    if (fwd) { v = v * signs[sbase + i]; }
    s[i] = v;
  }
  workgroupBarrier();

  var len : u32 = 1u;
  loop {
    if (len >= N) { break; }
    for (var q : u32 = 0u; q < PAIRS_PER_THREAD; q = q + 1u) {
      let p = local + q * WG;                     // pair index 0..511
      let j = (p / len) * (len * 2u) + (p % len); // low element of the pair
      let u = s[j];
      let v = s[j + len];
      s[j] = u + v;
      s[j + len] = u - v;
    }
    workgroupBarrier();
    len = len * 2u;
  }

  for (var j : u32 = 0u; j < ELEMS_PER_THREAD; j = j + 1u) {
    let i = local + j * WG;
    var v = s[i];
    if (!fwd) { v = v * signs[sbase + i]; }
    out[base + i] = v;
  }
}
`,Nc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary


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
`,qc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Gc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Mc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK_PTQ1_0 : u32 = 128u;
const WORDS_PER_BLOCK : u32 = 7u;   // 28 bytes per block, no padding
const QS_BYTES : u32 = 24u;         // qh[0] is at byte 24, qh[1] at byte 25, d at bytes 26..27

@group(0) @binding(0) var<storage, read>       blocks : array<u32>;   // n_blocks * 7
@group(0) @binding(1) var<storage, read_write> out_w  : array<f32>;   // n_blocks * 128
@group(0) @binding(2) var<uniform>             n_blocks : u32;

fn byte_at(block_base: u32, byte_index: u32) -> u32 {
  let word = blocks[block_base + (byte_index >> 2u)];
  let sh   = (byte_index & 3u) * 8u;
  return (word >> sh) & 0xffu;
}

fn trit_digit(byte: u32, n: u32) -> i32 {
  var v : u32 = byte;
  for (var i : u32 = 0u; i < n; i = i + 1u) { v = (v * 3u) & 0xffu; }
  return i32((v * 3u) >> 8u) - 1;
}

fn ptq1_trit(block_base: u32, e: u32) -> i32 {
  var byte_index : u32;
  var n : u32;
  if (e < 80u) {
    byte_index = e & 15u;
    n = e >> 4u;
  } else if (e < 120u) {
    let t = e - 80u;
    byte_index = 16u + (t & 7u);
    n = t >> 3u;
  } else {
    let t = e - 120u;
    byte_index = QS_BYTES + (t & 1u);
    n = t >> 1u;
  }
  return trit_digit(byte_at(block_base, byte_index), n);
}

@compute @workgroup_size(64)
fn main(@builtin(workgroup_id) wg_ : vec3<u32>,
        @builtin(local_invocation_id) lid_ : vec3<u32>,
        @builtin(num_workgroups) nwg_ : vec3<u32>) {
  let block = (wg_.x + wg_.y * nwg_.x) * 64u + lid_.x;
  if (block >= n_blocks) { return; }
  let bb = block * WORDS_PER_BLOCK;

  let d = unpack2x16float(blocks[bb + 6u] >> 16u).x;

  let out_base = block * QK_PTQ1_0;
  for (var e : u32 = 0u; e < QK_PTQ1_0; e = e + 1u) {
    out_w[out_base + e] = f32(ptq1_trit(bb, e)) * d;
  }
}
`,Cc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

const QK_PTQ1_0 : u32 = 128u;
const WORDS_PER_PTQ1 : u32 = 7u; // 28-byte GPU block == GGUF block (no pad, no repack)
const WORDS_PER_Q8 : u32 = 8u;
const TILE_PTQ1 : u32 = 32u;     // PTQ1_0 blocks per K-tile (32*128 = 4096 K elements)
const QS_BYTES : u32 = 24u;      // qh[0] at byte 24, qh[1] at byte 25, d at 26..27

struct Dims { K : u32, n_cols : u32, n_rows : u32, col_tiles : u32 };

@group(0) @binding(0) var<storage, read> weights : array<u32>;
@group(0) @binding(1) var<storage, read> act_d   : array<u32>;
@group(0) @binding(2) var<storage, read> act_qs  : array<u32>;
@group(0) @binding(3) var<storage, read_write> out : array<f32>;
@group(0) @binding(4) var<uniform> dims : Dims;

var<workgroup> sh_d  : array<u32, 128>;   // TILE_PTQ1 * 4
var<workgroup> sh_qs : array<u32, 1024>;  // TILE_PTQ1 * 4 * 8

fn sext8(b: u32) -> i32 {
  return (i32(b) ^ 0x80) - 0x80;
}

fn block_byte(bw: ptr<function, array<u32, 7>>, byte_index: u32) -> u32 {
  let word = (*bw)[byte_index >> 2u];
  return (word >> ((byte_index & 3u) * 8u)) & 0xffu;
}

fn trit_digit(byte: u32, n: u32) -> i32 {
  var v : u32 = byte;
  for (var i : u32 = 0u; i < n; i = i + 1u) { v = (v * 3u) & 0xffu; }
  return i32((v * 3u) >> 8u) - 1;
}

fn ptq1_trit(bw: ptr<function, array<u32, 7>>, e: u32) -> i32 {
  var byte_index : u32;
  var n : u32;
  if (e < 80u) {
    byte_index = e & 15u;
    n = e >> 4u;
  } else if (e < 120u) {
    let t = e - 80u;
    byte_index = 16u + (t & 7u);
    n = t >> 3u;
  } else {
    let t = e - 120u;
    byte_index = QS_BYTES + (t & 1u);
    n = t >> 1u;
  }
  return trit_digit(block_byte(bw, byte_index), n);
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

  let n_ptq1 = dims.K / QK_PTQ1_0;
  let a_row_q8_base = row * (dims.K / 32u);

  var result : f32 = 0.0;

  var c0 : u32 = 0u;
  loop {
    if (c0 >= n_ptq1) { break; }
    let cn = min(TILE_PTQ1, n_ptq1 - c0); // ptq1-blocks in this tile (uniform)
    let n_q8 = cn * 4u;                    // q8-blocks in this tile
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
        let wb = (col * n_ptq1 + i) * WORDS_PER_PTQ1;

        var bw : array<u32, 7>;
        for (var w : u32 = 0u; w < WORDS_PER_PTQ1; w = w + 1u) { bw[w] = weights[wb + w]; }
        let d0 = unpack2x16float(bw[6] >> 16u).x;                // per-128 weight scale

        var block_sum : f32 = 0.0;
        for (var k : u32 = 0u; k < 4u; k = k + 1u) {
          let qb    = il * 4u + k;                              // shared q8-block index
          let d1    = unpack2x16float(sh_d[qb] & 0xffffu).x;    // per-32 activation scale
          let qs_sh = qb * WORDS_PER_Q8;

          var acc : i32 = 0;                                    // INTEGER accumulation (order-free)
          for (var wi : u32 = 0u; wi < 8u; wi = wi + 1u) {
            let aword = sh_qs[qs_sh + wi];                      // int8s from shared (one read/4 lanes)
            for (var m : u32 = 0u; m < 4u; m = m + 1u) {
              let e  = k * 32u + wi * 4u + m;
              let q  = ptq1_trit(&bw, e);                       // {-1, 0, +1}
              let q8 = sext8((aword >> (m * 8u)) & 0xffu);
              acc = acc + q * q8;
            }
          }
          block_sum = block_sum + d1 * f32(acc);               // * per-32 scale (k order)
        }
        result = result + d0 * block_sum;                      // * per-128 scale (i order)
        il = il + 1u;
      }
    }
    workgroupBarrier();                 // all threads done reading shared before next tile overwrites
    c0 = c0 + TILE_PTQ1;
  }

  if (valid) { out[row * dims.n_cols + col] = result; }
}
`,Dc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Fc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Uc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Wc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Kc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Qc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,jc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,zc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Hc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Yc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Xc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,Vc=`// SPDX-License-Identifier: LicenseRef-Aitherium-Proprietary

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
`,ns={causal_conv1d:Bc,deltanet:Ec,deltanet_gate:Pc,deltanet_seq:Oc,elementwise:$c,elementwise_inplace:Rc,fwht_1024:Ic,image_ops:Nc,kv_quant_4bit:qc,logit_topk:Gc,ptq1_0_dequant:Mc,ptq1_0_q8_0_matmul:Cc,q1_0_dequant:Dc,q1_0_q8_0_matmul:Fc,q2_0_dequant:Uc,q2_0_q8_0_matmul:Wc,quantize_q8_0:Kc,rmsnorm:Qc,rope_imrope:jc,sampling:zc,softmax_attn:Hc,softmax_attn_batched:Yc,swiglu:Xc,vae_ops:Vc};Me();Tr();function is(e){try{return typeof process<"u"&&process.env&&process.env[e]||""}catch{return""}}var Xt="https://huggingface.co/prism-ml",Jc="https://weights.aitherium.com",rs=is("NEXT_PUBLIC_BONSAI_MIRROR_BASE"),os=rs==="none"?"":rs||Jc;function lo(e){let t=[e.url];if(os){let n=e.url.split("/").pop();n&&t.push(`${os.replace(/\/+$/,"")}/${n}`)}return t}var Zc=[{id:"bonsai-1.7b",label:"Bonsai 1.7B",params:"1.7B",sizeMb:236,url:`${Xt}/Bonsai-1.7B-gguf/resolve/main/Bonsai-1.7B-Q1_0.gguf`,contextWindow:32768,blurb:"The lightest size — 236 MB, runs right here in your browser, and quick enough on a phone. Start here.",arch:"qwen3"},{id:"bonsai-4b",label:"Bonsai 4B",params:"4B",sizeMb:545,url:`${Xt}/Bonsai-4B-gguf/resolve/main/Bonsai-4B-Q1_0.gguf`,contextWindow:32768,blurb:"The balanced pick: noticeably smarter than 1.7B, still a quick download, still runs in the browser.",arch:"qwen3"},{id:"bonsai-8b",label:"Bonsai 8B",params:"8B",sizeMb:1104,url:`${Xt}/Bonsai-8B-gguf/resolve/main/Bonsai-8B-Q1_0.gguf`,contextWindow:65536,blurb:"Better reasoning, ~1 GB. Comfortable on a desktop with a real GPU; a big ask on a phone.",arch:"qwen3"},{id:"bonsai-27b-text",label:"Bonsai 27B",params:"27B",sizeMb:3627,url:`${Xt}/Bonsai-27B-gguf/resolve/main/Bonsai-27B-Q1_0.gguf`,contextWindow:262144,blurb:"The full brain. 3.6 GB and slow in a browser — for a real GPU, or self-host it with llama.cpp for the higher-quality ternary build.",arch:"qwen35",serverRuntime:"llama.cpp",measured:{benchScore:.7821,meanTokens:713,tradeoff:"Runs on stock llama.cpp and in a browser. Declines more readily when it does not know something, and thinks for longer to get there.",mdeNote:"AitherBench publishes a minimum detectable effect of 0.0385. The overall gap (0.1344) is 3.5x that and holds; per-dimension deltas on its 2-item dimensions are one question each and must not be read as trends."}},{id:"bonsai2-27b",label:"Bonsai 2 27B",params:"27B",sizeMb:5671,url:`${Xt}/Ternary-Bonsai-2-27B-gguf/resolve/main/Ternary-Bonsai-2-27B-PTQ1_0.gguf`,contextWindow:262144,blurb:"The new generation. 5.7 GB, 1.75 bits per weight -- not runnable in a browser yet; self-host it with the PrismML llama.cpp fork on a real GPU.",arch:"qwen35",browser:false,serverRuntime:"llama.cpp-prism",measured:{benchScore:.9165,meanTokens:328,tradeoff:"Better at multi-step reasoning and answers in under half the tokens, but needs the PrismML fork and is likelier to answer a question it should decline.",mdeNote:"AitherBench publishes a minimum detectable effect of 0.0385. The overall gap (0.1344) is 3.5x that and holds; per-dimension deltas on its 2-item dimensions are one question each and must not be read as trends."}}];var co="bonsai-1.7b";function Vt(e){return Zc.find(t=>t.id===e)}function po(e){let t=Vt(e)??Vt(co),n=lo(t);return n.length>1?n[n.length-1]:n[0]}var ed="https://weights.aitherium.com",cm=is("NEXT_PUBLIC_BONSAI_WASM_BASE")||ed||"https://weights.aitherium.com";ts(self,{loadKernels:async()=>ns,acquireDevice:async()=>{let e=navigator;if(!e.gpu)throw new Error("WebGPU unavailable (navigator.gpu missing)");let t=await e.gpu.requestAdapter({powerPreference:"high-performance"}),n=false;if(t||(t=await e.gpu.requestAdapter({forceFallbackAdapter:true}).catch(()=>null),n=t!==null),!t)throw new Error("no WebGPU adapter (even the software fallback refused)");let r=t.limits,o={};for(let f of["maxStorageBufferBindingSize","maxBufferSize","maxComputeWorkgroupStorageSize"]){let m=r[f];typeof m=="number"&&m>0&&(o[f]=m)}let i=await t.requestDevice({requiredLimits:o}),a=t,s=t.info||{},u=n||a.isFallbackAdapter===true||s.isFallbackAdapter===true,d=xr({...s,isFallbackAdapter:u});console.info(`[bonsai] adapter: vendor='${s.vendor??"?"}' arch='${s.architecture??"?"}' fallback=${u} -> class '${d}'`),d==="software"&&console.warn("[bonsai] NO GPU: this browser handed back a SOFTWARE adapter, not your graphics card. Bonsai will run, but expect well under 1 tok/s — the hosted ladder or a local node is the right path here. (Chrome: check chrome://gpu for a disabled/crashed GPU process.)");let l=typeof navigator<"u"&&/Windows/i.test(navigator.userAgent??""),c=jt(),p=Zi(d,{windowsTdr:l,mobile:c});if(p>0&&(console.warn(`[bonsai] adapter classified '${d}' (${t.info?.vendor??"?"}) — capping at ${p} dispatches/submit to stay under the OS GPU watchdog (TDR) deadline of ~2s. This reduces per-batch duration at the cost of more queue.submit() calls. If you still see GPU resets, choose a smaller model — this class of adapter cannot safely run large ones.`),mi(i,p)),i.lost){let f=i.lost,m=setTimeout(()=>{console.error("[bonsai] WARNING: device.lost promise did not resolve within 30s — this adapter may not support proper device-lost observation. Fallback routing may be needed.")},3e4);f.then(()=>{clearTimeout(m)}).catch(()=>{clearTimeout(m)})}return i},resolveModelUrl:e=>po(e),resolveMirrorUrls:e=>{let t=Vt(e)??Vt(co);if(!t)return[po(e)];let n=lo(t);return n.length>1?[n[n.length-1],n[0]]:n}});
