#!/usr/bin/env python3
"""Compare the Python implementation against the shared oracle.

The oracle is `tools/expected.json`; its derivation is `tools/oracle.md`; the
contract both are derived from is `docs/contract.md`.

This is a checker, not a white-box test: it drives the implementation through
the public command line the contract names (`python -m ledger <path>`) and
compares what the implementation prints with what the oracle says it must
print. Nothing here reaches into the implementation's internals.

What it compares, and why each comparison is here:

  * `balance_cents` - the exact sum of every amount (the contract: "It is an
    integer. No floating point is used anywhere in the computation.").
  * `by_label` - the per-label sums, over the trimmed labels.
  * the types - both the balance and the label totals must be integers, never
    floats and never booleans.
  * the key order - the contract pins the top-level key order ("with the keys
    in this order") and requires the label map to be sorted by code point, so
    the order is part of the contract and is compared rather than assumed.
  * the malformed case - the shared malformed input from `tools/oracle.md`:
    exit code 3, nothing on stdout, and a stderr message that names the line
    number of the malformed record (line 4). The wording of the reason is not
    pinned by the contract, so it is not asserted.

The whitespace around the JSON is deliberately not compared: the contract
pins the content and the order, not the spacing.

Exit codes:

  0 - the implementation agrees with the oracle on the fixture and on the
      malformed case.
  1 - the implementation ran and disagreed with the oracle.
  2 - the implementation could not be run at all (it is not there, or the
      command could not be started). Nothing was compared, so this is never a
      pass: a checker that passes because it checked nothing is a defect.
"""

import json
import locale
import os
import pathlib
import re
import subprocess
import sys
import tempfile

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
TOOLS_DIR = pathlib.Path(__file__).resolve().parent
ORACLE_PATH = TOOLS_DIR / "expected.json"
FIXTURE_PATH = REPO_ROOT / "fixtures" / "ledger.jsonl"
IMPLEMENTATION_PATH = REPO_ROOT / "ledger.py"

EXIT_AGREE = 0
EXIT_DISAGREE = 1
EXIT_CANNOT_RUN = 2

#: The shared malformed case, byte for byte, from `tools/oracle.md` section 5.
#: The last line is a JSON object without `amount_cents`; it is the 4th line
#: of the file and the 3rd record (line 2 is blank).
MALFORMED_CASE = (
    '{"date": "2026-01-05", "label": "coffee", "amount_cents": 100}\n'
    "\n"
    '{"date": "2026-01-07", "label": "rent", "amount_cents": 1200}\n'
    '{"date": "2026-01-08", "label": "rent"}\n'
)
MALFORMED_LINE_NUMBER = 4
MALFORMED_EXIT_CODE = 3


def configure_output():
    """Print UTF-8 whatever the host locale is, so the report reads the same
    everywhere. The contract's output is UTF-8; the checker speaks it too."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8", errors="replace")


def is_integer(value):
    """True for a real integer: `True`/`False` are not amounts."""
    return isinstance(value, int) and not isinstance(value, bool)


def load_oracle():
    """Read the oracle file and return the expected values."""
    with ORACLE_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def run_implementation(path):
    """Run `python -m ledger <path>` in the repository root.

    `PYTHONDONTWRITEBYTECODE` keeps the run from dropping a `__pycache__` into
    the working tree: a checker must not leave anything behind in the
    repository it inspects. `PYTHONIOENCODING` makes the child's stdout UTF-8
    whatever the host locale is, so the comparison below reads one encoding
    and not the machine's.
    """
    environment = dict(os.environ)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    environment["PYTHONIOENCODING"] = "utf-8"
    return subprocess.run(
        [sys.executable, "-m", "ledger", str(path)],
        cwd=str(REPO_ROOT),
        env=environment,
        capture_output=True,
    )


def decode(stream):
    """Decode the child's bytes. Returns `(text, note, error)`.

    UTF-8 first, because JSON's interchange encoding is UTF-8 and the label
    `café` has to survive the round trip. The contract does not pin the
    output bytes, so a stream that is valid in the host's locale but not in
    UTF-8 is a note, not a failure: the values are still compared. Bytes that
    decode as neither are a failure.
    """
    try:
        return stream.decode("utf-8"), None, None
    except UnicodeDecodeError:
        pass
    fallback = locale.getpreferredencoding(False)
    try:
        return (
            stream.decode(fallback),
            "the output is not valid UTF-8; it was decoded as %s" % fallback,
            None,
        )
    except (UnicodeDecodeError, LookupError):
        return "", None, "the output is not valid UTF-8 and not valid %s" % fallback


def parse_output(stdout):
    """Parse the printed JSON, keeping the key order.

    Returns `(value, order, error)`. `order` is the list of keys in the order
    they were printed, so the contract's key order can be compared.
    """
    lines = stdout.splitlines()
    if len(lines) != 1:
        return None, [], "expected exactly one line on stdout, got %d" % len(lines)
    try:
        pairs = json.loads(lines[0], object_pairs_hook=list)
    except ValueError as error:
        return None, [], "stdout is not JSON: %s" % error
    if not isinstance(pairs, list):
        return None, [], "stdout is not a JSON object"
    return dict(pairs), [key for key, _ in pairs], None


def compare_output(stdout, oracle):
    """Compare the printed JSON with the oracle. Returns a list of problems."""
    problems = []
    values, order, error = parse_output(stdout)
    if error is not None:
        return ["%s: %r" % (error, stdout)]

    expected_order = ["balance_cents", "by_label"]
    if order != expected_order:
        problems.append(
            "the top-level keys are %r, the contract pins %r" % (order, expected_order)
        )

    actual_balance = values.get("balance_cents")
    if not is_integer(actual_balance):
        problems.append(
            "balance_cents is %r, the contract requires an integer" % (actual_balance,)
        )
    elif actual_balance != oracle["balance_cents"]:
        problems.append(
            "balance_cents is %r, the oracle says %r"
            % (actual_balance, oracle["balance_cents"])
        )

    actual_labels = values.get("by_label")
    if not isinstance(actual_labels, list):
        problems.append(
            "by_label is %r, the contract requires an object" % (actual_labels,)
        )
        return problems

    label_order = [key for key, _ in actual_labels]
    if label_order != sorted(label_order):
        problems.append(
            "the by_label keys are %r, the contract requires them sorted by code "
            "point: %r" % (label_order, sorted(label_order))
        )

    actual_map = dict(actual_labels)
    expected_map = oracle["by_label"]
    for label in sorted(set(expected_map) - set(actual_map)):
        problems.append("by_label is missing the label %r" % label)
    for label in sorted(set(actual_map) - set(expected_map)):
        problems.append("by_label has the label %r, the oracle does not" % label)
    for label in sorted(set(expected_map) & set(actual_map)):
        actual = actual_map[label]
        if not is_integer(actual):
            problems.append(
                "by_label[%r] is %r, the contract requires an integer" % (label, actual)
            )
        elif actual != expected_map[label]:
            problems.append(
                "by_label[%r] is %r, the oracle says %r"
                % (label, actual, expected_map[label])
            )
    return problems


def names_line_number(text, number):
    """True when `text` names `number` as a standalone number, not `34`."""
    return re.search(r"(?<!\d)%d(?!\d)" % number, text) is not None


def compare_malformed():
    """Run the shared malformed case. Returns `(problems, notes)`."""
    problems = []
    notes = []
    with tempfile.TemporaryDirectory() as directory:
        path = pathlib.Path(directory) / "malformed.jsonl"
        path.write_text(MALFORMED_CASE, encoding="utf-8", newline="\n")
        completed = run_implementation(path)

    stdout, stdout_note, stdout_error = decode(completed.stdout)
    stderr, stderr_note, stderr_error = decode(completed.stderr)
    if stdout_note:
        notes.append("on stdout, %s" % stdout_note)
    if stderr_note:
        notes.append("on stderr, %s" % stderr_note)

    if completed.returncode != MALFORMED_EXIT_CODE:
        problems.append(
            "the malformed record gave exit code %d, the contract says %d"
            % (completed.returncode, MALFORMED_EXIT_CODE)
        )
    if stdout_error is not None:
        problems.append("on stdout, %s" % stdout_error)
    elif stdout.strip():
        problems.append(
            "the malformed record printed %r on stdout, the contract says stdout "
            "carries only the JSON line" % stdout
        )
    if stderr_error is not None:
        problems.append("on stderr, %s" % stderr_error)
    elif not names_line_number(stderr, MALFORMED_LINE_NUMBER):
        problems.append(
            "the stderr message does not name the malformed record's line number "
            "(%d): %r" % (MALFORMED_LINE_NUMBER, stderr.strip())
        )
    return problems, notes


def main(argv):
    configure_output()

    if argv[1:]:
        sys.stderr.write("usage: %s (no arguments)\n" % pathlib.Path(argv[0]).name)
        return EXIT_CANNOT_RUN

    oracle = load_oracle()
    print("oracle check: the Python implementation against tools/expected.json")
    print("  oracle   : %s" % ORACLE_PATH)
    print("  fixture  : %s" % FIXTURE_PATH)
    print(
        "  expected : balance_cents=%d by_label=%s"
        % (
            oracle["balance_cents"],
            json.dumps(oracle["by_label"], ensure_ascii=False),
        )
    )

    if not IMPLEMENTATION_PATH.exists():
        print(
            "  FAILED   : the Python implementation is not there: %s does not exist"
            % IMPLEMENTATION_PATH
        )
        print("  nothing was compared, so this is not a pass")
        return EXIT_CANNOT_RUN

    print("  running  : %s -m ledger %s" % (sys.executable, FIXTURE_PATH))
    completed = run_implementation(FIXTURE_PATH)
    stdout, stdout_note, stdout_error = decode(completed.stdout)
    stderr, stderr_note, stderr_error = decode(completed.stderr)
    print("  exit code: %d" % completed.returncode)
    print("  stdout   : %s" % stdout.strip())
    if stderr.strip():
        print("  stderr   : %s" % stderr.strip())
    if stdout_note:
        print("  note     : on stdout, %s" % stdout_note)
    if stderr_note:
        print("  note     : on stderr, %s" % stderr_note)

    problems = []
    if completed.returncode != 0:
        problems.append(
            "the fixture run exited with %d, the contract says 0" % completed.returncode
        )
    if stdout_error is not None:
        problems.append("on stdout, %s" % stdout_error)
    else:
        problems.extend(compare_output(stdout, oracle))
    if stderr_error is not None:
        problems.append("on stderr, %s" % stderr_error)

    print(
        "  malformed: the shared malformed case from tools/oracle.md (line %d)"
        % MALFORMED_LINE_NUMBER
    )
    malformed_problems, malformed_notes = compare_malformed()
    problems.extend(malformed_problems)
    for note in malformed_notes:
        print("  note     : %s" % note)

    if problems:
        print("  RESULT   : the implementation disagrees with the oracle")
        for problem in problems:
            print("    - %s" % problem)
        return EXIT_DISAGREE

    print(
        "  compared : balance_cents, by_label, their types, the key order and "
        "the malformed case"
    )
    print("  RESULT   : the implementation agrees with the oracle")
    return EXIT_AGREE


if __name__ == "__main__":
    sys.exit(main(sys.argv))
