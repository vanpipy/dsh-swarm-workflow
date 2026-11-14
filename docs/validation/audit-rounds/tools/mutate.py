"""Mutation driver for the R10c re-review.

Applies one mutation to a file in the scratch copy of the worktree, runs
the clause test files plus the existing suite, prints the result, and
restores the file.  The worktree itself is never touched.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(r"D:\project\.swarm-lab\proof-scratch\ht2-r10c")
PY = r"C:\Python312\python.exe"
SITE = r"D:\project\.venv-win\Lib\site-packages"
CLAUSE = [
    "tests/scripts/test_pick_daily_profile.py",
    "tests/scripts/test_pick_daily_feed_verdict.py",
]
EXISTING = "tests/scripts/test_pick_daily.py"

PROD = "scripts/pick_daily.py"
EXIST = "tests/scripts/test_pick_daily.py"

BROKEN_BLOCK = '''        print(
            "[pick_daily] the feed could not be fetched \u2014 a broken source: "
            f"{len(failures)} of {total} feed URL(s) failed:"
        )
'''
QUIET_BLOCK = '''        print(
            "[pick_daily] the feed was fetched and is empty \u2014 it held no"
            " entries, so the day is quiet and there is nothing to pick"
        )
'''
WARN_BLOCK = '''    if failures:
        # The feed yielded entries although some of its URLs failed: a
        # warning, not a broken source -- the same verdict the collector
        # takes for a source that lost one of its feed URLs.
        total = health.urls if health is not None else len(failures)
        print(
            f"[pick_daily] WARNING {len(failures)} of {total} feed URL(s) failed: "
            + "; ".join(failures)
        )
'''

MUTATIONS: dict[str, dict] = {
    "M1": {
        "file": PROD,
        "note": "the refusal message loses the literal 'daily_limit'",
        "old": 'raise ProfileError(f"daily_limit must be a positive integer, got {value!r}")',
        "new": 'raise ProfileError(f"the daily number must be a positive integer, got {value!r}")',
        "sel": CLAUSE,
    },
    "M8": {
        "file": PROD,
        "note": "the collector-health broken-source summary line is swapped for the quiet-feed wording; the per-failure lines and the exit code 1 stay",
        "old": BROKEN_BLOCK,
        "new": QUIET_BLOCK,
        "sel": CLAUSE,
    },
    "C1": {
        "file": PROD,
        "note": "the collector-health broken-source branch exits 0 instead of 1 (a broken feed that is not a failure)",
        "old": '''        for failure in failures:
            print(f"  {failure}")
        return 1
''',
        "new": '''        for failure in failures:
            print(f"  {failure}")
        return 0
''',
        "sel": CLAUSE,
    },
    "C2": {
        "file": PROD,
        "note": "the collector-health broken-source branch stops naming the reason (the per-failure lines are dropped)",
        "old": '''        for failure in failures:
            print(f"  {failure}")
        return 1
''',
        "new": '''        return 1
''',
        "sel": CLAUSE,
    },
    "D1": {
        "file": PROD,
        "note": "the partly-broken warning drops the count of failed URLs",
        "old": 'f"[pick_daily] WARNING {len(failures)} of {total} feed URL(s) failed: "',
        "new": 'f"[pick_daily] WARNING {len(failures)} feed URL(s) failed: "',
        "sel": CLAUSE,
    },
    "D2": {
        "file": PROD,
        "note": "the partly-broken warning is removed entirely",
        "old": WARN_BLOCK,
        "new": '''    if failures:
        # MUTANT D2: the warning is gone.
        pass
''',
        "sel": CLAUSE,
    },
    "D3": {
        "file": PROD,
        "note": "a partly broken feed is treated as a broken source: warning, then exit 1 and no day file",
        "old": WARN_BLOCK,
        "new": WARN_BLOCK + "        return 1\n",
        "sel": CLAUSE,
    },
    "D4": {
        "file": PROD,
        "note": "the partly-broken warning names the failed URL but drops the reason",
        "old": '+ "; ".join(failures)',
        "new": '+ "; ".join(f.split(":")[0] for f in failures)',
        "sel": CLAUSE,
    },
    "D5": {
        "file": PROD,
        "note": "the partly-broken warning keeps the failed URL but drops the reason",
        "old": '+ "; ".join(failures)',
        "new": '+ "; ".join(f.rsplit(": request failed:", 1)[0] for f in failures)',
        "sel": CLAUSE,
    },
    "G1a": {
        "file": EXIST,
        "note": "probe of the mark scan: one of the SIX NAMED existing tests gains a skip mark",
        "old": "    def test_existing_file_is_not_overwritten(",
        "new": '    @pytest.mark.skip(reason="probe")\n    def test_existing_file_is_not_overwritten(',
        "sel": CLAUSE,
    },
    "G1b": {
        "file": EXIST,
        "note": "probe of the mark scan: an existing test that is NOT one of the six named gains a skip mark",
        "old": "    def test_the_shipped_list_has_no_duplicate_ids(self) -> None:",
        "new": '    @pytest.mark.skip(reason="probe")\n    def test_the_shipped_list_has_no_duplicate_ids(self) -> None:',
        "sel": CLAUSE,
    },
    "G2": {
        "file": EXIST,
        "note": "probe of the runtime scan: the existing suite gains a runtime pytest.skip in a callable helper",
        "old": "class TestShippedDayFiles:",
        "new": '''def _probe_runtime_skip() -> None:
    pytest.skip("probe: a runtime skip in the existing suite")


class TestShippedDayFiles:''',
        "sel": CLAUSE,
    },
    "G3": {
        "file": EXIST,
        "note": "probe of the runtime scan: the existing suite gains a runtime pytest.importorskip",
        "old": "class TestShippedDayFiles:",
        "new": '''def _probe_importorskip() -> None:
    pytest.importorskip("module_that_does_not_exist_xyz")


class TestShippedDayFiles:''',
        "sel": CLAUSE,
    },
    "G4": {
        "file": EXIST,
        "note": "probe of the runtime scan: the existing suite gains a runtime skip through an aliased import",
        "old": "class TestShippedDayFiles:",
        "new": '''from pytest import skip as _skip_alias


def _probe_aliased_skip() -> None:
    _skip_alias("probe: an aliased runtime skip")


class TestShippedDayFiles:''',
        "sel": CLAUSE,
    },
}


def run(sel: list[str]) -> tuple[int, str]:
    env = dict(os.environ)
    env["PYTHONPATH"] = str(ROOT / "src") + os.pathsep + SITE
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    cmd = [
        PY,
        "-m",
        "pytest",
        "-q",
        "-p",
        "no:cacheprovider",
        "--tb=line",
        "-rf",
        *sel,
        EXIST,
    ]
    proc = subprocess.run(
        cmd,
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    out = proc.stdout + proc.stderr
    return proc.returncode, out


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # pragma: no cover
        pass
    name = sys.argv[1]
    spec = MUTATIONS[name]
    path = ROOT / spec["file"]
    original = path.read_text(encoding="utf-8")
    count = original.count(spec["old"])
    if count != 1:
        print(f"!! {name}: anchor found {count} times, refusing to mutate")
        return 2
    mutated = original.replace(spec["old"], spec["new"], 1)
    path.write_text(mutated, encoding="utf-8")
    try:
        code, out = run(spec["sel"])
    finally:
        path.write_text(original, encoding="utf-8")
        restored = path.read_text(encoding="utf-8") == original
    print(f"=== MUTATION {name} ===")
    print(f"file: {spec['file']}")
    print(f"what: {spec['note']}")
    print(
        "cmd: C:\\Python312\\python.exe -m pytest -q -p no:cacheprovider --tb=line -rf "
        + " ".join(spec["sel"])
        + " "
        + EXIST
    )
    print(f"exit: {code}")
    print("--- output ---")
    print(out)
    print(f"--- file restored: {restored} ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
