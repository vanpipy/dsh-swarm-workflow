"""The hidden case set for craft-lab.

This file lives OUTSIDE the craft-lab repository on purpose: neither
implementation arm may read it while it works. The Coordinator runs it
against both packages after both are finished and reports the per-case
result for each arm.

Usage:
    python cases.py <repo-root> [<repo-root> ...]

Each argument is the root of an arm: the directory that holds the `textnorm`
package. The runner prints one line per case per arm and a summary per arm.
"""

from __future__ import annotations

import importlib
import io
import json
import os
import subprocess
import sys
import contextlib

FIXTURE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixture.txt")


def _load(root: str):
    sys.path.insert(0, root)
    for name in list(sys.modules):
        if name == "textnorm" or name.startswith("textnorm."):
            del sys.modules[name]
    module = importlib.import_module("textnorm")
    sys.path.pop(0)
    return module


def case_empty_normalizes_to_empty(mod):
    return mod.normalize("") == ""


def case_whitespace_collapses(mod):
    return mod.normalize("  a \t b  ") == "a b"


def case_smart_quotes_and_dashes(mod):
    return mod.normalize("\u201csmart\u201d \u2013 dash") == '"smart" - dash'


def case_single_quotes(mod):
    return mod.normalize("\u2018x\u2019") == "'x'"


def case_non_breaking_space(mod):
    return mod.normalize("a\u00a0b") == "a b"


def case_newlines_collapse(mod):
    return mod.normalize("line1\r\nline2") == "line1 line2"


def case_stats_keys(mod):
    return set(mod.stats("").keys()) == {"chars", "words", "lines"}


def case_stats_empty(mod):
    return mod.stats("") == {"chars": 0, "words": 0, "lines": 0}


def case_stats_blank_has_one_line(mod):
    return mod.stats("   ") == {"chars": 0, "words": 0, "lines": 1}


def case_stats_trailing_newline_is_one_line(mod):
    return mod.stats("a\n") == {"chars": 1, "words": 1, "lines": 1}


def case_stats_two_lines(mod):
    return mod.stats("a\nb\n") == {"chars": 3, "words": 2, "lines": 2}


def case_stats_crlf_lines(mod):
    return mod.stats("a\r\nb") == {"chars": 3, "words": 2, "lines": 2}


def case_stats_two_words(mod):
    return mod.stats("one two") == {"chars": 7, "words": 2, "lines": 1}


def case_stats_nbsp(mod):
    return mod.stats("a\u00a0b") == {"chars": 3, "words": 2, "lines": 1}


def case_cli_missing_file(root, mod):
    proc = subprocess.run(
        [sys.executable, "-m", "textnorm", "does-not-exist.txt"],
        cwd=root, capture_output=True, text=True,
    )
    return (
        proc.returncode == 2
        and proc.stdout == ""
        and proc.stderr == "textnorm: no such file: does-not-exist.txt\n"
    )


def case_cli_prints_three_lines(root, mod):
    # The specification says "prints three lines"; it does not fix the line
    # terminator, so either LF or CRLF satisfies it. The raw terminator is
    # recorded separately by the Coordinator, because the difference between
    # the arms is a finding, not a score.
    with open(FIXTURE, "w", encoding="utf-8") as handle:
        handle.write("one two\nthree\n")
    proc = subprocess.run(
        [sys.executable, "-m", "textnorm", FIXTURE],
        cwd=root, capture_output=True, text=True,
    )
    os.remove(FIXTURE)
    return (
        proc.returncode == 0
        and proc.stdout.replace("\r\n", "\n") == "chars: 13\nwords: 3\nlines: 2\n"
    )


def cli_terminator(root):
    """The raw bytes the CLI writes for the same fixture, for the report."""
    with open(FIXTURE, "w", encoding="utf-8") as handle:
        handle.write("one two\nthree\n")
    proc = subprocess.run(
        [sys.executable, "-m", "textnorm", FIXTURE],
        cwd=root, capture_output=True,
    )
    os.remove(FIXTURE)
    return proc.stdout


CASES = [
    ("normalize: empty text", case_empty_normalizes_to_empty),
    ("normalize: whitespace collapses", case_whitespace_collapses),
    ("normalize: smart quotes and dashes", case_smart_quotes_and_dashes),
    ("normalize: single smart quotes", case_single_quotes),
    ("normalize: non-breaking space", case_non_breaking_space),
    ("normalize: newlines collapse", case_newlines_collapse),
    ("stats: exactly three keys", case_stats_keys),
    ("stats: empty text", case_stats_empty),
    ("stats: blank text still has one line", case_stats_blank_has_one_line),
    ("stats: trailing newline is one line", case_stats_trailing_newline_is_one_line),
    ("stats: two lines", case_stats_two_lines),
    ("stats: CRLF lines", case_stats_crlf_lines),
    ("stats: two words", case_stats_two_words),
    ("stats: non-breaking space", case_stats_nbsp),
    ("cli: missing file exits 2 with the exact message", case_cli_missing_file),
    ("cli: prints the three documented lines", case_cli_prints_three_lines),
]


def run_arm(root: str) -> tuple[int, int, list[str]]:
    passed = 0
    failed = []
    for name, fn in CASES:
        try:
            if fn.__code__.co_argcount == 2:
                ok = bool(fn(root, _load(root)))
            else:
                ok = bool(fn(_load(root)))
        except Exception as error:  # a crash is a failure, not an error
            ok = False
            name = f"{name} [raised {type(error).__name__}]"
        if ok:
            passed += 1
        else:
            failed.append(name)
    return passed, len(CASES), failed


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: python cases.py <repo-root> [<repo-root> ...]")
        return 2
    summary = {}
    for root in argv[1:]:
        passed, total, failed = run_arm(root)
        summary[root] = (passed, total, failed)
        print(f"=== {root} ===")
        for name in failed:
            print(f"FAIL {name}")
        print(f"{passed}/{total} cases passed")
    print("=== summary ===")
    print(json.dumps({k: {"passed": v[0], "total": v[1], "failed": v[2]} for k, v in summary.items()}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
