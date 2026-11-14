"""Probe: is the round-10 assertion vacuous, and does the R10b fix close it?

Runs the picker on a malformed profile and evaluates the two styles of
assertion on the same captured output:

  old style (round 10):  ``"daily_limit" in out``
  new style (round 10b): ``"daily_limit" in message``, where the message is
                         the refusal line with the profile's path removed

The profile is written into a directory whose name is the name pytest
gives ``tmp_path`` for this very test, so the path carries the key.
"""

from __future__ import annotations

import io
import os
import re
import sys
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(r"D:\project\.swarm-lab\proof-scratch\ht2-r10c")
PROD = ROOT / "scripts" / "pick_daily.py"
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

M1_OLD = 'raise ProfileError(f"daily_limit must be a positive integer, got {value!r}")'
M1_NEW = 'raise ProfileError(f"the daily number must be a positive integer, got {value!r}")'

# The mutation must be in the file BEFORE the module is imported, so it is
# applied first and restored at the end.
_mutated = "--mutated" in sys.argv
_original = PROD.read_text(encoding="utf-8")
if _mutated:
    assert _original.count(M1_OLD) == 1
    PROD.write_text(_original.replace(M1_OLD, M1_NEW, 1), encoding="utf-8")

import scripts.pick_daily as pick_daily  # noqa: E402


def run_once(base: Path) -> tuple[str, str]:
    """Run the picker on a malformed profile; return (output, profile path)."""
    tmp = base / "pytest-268" / "test_a_malformed_daily_limit_is_refused_zero0"
    tmp.mkdir(parents=True, exist_ok=True)
    taste = (ROOT / "config" / "taste.yaml").read_text(encoding="utf-8")
    taste, n = re.subn(
        r"^daily_limit: .*$", "daily_limit: 0", taste, count=1, flags=re.MULTILINE
    )
    assert n == 1, "no daily_limit line in the profile"
    profile = tmp / "taste.yaml"
    profile.write_text(taste, encoding="utf-8")
    feeds = ROOT / "config" / "feeds.yaml"
    pick_daily.PICKED_DIR = tmp / "picked"
    buffer = io.StringIO()
    with redirect_stdout(buffer):
        code = pick_daily.main(
            [
                "--date",
                "2026-11-04",
                "--taste",
                str(profile),
                "--feeds",
                str(feeds),
                "--apply",
            ]
        )
    out = buffer.getvalue()
    print(f"  exit code: {code}")
    print(f"  captured output: {out!r}")
    print(f"  profile path: {profile}")
    lines = [
        line
        for line in out.splitlines()
        if line.startswith("[pick_daily] taste profile")
    ]
    if len(lines) == 1:
        rest = lines[0].split(str(profile), 1)[1].strip()
        message = rest[1:].strip() if rest.startswith(":") else ""
    else:
        message = ""
    print(f"  message (path removed): {message!r}")
    print(f"  OLD style  'daily_limit' in out      -> {'daily_limit' in out}")
    print(f"  NEW style  'daily_limit' in message  -> {'daily_limit' in message}")
    return out, message


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    base = Path(r"D:\project\.swarm-lab\proof-scratch\probe-vacuity")
    try:
        if _mutated:
            print("=== with M1 applied (the message loses 'daily_limit') ===")
        else:
            print("=== pristine production code ===")
        run_once(base)
    finally:
        PROD.write_text(_original, encoding="utf-8")
        print(f"=== production file restored: {PROD.read_text(encoding='utf-8') == _original} ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
