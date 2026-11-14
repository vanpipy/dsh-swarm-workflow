"""Check that every code pointer in the two requirements files resolves.

A pointer of the form ``scripts/pick_daily.py:NN`` must name a line that
exists in the file it points at; a range ``file.py:NN-MM`` must lie inside it.
The script prints the referenced text so that a human can see whether the
pointer names what it claims.

Run:  C:\\Python312\\python.exe D:\\project\\.swarm-lab\\proof-scratch\\check_code_pointers.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(r"D:\project\.swarm-lab\head_tree2")
REQ = ROOT / ".swarm" / "requirements"
FILES = [REQ / "pick-daily-profile.md", REQ / "pick-daily-feed-verdict.md"]
POINTER = re.compile(
    r"(?<![\w/])((?:scripts|src|config|tests)/[\w./-]+\.(?:py|yaml)):(\d+)(?:-(\d+))?"
)


def main() -> int:
    bad = 0
    total = 0
    for req in FILES:
        text = req.read_text(encoding="utf-8")
        for m in POINTER.finditer(text):
            total += 1
            rel, start_s, end_s = m.groups()
            start = int(start_s)
            end = int(end_s) if end_s else start
            target = ROOT / rel
            if not target.exists():
                print(f"MISSING {req.name}: {m.group(0)} -> {rel} does not exist")
                bad += 1
                continue
            body = target.read_text(encoding="utf-8").splitlines()
            if start < 1 or end > len(body) or start > end:
                print(f"OUT OF RANGE {req.name}: {m.group(0)} -> {rel} has {len(body)} lines")
                bad += 1
                continue
            snippet = " / ".join(b.strip() for b in body[start - 1 : end][:3])
            print(f"OK  {req.name}: {m.group(0):45s} -> {snippet[:110]}")
    print(f"code pointers checked: {total} | broken: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
