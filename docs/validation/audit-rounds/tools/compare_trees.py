"""Compare the scratch copy with the worktree, file by file (hash)."""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

WORK = Path(r"D:\project\.swarm-lab\head_tree2")
COPY = Path(r"D:\project\.swarm-lab\proof-scratch\ht2-r10c")


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def tree(root: Path) -> dict[str, Path]:
    out: dict[str, Path] = {}
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if rel == ".git" or rel.startswith(".git/"):
            continue
        out[rel] = path
    return out


def main() -> int:
    a = tree(WORK)
    b = tree(COPY)
    only_work = sorted(set(a) - set(b))
    only_copy = sorted(set(b) - set(a))
    differing = sorted(
        rel for rel in set(a) & set(b) if digest(a[rel]) != digest(b[rel])
    )
    print(f"files in worktree (minus .git): {len(a)}")
    print(f"files in scratch copy: {len(b)}")
    print(f"only in worktree: {only_work}")
    print(f"only in scratch copy: {only_copy}")
    print(f"differing content: {differing}")
    return 1 if (only_work or only_copy or differing) else 0


if __name__ == "__main__":
    raise SystemExit(main())
