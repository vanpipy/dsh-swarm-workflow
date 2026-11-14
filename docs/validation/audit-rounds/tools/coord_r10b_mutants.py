"""The Coordinator's own proof of the R10b remediation.

Two mutants, the two that survived round 10:

  A - scripts/pick_daily.py:200 drops the literal ``daily_limit`` from the
      refusal message. Before the remediation this mutant passed every
      profile-clause test (the key leaked in through pytest's tmp_path).
  B - scripts/pick_daily.py:626-629 replaces the broken-feed summary line
      with the quiet-feed wording. Before the remediation this mutant passed
      every feed-clause test.

The scratch copy is made OUTSIDE the worktree and WITHOUT the .git entry: in
this worktree .git is a FILE pointing at the parent repository's worktree
metadata, and copying it would make git commands operate on the real worktree.

Run: C:\\Python312\\python.exe D:\\project\\.swarm-lab\\proof-scratch\\coord_r10b_mutants.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

WORKTREE = Path(r"D:\project\.swarm-lab\head_tree2")
SCRATCH = Path(r"D:\project\.swarm-lab\proof-scratch\coord-r10b")
PYTHON = r"C:\Python312\python.exe"

MUTANT_A_OLD = 'raise ProfileError(f"daily_limit must be a positive integer, got {value!r}")'
MUTANT_A_NEW = 'raise ProfileError(f"the number must be a positive integer, got {value!r}")'

MUTANT_B_OLD = """        print(
            "[pick_daily] the feed could not be fetched — a broken source: "
            f"{len(failures)} of {total} feed URL(s) failed:"
        )"""
MUTANT_B_NEW = """        print(
            "[pick_daily] the feed was fetched and is empty - it held no entries, "
            f"so the day is quiet and there is nothing to pick"
        )"""


def copy_tree(dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(
        WORKTREE,
        dst,
        ignore=shutil.ignore_patterns(".git", ".pytest_cache", "__pycache__", "*.pyc", ".ruff_cache", "site", "nav.yml"),
    )


def run_pytest(root: Path, files: list[str]) -> tuple[int, str]:
    env = {
        "PATH": r"C:\Program Files\Git\cmd;" + __import__("os").environ.get("PATH", ""),
        "PYTHONPATH": str(WORKTREE / "src") + r";D:\project\.venv-win\Lib\site-packages",
        "PYTHONDONTWRITEBYTECODE": "1",
        "SystemRoot": r"C:\Windows",
        "TEMP": r"C:\Users\leroy\AppData\Local\Temp",
        "TMP": r"C:\Users\leroy\AppData\Local\Temp",
    }
    proc = subprocess.run(
        [PYTHON, "-m", "pytest", "-q", "-p", "no:cacheprovider", *files],
        cwd=root,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    tail = "\n".join(proc.stdout.strip().splitlines()[-6:])
    return proc.returncode, tail


def mutate(root: Path, old: str, new: str) -> None:
    target = root / "scripts" / "pick_daily.py"
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"mutation site not found in {target}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8", newline="")


PROFILE = ["tests/scripts/test_pick_daily_profile.py"]
FEED = ["tests/scripts/test_pick_daily_feed_verdict.py"]


def main() -> int:
    failures = 0

    print("== control: the scratch copy with the unmutated code")
    copy_tree(SCRATCH)
    code, tail = run_pytest(SCRATCH, PROFILE + FEED)
    print(f"   exit={code} :: {tail.splitlines()[-1] if tail else ''}")
    if code != 0:
        print("   CONTROL FAILED - the scratch copy does not pass")
        failures += 1

    print("== mutant A: the refusal message drops the literal daily_limit")
    copy_tree(SCRATCH)
    mutate(SCRATCH, MUTANT_A_OLD, MUTANT_A_NEW)
    code, tail = run_pytest(SCRATCH, PROFILE)
    print(f"   exit={code}")
    for line in tail.splitlines():
        print("   " + line)
    if code == 0:
        print("   MUTANT A SURVIVED - the clause is still not decided")
        failures += 1
    else:
        print("   MUTANT A KILLED")

    print("== mutant B: the broken-feed summary line takes the quiet wording")
    copy_tree(SCRATCH)
    mutate(SCRATCH, MUTANT_B_OLD, MUTANT_B_NEW)
    code, tail = run_pytest(SCRATCH, FEED)
    print(f"   exit={code}")
    for line in tail.splitlines():
        print("   " + line)
    if code == 0:
        print("   MUTANT B SURVIVED - the clause is still not decided")
        failures += 1
    else:
        print("   MUTANT B KILLED")

    print(f"RESULT: {'ALL PROOFS HOLD' if failures == 0 else str(failures) + ' PROBLEM(S)'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
