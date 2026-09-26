#!/usr/bin/env python3
"""Pin the fetched hub to exact bytes.

Usage:
  python3 space/lock.py verify LOCK SITE_DIR   exit 1 on any missing, extra or changed file
  python3 space/lock.py write  LOCK SITE_DIR   rewrite LOCK from SITE_DIR and print the diff

The build downloads the hub from its published origin. Without a lock, whatever
that origin serves on the day of a release is what every Space deploys. `verify`
makes the build accept only the exact file set and bytes recorded in the lock,
which lives in this repository and changes only in a reviewed commit. `write` is
the deliberate refresh (`build.sh --update-lock`); the release workflow never runs it.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


def digest(path: Path) -> dict[str, object]:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return {"size": path.stat().st_size, "sha256": h.hexdigest()}


def measure(site: Path) -> dict[str, dict[str, object]]:
    return {
        p.relative_to(site).as_posix(): digest(p)
        for p in sorted(site.rglob("*"))
        if p.is_file()
    }


def load(lock: Path) -> dict[str, dict[str, object]]:
    try:
        data = json.loads(lock.read_text(encoding="utf-8"))
        files = data["files"]
    except (OSError, ValueError, KeyError, TypeError) as e:
        print(f"[lock] cannot read {lock}: {e}", file=sys.stderr)
        sys.exit(2)
    if not isinstance(files, dict) or not files:
        print(f"[lock] {lock} lists no files", file=sys.stderr)
        sys.exit(2)
    return files


def diff(old: dict, new: dict) -> list[str]:
    lines = []
    for path in sorted(set(old) | set(new)):
        if path not in new:
            lines.append(f"  removed  {path}")
        elif path not in old:
            lines.append(f"  added    {path} ({new[path]['size']} B)")
        elif old[path] != new[path]:
            lines.append(
                f"  changed  {path} ({old[path]['size']} B -> {new[path]['size']} B)"
            )
    return lines


def main() -> int:
    if len(sys.argv) != 4 or sys.argv[1] not in ("verify", "write"):
        print(__doc__, file=sys.stderr)
        return 2
    mode, lock, site = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    if not site.is_dir():
        print(f"[lock] {site} is not a directory", file=sys.stderr)
        return 2
    actual = measure(site)

    if mode == "write":
        old = load(lock) if lock.is_file() else {}
        lock.write_text(
            json.dumps({"files": actual}, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
            newline="\n",
        )
        changes = diff(old, actual)
        print(f"[lock] wrote {lock.name}: {len(actual)} file(s), {len(changes)} change(s)")
        for line in changes:
            print(line)
        return 0

    expected = load(lock)
    problems = diff(expected, actual)
    if problems:
        print(
            f"[lock] FAIL: the fetched hub does not match {lock.name} "
            f"({len(problems)} difference(s)); review, then run build.sh --update-lock",
            file=sys.stderr,
        )
        for line in problems[:40]:
            print(line, file=sys.stderr)
        return 1
    print(f"[lock] verified {len(actual)} file(s) against {lock.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
