# space-template-elysium

The Elysium hub as a Space: the connected workspace plus the in-browser chat
workbench, with an on-device model that runs on your GPU through WebGPU (or on
the CPU through WebAssembly when there is no GPU).

## Using it

A Space built from this template is a small repository in your own GitHub
account. It holds one file you edit, `aither.config.json`:

```json
{
  "handle": "yourname",
  "template": "elysium",
  "templateVersion": "v0.1.0",
  "apiBase": "https://api.aitherium.com",
  "basePath": "/my-space/",
  "name": "My Space",
  "tagline": "A corner of the web, grown as code.",
  "accentColor": "#5ad1ff",
  "agentName": "Aither"
}
```

Edit it and push. The Space's Pages workflow downloads the latest release of
this template, puts your `aither.config.json` beside `index.html`, and
redeploys. Nothing else in your repository needs to change.

What each field does here:

| field | effect |
|---|---|
| `name`, `tagline` | page title and description |
| `accentColor` | the primary neon colour of the hub and of the chat (`#rgb` or `#rrggbb`) |
| `agentName` | exposed to the page as `window.AITHER_SPACE.agentName` |
| `apiBase` | exposed as `window.AITHER_SPACE.apiBase`; the hub's own backends are fixed at build time |
| `basePath` | the path the site is served under, exposed as `window.AITHER_SPACE.basePath`; the site itself uses relative URLs and works under any path |
| `customDomain` | optional; the domain you attached in Pages settings (e.g. `space.example.org`). The in-browser model only starts on `*.github.io` or on this exact host |
| `localNodes` | optional; model servers on the visitor's own machine to look for, e.g. `["http://127.0.0.1:8080"]`. Loopback `http://` addresses only; none by default |
| `localForge` | optional; the same, for a local Media Forge. None by default |

A missing or malformed config falls back to the defaults shown above.

## Where it is served

GitHub Pages serves the Space from your repository's project path,
`https://<your-login>.github.io/<repo>/`. To use your own domain instead, add it
under **Settings > Pages > Custom domain** in your repository, and set the same
hostname as `customDomain` in `aither.config.json` so the in-browser model is
allowed to start there.

## What is in the site

- `index.html` and `assets/`: the hub.
- `chat.html`, `css/`, `js/`: the chat workbench (GobboNet, MIT; see
  `LICENSE-GobboNet.txt`).
- `workers/`: the in-browser model engines, served from the same origin as the
  page because browsers only start workers from their own origin.
- `space.js`: reads `aither.config.json` and applies it.

Model weights are not in the site. The browser downloads them from the model
CDN only after the visitor agrees to the download.

## Building

```bash
./build.sh                               # from the published hub
./build.sh --from-origin https://host    # from another published copy
./build.sh --from-dir path/to/public     # from a local tree with gobbonet/ and workers/
./build.sh --update-lock                 # refresh manifest.lock.json; review the diff
```

Every source is checked against `manifest.lock.json` before anything is patched:
the same file set, sizes and sha256, or the build fails. Downloads are HTTPS-only
with no redirects.

The output is `dist/site.tar.gz`, flat, so extracting it into the site directory puts
`index.html` at the top. The build rewrites the few paths that assumed the
original origin, removes the source's file lists, strips comments from every
script, and fails if any page or stylesheet references a local file that is not
in the tree or if an internal reference survives in the site.

Requires bash, curl, tar, Python 3.8 or newer, and Node.js (the build runs a
pinned esbuild through `npx` to strip source comments from every script).

## Releasing

`.github/workflows/release.yml` builds the tarball on every `v*` tag, against the
committed lock, and attaches it to a new release for that tag. It never refreshes
the lock and never replaces an existing release. Spaces always deploy the latest
release.
