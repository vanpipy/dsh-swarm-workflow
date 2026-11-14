"""Compare the quality of two trees with the same instrument.

The comparison is only fair when both arms are measured by the same code, so
this script copies `tools/quality_report.py` into the arm under test and runs
it there as a subprocess. Nothing is written into the arm: the copy is
temporary and removed afterwards.

Usage:
    python tools/quality_compare.py <other-root> [--json]

The default other arm is the control implementation produced without the
swarm workflow. The result is written to
`.swarm/reports/swarm-lab-quality-comparison.json` and
`.swarm/reports/swarm-lab-quality-comparison.md`.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INSTRUMENT = ROOT / "tools" / "quality_report.py"
REPORTS = ROOT / ".swarm" / "reports"
DEFAULT_CONTROL = pathlib.Path(r"D:\project\swarm-lab-control")

METRICS = (
    "package_modules",
    "public_functions",
    "annotation_coverage",
    "docstring_coverage",
    "module_docstring_coverage",
    "public_functions_without_tests_count",
    "avg_function_length",
    "max_function_length",
    "max_nesting_depth",
    "duplicate_line_ratio",
    "test_functions",
)

LOWER_IS_BETTER = {
    "public_functions_without_tests_count",
    "avg_function_length",
    "max_function_length",
    "max_nesting_depth",
    "duplicate_line_ratio",
}


def measure(root: pathlib.Path) -> dict:
    """Measure one tree with a copy of this repository's own instrument.

    The instrument derives the tree it measures from its own location
    (`ROOT = Path(__file__).parent.parent`), so the copy has to live inside
    the tree under test. The copy is removed again unless it was already there.
    """
    tools = root / "tools"
    tools.mkdir(parents=True, exist_ok=True)
    target = tools / "quality_report.py"
    existed = target.exists()
    if not existed:
        shutil.copy2(INSTRUMENT, target)
    try:
        completed = subprocess.run(
            [sys.executable, str(target), "--json"],
            cwd=root,
            capture_output=True,
            text=True,
        )
    finally:
        if not existed:
            target.unlink(missing_ok=True)
    if completed.returncode != 0:
        raise SystemExit(
            f"the instrument failed in {root}: exit {completed.returncode}\n{completed.stderr}"
        )
    return json.loads(completed.stdout)


def compare(after: dict, before: dict) -> dict:
    rows = []
    for metric in METRICS:
        low = before.get(metric)
        high = after.get(metric)
        if metric in LOWER_IS_BETTER:
            verdict = "better" if high < low else ("worse" if high > low else "same")
        else:
            verdict = "better" if high > low else ("worse" if high < low else "same")
        rows.append({"metric": metric, "control": low, "workflow": high, "verdict": verdict})
    return rows


def render(rows: list[dict], before_root: pathlib.Path, after_root: pathlib.Path) -> str:
    lines = [
        "# swarmlab quality comparison",
        "",
        "Two arms, one instrument:",
        "",
        f"- control (`{before_root}`): the same specification implemented in one pass, without the",
        "  swarm workflow — no requirement file, no separate Tester lane, no Reviewer lane, no",
        "  per-requirement checks, no `.swarm` documentation set.",
        f"- workflow (`{after_root}`): the same specification implemented through the swarm",
        "  workflow — a durable requirement set, a Developer lane, a Tester lane, a Reviewer lane",
        "  and the workspace documentation set.",
        "",
        "Both arms are measured by a copy of this repository's own `tools/quality_report.py`,",
        "run inside each tree, so the numbers come from the same code.",
        "",
        "| metric | control | workflow | verdict |",
        "| --- | --- | --- | --- |",
    ]
    for row in rows:
        lines.append(
            f"| {row['metric']} | {row['control']} | {row['workflow']} | {row['verdict']} |"
        )
    lines += [
        "",
        "A higher number is better for coverage and test counts; a lower number is better for",
        "length, nesting, duplication and untested public functions.",
    ]
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Compare two trees with the same instrument.")
    parser.add_argument("control", nargs="?", default=str(DEFAULT_CONTROL))
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    control_root = pathlib.Path(args.control)
    if not (control_root / "swarmlab").is_dir():
        raise SystemExit(f"no swarmlab package under {control_root}")

    before = measure(control_root)
    after = measure(ROOT)
    rows = compare(after, before)

    REPORTS.mkdir(parents=True, exist_ok=True)
    payload = {
        "instrument": "tools/quality_report.py",
        "control_root": str(control_root),
        "workflow_root": str(ROOT),
        "control": before,
        "workflow": after,
        "comparison": rows,
    }
    (REPORTS / "swarm-lab-quality-comparison.json").write_text(
        json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8"
    )
    (REPORTS / "swarm-lab-quality-comparison.md").write_text(
        render(rows, control_root, ROOT), encoding="utf-8"
    )
    if args.json:
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        print(render(rows, control_root, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
