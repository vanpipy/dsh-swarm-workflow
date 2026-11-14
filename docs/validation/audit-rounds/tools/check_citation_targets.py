"""Do the citations name the requirement the test claims to cover?

For every citation in the two clause test files: the heading of the
requirement block the citation points at, and the requirement the
surrounding test text claims to cover (by its letter; the letters run A,
B, C ... in the order the requirement file lists them).  A citation that
points at a *different* requirement is worse than a stale one.
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
CLAIM = re.compile(r"[Rr]equirement\s+([A-Z])\b")
HEADING = re.compile(r"^###\s+(.+?)\s*$")
LETTERS = "ABCDEFGH"


def blocks(path: Path) -> list[tuple[int, int, str]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    heads = [(i + 1, t) for i, t in enumerate(lines) if t.startswith("### ")]
    out = []
    for idx, (start, heading) in enumerate(heads):
        end = heads[idx + 1][0] - 1 if idx + 1 < len(heads) else len(lines)
        title = HEADING.match(heading)
        out.append((start, end, title.group(1) if title else heading))
    return out


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    req_files = {
        "pick-daily-profile.md": REQ / "pick-daily-profile.md",
        "pick-daily-feed-verdict.md": REQ / "pick-daily-feed-verdict.md",
    }
    block_map = {name: blocks(path) for name, path in req_files.items()}
    letter_map = {
        name: {LETTERS[i]: b[2] for i, b in enumerate(bs)}
        for name, bs in block_map.items()
    }
    mismatch = 0
    total = 0
    for test in TESTS:
        lines = test.read_text(encoding="utf-8").splitlines()
        for lineno, line in enumerate(lines, start=1):
            claims = CLAIM.findall(line)
            letter = claims[-1] if claims else None
            if letter is None:
                for back in range(lineno - 1, max(0, lineno - 40), -1):
                    found = CLAIM.findall(lines[back - 1])
                    if found:
                        letter = found[-1]
                        break
            for match in CITATION.finditer(line):
                total += 1
                fname, start_s, end_s = match.groups()
                start = int(start_s)
                owner = [b for b in block_map[fname] if b[0] <= start <= b[1]]
                heading = owner[0][2] if owner else "<no block>"
                expected = letter_map[fname].get(letter or "", "<no claim>")
                ok = heading == expected
                if not ok:
                    mismatch += 1
                print(
                    f"{'OK  ' if ok else 'DIFF'} {test.name}:{lineno} "
                    f"{match.group(0):<38} points at {heading!r} | "
                    f"claims requirement {letter} = {expected!r}"
                )
    print(f"citations: {total} | mismatched: {mismatch}")
    return 1 if mismatch else 0


if __name__ == "__main__":
    raise SystemExit(main())
