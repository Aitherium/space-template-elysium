#!/usr/bin/env bash
# Build dist/site.tar.gz for the Elysium Space template.
#
# Usage:
#   ./build.sh                          fetch the published hub, verify it against the lock
#   ./build.sh --from-origin URL        fetch from another https origin (same lock)
#   ./build.sh --from-dir DIR           copy a local tree: DIR/gobbonet/ and DIR/workers/
#   ./build.sh --update-lock            refresh manifest.lock.json from the source and
#                                       print what changed; review and commit the diff
#
# Nothing large is committed to this repository. The hub (about 54 MB unpacked,
# most of it WebAssembly runtimes) is copied or downloaded at build time, checked
# byte-for-byte against manifest.lock.json, patched to run under any path on any
# origin, stripped of source comments, verified, and packed flat so that
# extracting the tarball into the site directory puts index.html at the top.
#
# Model weights are NOT in the tarball: the browser downloads them on demand from
# the model CDN after the visitor consents.
#
# Requires: bash, curl, tar, python3, node (npx fetches a pinned esbuild).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$HERE/dist"
SITE="$DIST/site"
LOCK="$HERE/manifest.lock.json"
ORIGIN="https://elysium.aitherium.com"
FROM_DIR=""
UPDATE_LOCK=0
ESBUILD="esbuild@0.24.2"

while [ $# -gt 0 ]; do
  case "$1" in
    --from-origin) ORIGIN="${2:?--from-origin needs a URL}"; FROM_DIR=""; shift 2 ;;
    --from-dir) FROM_DIR="${2:?--from-dir needs a directory}"; shift 2 ;;
    --update-lock) UPDATE_LOCK=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

case "$ORIGIN" in
  https://*) ;;
  *) echo "--from-origin must be an https:// URL" >&2; exit 2 ;;
esac

PY=""
for c in python3 python; do
  # A name on PATH is not enough: some systems ship a stub that only prints a hint.
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(sys.version_info < (3, 8))' >/dev/null 2>&1; then
    PY="$c"; break
  fi
done
[ -n "$PY" ] || { echo "python 3.8+ is required" >&2; exit 2; }

rm -rf "$DIST"
mkdir -p "$SITE/workers"

# HTTPS only, no redirects: a fetch can never be bounced to another host or scheme.
fetch() {  # fetch URL DEST
  curl -fsS --proto =https --max-redirs 0 --retry 3 --connect-timeout 20 --max-time 300 \
    "$1" -o "$2" || { echo "could not fetch $1" >&2; exit 1; }
}

# Print one file path per line from a {"files": [...]} manifest.
manifest_files() {
  "$PY" -c 'import json,sys; [print(f) for f in json.load(open(sys.argv[1], encoding="utf-8"))["files"]]' "$1" | tr -d '\r'
}

fetch_tree() {  # fetch_tree BASE_URL DEST_DIR
  local base="${1%/}" dest="$2" list files f n=0
  list="$(mktemp)"
  fetch "$base/manifest.json" "$list"
  files="$(manifest_files "$list")" || { echo "$base/manifest.json is not a file list" >&2; exit 1; }
  rm -f "$list"
  while IFS= read -r f; do
    case "$f" in ""|/*|*..*|*[!A-Za-z0-9._/-]*) echo "refusing manifest entry: $f" >&2; exit 1 ;; esac
    mkdir -p "$dest/$(dirname "$f")"
    fetch "$base/$f" "$dest/$f"
    n=$((n + 1))
  done <<< "$files"
  [ "$n" -gt 0 ] || { echo "$base/manifest.json listed no files" >&2; exit 1; }
  echo "[elysium] fetched $n file(s) from $base"
}

if [ -n "$FROM_DIR" ]; then
  [ -f "$FROM_DIR/gobbonet/index.html" ] || { echo "$FROM_DIR/gobbonet/index.html not found" >&2; exit 1; }
  [ -d "$FROM_DIR/workers" ] || { echo "$FROM_DIR/workers/ not found" >&2; exit 1; }
  cp -R "$FROM_DIR/gobbonet/." "$SITE/"
  cp -R "$FROM_DIR/workers/." "$SITE/workers/"
  echo "[elysium] copied from $FROM_DIR"
else
  fetch_tree "$ORIGIN" "$SITE"
  fetch_tree "$ORIGIN/workers" "$SITE/workers"
fi

# The source manifests describe the source tree, not this one.
rm -f "$SITE/manifest.json" "$SITE/workers/manifest.json"

# The CDN in front of the origin splices a per-request script into HTML; drop it
# first so the lock sees the same bytes on every fetch.
"$PY" "$HERE/space/patch.py" --strip-edge "$SITE"

# Every byte that goes on to be patched must be the byte that was reviewed.
if [ "$UPDATE_LOCK" = 1 ]; then
  "$PY" "$HERE/space/lock.py" write "$LOCK" "$SITE"
else
  "$PY" "$HERE/space/lock.py" verify "$LOCK" "$SITE"
fi

cp "$HERE/space/space.js" "$SITE/space.js"
# The chat workbench is GobboNet (MIT); its notice travels with every copy.
cp "$HERE/space/LICENSE-GobboNet.txt" "$SITE/LICENSE-GobboNet.txt"
"$PY" "$HERE/space/patch.py" "$SITE"

# Strip comments from every script. Whitespace-only minification: no renaming and
# no syntax changes, so the code that runs is the code that was verified above.
# .mjs files are left alone (esbuild would rename them to .js).
command -v npx >/dev/null 2>&1 || { echo "node/npx is required to strip comments" >&2; exit 2; }
mapfile -t scripts < <(cd "$SITE" && find . -name '*.js' ! -name space.js | sed 's|^\./||' | sort)
[ "${#scripts[@]}" -gt 0 ] || { echo "no scripts found to strip" >&2; exit 1; }
(cd "$SITE" && npx --yes "$ESBUILD" "${scripts[@]}" --outdir=. --outbase=. --allow-overwrite \
  --minify-whitespace --legal-comments=none --charset=utf8 --log-level=warning)
echo "[elysium] comments stripped from ${#scripts[@]} script(s)"
# Minifying turns shader source into multi-line template literals; their own
# comment lines go now.
"$PY" "$HERE/space/patch.py" --strip-shaders "$SITE"
"$PY" "$HERE/space/patch.py" --scan "$SITE"

tar -czf "$DIST/site.tar.gz" -C "$SITE" .
echo "[elysium] wrote $DIST/site.tar.gz ($(wc -c < "$DIST/site.tar.gz") bytes, $(find "$SITE" -type f | wc -l) files)"
