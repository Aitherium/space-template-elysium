#!/usr/bin/env python3
"""Make a staged Elysium tree work from any path on any origin, then verify it.

Usage: python3 space/patch.py SITE_DIR               patch, then verify references
       python3 space/patch.py --strip-edge SITE_DIR  drop CDN-injected scripts (before locking)
       python3 space/patch.py --strip-shaders SITE_DIR  drop shader comments (after minifying)
       python3 space/patch.py --scan SITE_DIR        leak scan (after comments are stripped)

The hub is published at the root of its own origin. A Space serves the same files
from a project-Pages subpath, `https://<user>.github.io/<repo>/`, so this script
makes every same-origin URL resolve against the page's own directory, injects the
Space branding script, and then refuses to pass a tree that would 404 in a browser.

Exit 0 = patched and verified. Exit 1 = a required anchor moved, a local
reference does not resolve, or the scan found an internal reference; the tarball
must not be published.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ADAPTER = "aither-bonsai-adapter.js"

# The in-browser model refuses to start on hosts outside an allowlist. In a Space
# build that list is loopback only (for local testing), plus any *.github.io host,
# plus the custom domain the owner declared as `customDomain` in aither.config.json
# (space.js validates it and refuses aitherium.com names). The model download
# itself stays behind the per-visitor consent dialog.
ALLOWED_HOSTS_OLD = re.compile(r"var ALLOWED_HOSTS = \[[^\]]*\];")
ALLOWED_HOSTS_NEW = "var ALLOWED_HOSTS = ['localhost', '127.0.0.1'];"
HOST_GATE_OLD = "if (!h || ALLOWED_HOSTS.indexOf(h) < 0) {"
HOST_GATE_NEW = (
    "if (!h || (ALLOWED_HOSTS.indexOf(h) < 0 && !/\\.github\\.io$/.test(h)"
    " && __aitherSpaceCustomDomain() !== h)) {"
)

# Readers of the Space config, prepended to every patched script that needs one.
# Lists are validated by space.js (loopback URLs only) and default to empty.
SPACE_CONFIG_FNS = (
    "function __aitherSpaceCustomDomain() {\n"
    "  var s = window.AITHER_SPACE;\n"
    "  return (s && typeof s.customDomain === 'string') ? s.customDomain : '';\n"
    "}\n"
    "function __aitherSpaceList(key) {\n"
    "  var s = window.AITHER_SPACE, v = s && s[key];\n"
    "  return Array.isArray(v) ? v.slice() : [];\n"
    "}\n"
)

# Local-service probes. The published hub probes a fixed set of loopback ports on
# every visitor's machine; a Space probes only what its owner lists in the config.
ADAPTER_BLOCKS = [
    ("local node list", re.compile(r"var LOCAL_NODE_BASES = \[.*?\n  \];", re.S),
     "var LOCAL_NODE_BASES = [];"),
    ("local image backend list", re.compile(r"var LOCAL_IMAGE_BACKENDS = \[.*?\n  \];", re.S),
     "var LOCAL_IMAGE_BACKENDS = [];"),
    ("gateway test", re.compile(r"function isGateway\(base\) \{[^\n]*\}"),
     "function isGateway(base) { return false; }"),
]
MEDIAFORGE = "mediaforge.js"
MEDIAFORGE_ANCHORS = [
    ("forge list", re.compile(r"var FORGE_BASES = \[[^\]]*\];[^\n]*"), "var FORGE_BASES = [];"),
    ("forge lookup", re.compile(r"FORGE_BASES\.slice\(\)"), "__aitherSpaceList('localForge')"),
    ("forge hint", re.compile(r"\(127\.0\.0\.1:\d{2,5}\)"),
     "(list its address as localForge in aither.config.json)"),
]

# The hub bundle carries its own copy of the loopback port list (minified, so it
# is matched by shape) and a port-suffix test for one of its entries. Both go
# inert in a Space.
HUB_PORT_LIST = re.compile(
    r"\[\{port:[\de]+,kind:\"[a-z-]+\"\}(?:,\{port:[\de]+,kind:\"[a-z-]+\"\})*\]")
HUB_GATEWAY_TEST = re.compile(r"/:\d{4,5}\$/")
# Promise.any([]) rejects, so the emptied list must short-circuit to "no node".
HUB_PROBE_ANY = re.compile(r"await Promise\.any\((\w+)\.map\(async (\w+)=>await \2\)\)")
HUB_PROBE_ANY_NEW = r"await (\1.length?Promise.any(\1.map(async \2=>await \2)):null)"

# localStorage keys, given the Space's own prefix consistently in every script
# that shares them.
STORAGE_KEYS = re.compile(
    r"""(["'`])[a-z]+-(bonsai-consent|gobbonet-cta-dismissed|gateway-token)\1""")
STORAGE_KEYS_NEW = r"\1aither-space-\2\1"

# Under a subpath every same-origin path the adapter judges must be read relative
# to the Space's own directory: the reading-surface gate (a repo named `docs`
# would otherwise refuse itself) and the request router that answers the chat's
# local-backend calls inside the browser.
SPACE_PATH_FN = (
    "function __aitherSpacePath(p) {\n"
    "  try {\n"
    "    var b = new URL('.', document.baseURI).pathname;\n"
    "    if (b.length > 1 && p.indexOf(b) === 0) return '/' + p.slice(b.length);\n"
    "  } catch (e) { /* no base: judge the path as it is */ }\n"
    "  return p;\n"
    "}\n"
)
ADAPTER_ANCHORS = [
    ("reading-surface gate",
     "var p = location.pathname || '/';",
     "var p = __aitherSpacePath(location.pathname || '/');"),
    ("request router",
     "try { return new URL(url, window.location.origin).pathname; }",
     "try { return __aitherSpacePath(new URL(url, document.baseURI).pathname); }"),
    ("worker fallback candidate",
     "try { cands.push(new URL(absolutePath, window.location.origin).href); }",
     "try { cands.push(new URL(absolutePath, document.baseURI).href); }"),
]

# The chat's own origin-anchored URLs, rewritten to resolve against the page.
PAGE_BASE = "new URL('.', document.baseURI).href.slice(0, -1)"
CHAT_REWRITES = [
    (re.compile(r"window\.location\.origin\s*\+\s*'/"), PAGE_BASE + " + '/"),
    (re.compile(r"""fetch\((["'])/"""), r"fetch(\1"),
]
# The tool registry's reference corpus is served by the main site with open CORS.
CORPUS_OLD = re.compile(r"""(["'`])/corpus/""")
CORPUS_NEW = r"\1https://aitherium.com/corpus/"

# Left in any unbundled script after patching, these would fetch from the root of
# the user's github.io origin instead of from the Space.
ROOT_ANCHORED = re.compile(
    r"""location\.origin\s*\+|fetch\(\s*["'`]/|["'`]/(?:gobbonet|workers|corpus)/"""
)

# A self-hosted font the upstream tree references but never ships (it 404s on
# every origin). The font stack already falls back, so drop the dead request.
DEAD_FONT_FACE = re.compile(r"@font-face\s*\{[^}]*\.\./fonts/[^}]*\}\s*", re.S)

SPACE_TAG = '<script src="./space.js"></script>'

# A CDN in front of the source origin can splice a bot-check <script> into every
# HTML response. It loads from a path only that CDN serves, so on a Space it is a
# guaranteed 404. Strip it when the tree was fetched rather than copied.
EDGE_INJECTION = re.compile(
    r"<script>\(function\(\)\{function c\(\)\{.*?__CF\$cv\$params.*?</script>", re.S
)

# The site is public. Comments are stripped before packing (build.sh); anything
# below that survives is in live code or copy and must be fixed at the source.
# Generic shapes only: a rule that spelled out a specific private name would be
# the leak itself. The maintainers run their own name scan before publishing.
LEAKS = [
    ("private address", re.compile(
        r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}"
        r"|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
        r"|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3})\b")),
    ("loopback port", re.compile(
        r"(?:\b127\.\d{1,3}\.\d{1,3}\.\d{1,3}|\blocalhost|\[::1\]):\d{2,5}")),
    ("secret name", re.compile(r"""["'`][A-Z][A-Z0-9_]*_(?:TOKEN|SECRET|KEY)["'`]""")),
    ("loopback probe entry", re.compile(r"\{port:[\de]+,kind:")),
    ("port-suffix test", re.compile(r"/:\d{4,5}\$/")),
]

# Surviving hits that are public by nature. Each names the file, the exact
# literal and why it may ship; the list is printed on every scan.
LEAK_ALLOW = [
    ("js/01-config.js", "127.0.0.1:11434",
     "upstream GobboNet's own default for a page opened from disk; unused when served"),
    ("js/02-model.js", "127.0.0.1:11435", "same upstream default (search proxy)"),
    ("js/02-model.js", "127.0.0.1:11436", "same upstream default (embedder)"),
    ("image-renderer.js", "127.0.0.1:8188",
     "fixture in the mod's self-test of its loopback-URL classifier; nothing is fetched"),
    ("image-renderer.js", "localhost:8188", "same self-test fixture"),
]

HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
# A line holding an unescaped backtick or `${` could close or interpolate the
# literal: keep it. An escaped backtick (\`) is just text inside the literal.
SHADER_COMMENT_LINE = re.compile(r"^[ \t]*//(?:\\[\\`]|(?!\$\{)[^\n`\\])*\n", re.M)
SCRIPT_BLOCK = re.compile(r"(<script\b.*?</script>)", re.S | re.I)

# String literals that point at an origin-absolute path this tree serves itself.
ORIGIN_ABS = re.compile(r"""(["'`])/(gobbonet|workers)/""")


def fail(msg: str) -> None:
    print(f"[elysium] FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def write(p: Path, text: str) -> None:
    p.write_text(text, encoding="utf-8", newline="")


def patch_adapter(site: Path) -> None:
    p = site / ADAPTER
    if not p.is_file():
        fail(f"{ADAPTER} missing from the staged tree")
    text = read(p)
    if text.count(HOST_GATE_OLD) != 1:
        fail("the adapter's host gate moved; update HOST_GATE_OLD in space/patch.py")
    text = text.replace(HOST_GATE_OLD, HOST_GATE_NEW)
    text = replace_once(text, "host allowlist", ALLOWED_HOSTS_OLD, ALLOWED_HOSTS_NEW)
    for label, rx, new in ADAPTER_BLOCKS:
        text = replace_once(text, label, rx, new)
    if text.count("LOCAL_NODE_BASES.map(") != 1:
        fail("the adapter's local node probe moved; update patch_adapter in space/patch.py")
    text = text.replace("LOCAL_NODE_BASES.map(", "__aitherSpaceList('localNodes').map(")
    for label, old, new in ADAPTER_ANCHORS:
        if text.count(old) != 1:
            fail(f"the adapter's {label} moved; update ADAPTER_ANCHORS in space/patch.py")
        text = text.replace(old, new)
    # '/gobbonet/x' -> 'x' and '/workers/x' -> 'workers/x': both then resolve
    # beside the adapter, which sits in the Space's directory.
    text = re.sub(r"""(["'])/gobbonet/""", r"\1", text)
    text = re.sub(r"""(["'])/workers/""", r"\1workers/", text)
    write(p, SPACE_CONFIG_FNS + SPACE_PATH_FN + text)
    print("[elysium] adapter: host gate is github.io + declared custom domain; "
          "local probes come from the config; paths judged relative to the Space")


def replace_once(text: str, label: str, rx: re.Pattern[str], new: str) -> str:
    out, n = rx.subn(lambda _m: new, text)
    if n != 1:
        fail(f"expected one {label}, found {n}; update the anchor in space/patch.py")
    return out


def patch_mediaforge(site: Path) -> None:
    p = site / MEDIAFORGE
    if not p.is_file():
        return
    text = read(p)
    for label, rx, new in MEDIAFORGE_ANCHORS:
        text = replace_once(text, label, rx, new)
    write(p, SPACE_CONFIG_FNS + text)
    print("[elysium] mediaforge: forge address comes from the config (default none)")


def patch_hub(site: Path) -> None:
    lists = gates = probes = 0
    for p in sorted((site / "assets").glob("*.js")):
        text = read(p)
        text, a = HUB_PORT_LIST.subn("[]", text)
        text, b = HUB_GATEWAY_TEST.subn("/^(?!)$/", text)
        text, c = HUB_PROBE_ANY.subn(HUB_PROBE_ANY_NEW, text) if a else (text, 0)
        if a or b:
            write(p, text)
        lists, gates, probes = lists + a, gates + b, probes + c
    if lists != 1 or probes != 1:
        fail(f"expected one hub loopback port list and one probe, found {lists} and {probes};"
             " update HUB_PORT_LIST / HUB_PROBE_ANY")
    print(f"[elysium] hub: loopback probe list emptied, {gates} gateway test(s) disabled")


def strip_shader_comments(site: Path) -> None:
    """Drop whole-line `//` comments from minified scripts that embed WGSL shader source.

    Shader source lives in template literals, which the comment stripper must leave
    alone, so its comments would ship verbatim. A whole line that starts with `//`
    is a comment in both JS and WGSL, so removing it changes no behaviour.
    """
    n = 0
    for p in sorted(list((site / "assets").glob("*.js")) + list((site / "workers").glob("*.js"))):
        text = read(p)
        if "@workgroup_size" not in text:
            continue
        new = SHADER_COMMENT_LINE.sub("", text)
        if new != text:
            write(p, new)
            n += 1
    print(f"[elysium] shader comments stripped in {n} script(s)")


def rename_storage_keys(site: Path) -> None:
    n = 0
    for p in sorted(site.rglob("*.js")):
        text = read(p)
        new = STORAGE_KEYS.sub(STORAGE_KEYS_NEW, text)
        if new != text:
            write(p, new)
            n += 1
    print(f"[elysium] storage keys renamed in {n} script(s)")


def patch_chat(site: Path) -> None:
    n = 0
    for p in sorted((site / "js").glob("*.js")):
        text = read(p)
        new = text
        for rx, repl in CHAT_REWRITES:
            new = rx.sub(repl, new)
        if new != text:
            write(p, new)
            n += 1
    if not n:
        fail("no chat script carried an origin-anchored URL; the rewrite anchors moved")
    # The registry is also bundled into the workers, where a root path resolves
    # against the origin just the same.
    for tools in [site / "bonsai-tools.js", *sorted((site / "workers").glob("*.js"))]:
        if tools.is_file():
            write(tools, CORPUS_OLD.sub(CORPUS_NEW, read(tools)))
    print(f"[elysium] chat: {n} script(s) now resolve URLs against the page")


def patch_workers(site: Path) -> None:
    wdir = site / "workers"
    if not wdir.is_dir():
        fail("workers/ missing from the staged tree")
    n = 0
    for p in sorted(wdir.glob("*.js")) + sorted(wdir.glob("*.mjs")):
        text = read(p)
        # Inside a worker a relative URL resolves against the worker's own URL,
        # which is already workers/, so '/workers/x' becomes './x'.
        new = re.sub(r"""(["'`])/workers/""", r"\1./", text)
        if new != text:
            write(p, new)
            n += 1
    print(f"[elysium] workers: {n} file(s) made worker-relative")


def patch_font(site: Path) -> None:
    for p in sorted((site / "css").glob("*.css")):
        text = read(p)
        new = DEAD_FONT_FACE.sub("", text)
        if new != text:
            write(p, new)
            print(f"[elysium] css: dropped the unshipped font-face in {p.name}")


def strip_edge(site: Path) -> None:
    """Remove the CDN's per-request script so fetched pages hash the same every time."""
    for p in sorted(site.glob("*.html")):
        text, n = EDGE_INJECTION.subn("", read(p))
        if n:
            write(p, text)
            print(f"[elysium] {p.name}: stripped {n} CDN-injected script(s)")


def inject_space(site: Path) -> None:
    for name in ("index.html", "chat.html"):
        p = site / name
        if not p.is_file():
            fail(f"{name} missing from the staged tree")
        text = read(p)
        text, stripped = EDGE_INJECTION.subn("", text)
        if stripped:
            write(p, text)
            print(f"[elysium] {name}: stripped {stripped} CDN-injected script(s)")
        if SPACE_TAG in text:
            continue
        if text.count("</head>") != 1:
            fail(f"{name}: expected exactly one </head> to inject the Space script")
        write(p, text.replace("</head>", f"  {SPACE_TAG}\n  </head>"))
    print("[elysium] space.js injected into index.html and chat.html")


def strip_html_comments(site: Path) -> None:
    """Drop <!-- --> comments outside inline scripts in the entry pages."""
    for name in ("index.html", "chat.html"):
        p = site / name
        parts = SCRIPT_BLOCK.split(read(p))
        # split() with one group alternates: text, script, text, script, ...
        out = [HTML_COMMENT.sub("", part) if i % 2 == 0 else part for i, part in enumerate(parts)]
        write(p, "".join(out))
    print("[elysium] html: comments stripped from index.html and chat.html")


def scan(site: Path) -> None:
    for rel, literal, why in LEAK_ALLOW:
        print(f"[elysium] allowed: {rel}: {literal!r} ({why})")
    allowed = {(rel, literal) for rel, literal, _ in LEAK_ALLOW}
    hits = []
    for p in sorted(site.rglob("*")):
        if p.suffix not in (".js", ".mjs", ".html", ".css", ".json"):
            continue
        rel = p.relative_to(site).as_posix()
        text = p.read_text(encoding="utf-8", errors="replace")
        for label, rx in LEAKS:
            for m in rx.finditer(text):
                if (rel, m.group(0)) not in allowed:
                    hits.append(f"{rel}: {label} {m.group(0)!r}")
    if hits:
        shown = "\n  ".join(sorted(set(hits))[:30])
        fail(f"{len(hits)} internal reference(s) in the public site:\n  {shown}")
    print(f"[elysium] leak scan clean ({len(LEAKS)} rule(s), {len(LEAK_ALLOW)} allowed)")


def local_refs(site: Path) -> list[tuple[Path, str]]:
    """Every local file the entry pages and stylesheets ask for."""
    refs: list[tuple[Path, str]] = []
    for name in ("index.html", "chat.html"):
        html = read(site / name)
        for u in re.findall(r"""(?:src|href)=["']([^"']+)["']""", html):
            refs.append((site, u))
    for css in site.rglob("*.css"):
        for u in re.findall(r"""url\(\s*["']?([^"')]+)["']?\s*\)""", read(css)):
            refs.append((css.parent, u))
    # The extensions the chat seeds at boot are loaded by URL, not by a tag.
    state = site / "js" / "04-state.js"
    if state.is_file():
        for u in re.findall(r"url:\s*'([^']+)'", read(state)):
            refs.append((site, u))
    return refs


def verify(site: Path) -> None:
    missing = []
    checked = 0
    for base, u in local_refs(site):
        if re.match(r"^(?:[a-z][a-z0-9+.-]*:|//|#)", u, re.I):
            continue
        path = u.split("#")[0].split("?")[0]
        if not path:
            continue
        target = (site / path.lstrip("/")) if path.startswith("/") else (base / path)
        checked += 1
        if not target.resolve().is_file():
            missing.append(u)
    if missing:
        shown = ", ".join(sorted(set(missing))[:10])
        fail(f"{len(missing)} local reference(s) do not resolve: {shown}")
    print(f"[elysium] verified {checked} local reference(s) resolve")

    left = []
    for p in site.rglob("*"):
        if p.suffix not in (".js", ".mjs", ".html", ".css"):
            continue
        for m in ORIGIN_ABS.finditer(read(p)):
            left.append(f"{p.relative_to(site).as_posix()}: /{m.group(2)}/")
    scripts = [p for d in (site, site / "js", site / "workers", site / "assets")
               for p in d.glob("*.js")]
    for p in scripts:
        for m in ROOT_ANCHORED.finditer(read(p)):
            left.append(f"{p.relative_to(site).as_posix()}: {m.group(0)}")
    if left:
        fail("root-anchored URLs remain: " + "; ".join(sorted(set(left))[:10]))
    print("[elysium] no root-anchored same-origin URLs remain")


def main() -> int:
    args = sys.argv[1:]
    mode = args[0] if args[:1] in (["--scan"], ["--strip-edge"], ["--strip-shaders"]) else ""
    if mode:
        args = args[1:]
    if len(args) != 1:
        print(__doc__, file=sys.stderr)
        return 2
    site = Path(args[0])
    if not (site / "index.html").is_file():
        fail(f"{site} has no index.html")
    if mode == "--scan":
        scan(site)
        return 0
    if mode == "--strip-edge":
        strip_edge(site)
        return 0
    if mode == "--strip-shaders":
        strip_shader_comments(site)
        return 0
    patch_adapter(site)
    patch_mediaforge(site)
    patch_hub(site)
    rename_storage_keys(site)
    patch_workers(site)
    patch_chat(site)
    patch_font(site)
    inject_space(site)
    strip_html_comments(site)
    verify(site)
    return 0


if __name__ == "__main__":
    sys.exit(main())
