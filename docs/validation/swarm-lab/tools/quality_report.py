"""Quality report for the swarmlab package.

Standard library only, so it runs on the host's bundled Python without an
install step. The numbers are measurements, not scores: they exist so a
before/after comparison is possible when the workflow changes the code.

Usage:
    python tools/quality_report.py            # human readable
    python tools/quality_report.py --json     # machine readable
"""
from __future__ import annotations

import argparse
import ast
import json
import pathlib
import sys
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKAGE = ROOT / "swarmlab"
TESTS = ROOT / "tests"

TRIVIAL_LINES = {
    "pass",
    "return",
    "break",
    "continue",
    "raise",
    "else:",
    "try:",
    "finally:",
    ")",
    "}",
    "]",
    "",
}

CONTROL_NODES = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.With, ast.AsyncWith, ast.Try)


def python_files(directory: pathlib.Path) -> list[pathlib.Path]:
    if not directory.is_dir():
        return []
    return sorted(p for p in directory.rglob("*.py") if "__pycache__" not in p.parts)


def public_functions(tree: ast.AST) -> list[ast.FunctionDef | ast.AsyncFunctionDef]:
    found: list[ast.FunctionDef | ast.AsyncFunctionDef] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
            found.append(node)
    return found


def is_annotated(node: ast.FunctionDef | ast.AsyncFunctionDef) -> bool:
    args = node.args
    parameters = list(args.posonlyargs) + list(args.args) + list(args.kwonlyargs)
    for index, argument in enumerate(parameters):
        if index == 0 and argument.arg in {"self", "cls"}:
            continue
        if argument.annotation is None:
            return False
    if args.vararg is not None and args.vararg.annotation is None:
        return False
    if args.kwarg is not None and args.kwarg.annotation is None:
        return False
    return node.returns is not None


def nesting_depth(node: ast.AST) -> int:
    """Maximum depth of nested control statements inside a function body."""
    deepest = 0
    for child in ast.walk(node):
        if isinstance(child, CONTROL_NODES):
            depth = 1
            for inner in ast.walk(child):
                if inner is child:
                    continue
                if isinstance(inner, CONTROL_NODES):
                    depth += 1
            deepest = max(deepest, depth)
    return deepest


def function_length(node: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
    start = node.lineno
    end = getattr(node, "end_lineno", start) or start
    return end - start + 1


def test_inventory() -> tuple[set[str], int]:
    """The test suite's unique test-function names and its number of test cases.

    `test_functions` counts the distinct names; `test_cases` counts every
    `FunctionDef` occurrence, which is the number unittest runs. The two
    differ because several test classes reuse the same method name.
    """
    names: set[str] = set()
    cases = 0
    for path in python_files(TESTS):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test"):
                names.add(node.name)
                cases += 1
    return names, cases


def called_names() -> set[str]:
    """The names the test suite actually calls.

    A public function counts as tested only when a test calls it. Both the
    direct form (`normalize_ws(...)`) and the package form
    (`swarmlab.text.normalize_ws(...)`) count, so a comment that merely
    names a function cannot make it look tested.
    """
    names: set[str] = set()
    for path in python_files(TESTS):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            func = node.func
            if isinstance(func, ast.Name):
                names.add(func.id)
            elif isinstance(func, ast.Attribute):
                names.add(func.attr)
    return names


def duplicate_line_ratio(paths: list[pathlib.Path]) -> float:
    seen: set[str] = set()
    total = 0
    duplicates = 0
    for path in paths:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or line in TRIVIAL_LINES:
                continue
            total += 1
            if line in seen:
                duplicates += 1
            else:
                seen.add(line)
    if total == 0:
        return 0.0
    return round(duplicates / total, 4)


def measure() -> dict[str, Any]:
    package_files = python_files(PACKAGE)
    public: list[ast.FunctionDef | ast.AsyncFunctionDef] = []
    module_docstrings = 0
    annotated = 0
    documented = 0
    lengths: list[int] = []
    nesting = 0

    for path in package_files:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        if ast.get_docstring(tree):
            module_docstrings += 1
        for node in public_functions(tree):
            public.append(node)
            annotated += 1 if is_annotated(node) else 0
            documented += 1 if ast.get_docstring(node) else 0
            lengths.append(function_length(node))
            nesting = max(nesting, nesting_depth(node))

    names = {node.name for node in public}
    tested = names & called_names()
    tests, test_cases = test_inventory()

    total = len(public)
    return {
        "package_modules": len(package_files),
        "public_functions": total,
        "annotation_coverage": round(annotated / total, 4) if total else 0.0,
        "docstring_coverage": round(documented / total, 4) if total else 0.0,
        "module_docstring_coverage": round(module_docstrings / len(package_files), 4) if package_files else 0.0,
        "public_functions_without_tests": sorted(names - tested),
        "public_functions_without_tests_count": len(names - tested),
        "avg_function_length": round(sum(lengths) / total, 2) if total else 0.0,
        "max_function_length": max(lengths) if lengths else 0,
        "max_nesting_depth": nesting,
        "duplicate_line_ratio": duplicate_line_ratio(package_files),
        "test_functions": len(tests),
        "test_cases": test_cases,
        "public_function_names": sorted(names),
    }


def render(report: dict[str, Any]) -> str:
    lines = [
        "swarmlab quality report",
        f"  package modules            : {report['package_modules']}",
        f"  public functions           : {report['public_functions']}",
        f"  annotation coverage        : {report['annotation_coverage']}",
        f"  docstring coverage         : {report['docstring_coverage']}",
        f"  module docstring coverage  : {report['module_docstring_coverage']}",
        f"  public functions w/o tests : {report['public_functions_without_tests_count']} {report['public_functions_without_tests']}",
        f"  avg function length        : {report['avg_function_length']}",
        f"  max function length        : {report['max_function_length']}",
        f"  max nesting depth          : {report['max_nesting_depth']}",
        f"  duplicate line ratio       : {report['duplicate_line_ratio']}",
        f"  test functions             : {report['test_functions']}",
        f"  test cases                 : {report['test_cases']}",
    ]
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Measure the quality of the swarmlab package.")
    parser.add_argument("--json", action="store_true", help="print the report as JSON")
    args = parser.parse_args(argv)
    report = measure()
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(render(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
