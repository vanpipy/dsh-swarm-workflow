"""Check that every requirement citation in the two clause files resolves.

A citation of the form ``<file>.md:NN`` must point at a requirement HEADING
line ("### ..."), because that is how a lane names the requirement it covers.
A citation of the form ``<file>.md:NN-MM`` must start at a heading line and
end inside that requirement's own block.

Run:  C:\\Python312\\python.exe D:\\project\\.swarm-lab\\proof-scratch\\check_citations.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(r"D:\project\.swarm-lab\head_tree2")
REQ = ROOT / ".swarm" / "requirements"
TESTS = [
    ROOT / "tests" / "scripts" / "test_pick_daily_profile.py",
    ROOT / "tests" / "scripts" / "test_pick_daily_feed_verdict.py",
]
CITATION = re.compile(r"(pick-daily-(?:profile|feed-verdict)\.md):(\d+)(?:-(\d+))?")


def blocks(path: Path) -> list[tuple[int, int, str]]:
    """(heading_line, end_line, heading) for every requirement block."""
    lines = path.read_text(encoding="utf-8").splitlines()
    heads = [
        (i + 1, text)
        for i, text in enumerate(lines)
        if text.startswith("### ")
    ]
    out = []
    for idx, (start, heading) in enumerate(heads):
        end = heads[idx + 1][0] - 1 if idx + 1 < len(heads) else len(lines)
        out.append((start, end, heading))
    return out


def main() -> int:
    req_files = {
        "pick-daily-profile.md": REQ / "pick-daily-profile.md",
        "pick-daily-feed-verdict.md": REQ / "pick-daily-feed-verdict.md",
    }
    block_map = {name: blocks(path) for name, path in req_files.items()}
    text_map = {
        name: path.read_text(encoding="utf-8").splitlines()
        for name, path in req_files.items()
    }

    total = 0
    bad = 0
    for test in TESTS:
        lines = test.read_text(encoding="utf-8").splitlines()
        for lineno, line in enumerate(lines, start=1):
            for match in CITATION.finditer(line):
                total += 1
                fname, start_s, end_s = match.groups()
                start = int(start_s)
                end = int(end_s) if end_s else None
                blocks_ = block_map[fname]
                body = text_map[fname]
                heading_lines = {b[0] for b in blocks_}
                if end is None:
                    ok = start in heading_lines
                    detail = body[start - 1].strip() if start <= len(body) else "<past EOF>"
                else:
                    owner = [b for b in blocks_ if b[0] <= start <= b[1]]
                    ok = bool(owner) and owner[0][0] == start and end <= owner[0][1]
                    detail = f"block {owner[0][2] if owner else '<none>'}"
                if not ok:
                    bad += 1
                    print(
                        f"STALE {test.name}:{lineno}: {match.group(0)} -> {detail[:90]}"
                    )
    print(f"citations checked: {total} | stale: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
