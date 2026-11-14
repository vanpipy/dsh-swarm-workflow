$ErrorActionPreference = "Continue"
$root   = "D:\project\.swarm-lab\proof-scratch"
$base   = "$root\_baseline"
$env:PYTHONDONTWRITEBYTECODE = "1"
$env:PYTHONPATH = "$root\src;D:\project\.venv-win\Lib\site-packages"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8([string]$path, [string]$content) {
  [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}
function Restore([string]$rel) { Copy-Item -Force "$base\$rel" "$root\$rel" }

function Run-Pytest([string]$label, [string[]]$pytestArgs) {
  Push-Location $root
  $out = & C:\Python312\python.exe -m pytest -q -p no:cacheprovider --ignore="$root\_baseline" @pytestArgs 2>&1 | Out-String -Width 200
  $code = $LASTEXITCODE
  Pop-Location
  Write-Output "---- $label :: pytest exit code = $code"
  Write-Output $out.TrimEnd()
  Write-Output ""
}

function Run-Probe([string]$label, [string]$script, [string[]]$probeArgs) {
  Push-Location $root
  $out = & C:\Python312\python.exe $script @probeArgs 2>&1 | Out-String -Width 200
  $code = $LASTEXITCODE
  Pop-Location
  Write-Output "---- $label :: probe exit code = $code"
  Write-Output $out.TrimEnd()
  Write-Output ""
}

$collectible = @("tests/test_core.py", "tests/test_strings.py", "tests/test_text.py")

Write-Output "################ BASELINE (pristine copy of eff-repo) ################"
Run-Pytest "baseline FULL suite" @()
Run-Pytest "baseline three collectible files only" $collectible
Run-Probe "baseline C1..C5 probe" "$root\probe_criteria.py" @()

Write-Output "################ M-C1a : longest_word breaks ties ALPHABETICALLY (the criterion's behaviour) ################"
@'
"""Tiny functions used by the swarm efficiency rounds."""

from collections.abc import Sequence


def word_lengths(words: Sequence[str]) -> list[int]:
    """Return the length of each word, in order."""
    return [len(word) for word in words]


def longest_word(words: Sequence[str]) -> str:
    """MUTATION M-C1a: ties are broken alphabetically (alphabetically first wins)."""
    best = ""
    for word in words:
        if len(word) > len(best) or (len(word) == len(best) and word < best):
            best = word
    return best
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\core.py" $_ }
Run-Pytest "M-C1a three collectible files only" $collectible
Run-Probe "M-C1a C1..C5 probe" "$root\probe_criteria.py" @()
Restore "src\effdemo\core.py"

Write-Output "################ M-C1b : longest_word keeps the FIRST tied word in input order (C1-violating behaviour) ################"
Run-Pytest "M-C1b (pristine behaviour) three collectible files only" $collectible
Run-Probe "M-C1b (pristine behaviour) C1..C5 probe" "$root\probe_criteria.py" @()

Write-Output "################ M-C2 : longest_word returns None for an empty sequence ################"
@'
"""Tiny functions used by the swarm efficiency rounds."""

from collections.abc import Sequence


def word_lengths(words: Sequence[str]) -> list[int]:
    """Return the length of each word, in order."""
    return [len(word) for word in words]


def longest_word(words: Sequence[str]) -> str:
    """MUTATION M-C2: an empty sequence returns None instead of the empty string."""
    best = None
    for word in words:
        if best is None or len(word) > len(best):
            best = word
    return best
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\core.py" $_ }
Run-Pytest "M-C2 targeted" @("tests/test_core.py::test_longest_word_of_empty_sequence_returns_empty_string")
Run-Probe "M-C2 C1..C5 probe" "$root\probe_criteria.py" @()
Restore "src\effdemo\core.py"

Write-Output "################ M-C3 : word_lengths returns lengths in REVERSE input order ################"
@'
"""Tiny functions used by the swarm efficiency rounds."""

from collections.abc import Sequence


def word_lengths(words: Sequence[str]) -> list[int]:
    """MUTATION M-C3: lengths are returned in reverse input order."""
    return [len(word) for word in reversed(words)]


def longest_word(words: Sequence[str]) -> str:
    """Return the longest word in ``words``.

    On a tie the first such word in input order wins. An empty sequence
    returns the empty string.
    """
    best = ""
    for word in words:
        if len(word) > len(best):
            best = word
    return best
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\core.py" $_ }
Run-Pytest "M-C3 targeted" @("tests/test_core.py::test_word_lengths_counts_each_word")
Run-Probe "M-C3 C1..C5 probe" "$root\probe_criteria.py" @()
Restore "src\effdemo\core.py"

Write-Output "################ M-C4 : char_counts counts CASE-INSENSITIVELY ################"
@'
"""Character-level helpers for the swarm efficiency rounds."""

__all__ = ["char_counts"]


def char_counts(text: str) -> dict[str, int]:
    """MUTATION M-C4: counting is case-insensitive (text is lowercased first)."""
    counts: dict[str, int] = {}
    for char in text.lower():
        counts[char] = counts.get(char, 0) + 1
    return counts
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\strings.py" $_ }
Run-Pytest "M-C4 targeted" @("tests/test_strings.py::test_char_counts_is_case_sensitive")
Run-Probe "M-C4 C1..C5 probe" "$root\probe_criteria.py" @()
Restore "src\effdemo\strings.py"

Write-Output "################ M-C5 : first_last_letter does NOT lowercase ################"
@'
"""Text helpers used by the swarm efficiency rounds."""


def first_last_letter(text: str) -> tuple[str, str]:
    """MUTATION M-C5: the first/last alphanumeric characters are not lowercased."""
    alnum = [char for char in text if char.isalnum()]
    if not alnum:
        return ("", "")
    return (alnum[0], alnum[-1])
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\text.py" $_ }
Run-Pytest "M-C5 targeted" @("tests/test_text.py::test_first_last_letter_returns_first_and_last_alphanumeric_lowercased")
Run-Probe "M-C5 C1..C5 probe" "$root\probe_criteria.py" @()
Restore "src\effdemo\text.py"

Write-Output "################ M-C6 : a NEW public function with NO test ################"
@'
"""Tiny functions used by the swarm efficiency rounds."""

from collections.abc import Sequence


def word_lengths(words: Sequence[str]) -> list[int]:
    """Return the length of each word, in order."""
    return [len(word) for word in words]


def longest_word(words: Sequence[str]) -> str:
    """Return the longest word in ``words``.

    On a tie the first such word in input order wins. An empty sequence
    returns the empty string.
    """
    best = ""
    for word in words:
        if len(word) > len(best):
            best = word
    return best


def unique_chars(text: str) -> list[str]:
    """MUTATION M-C6: a new public function that no test names."""
    seen: list[str] = []
    for char in text:
        if char not in seen:
            seen.append(char)
    return seen
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\core.py" $_ }
Run-Probe "M-C6 coverage probe" "$root\probe_coverage.py" @("$root\src\effdemo", "$root\tests")
Restore "src\effdemo\core.py"

Write-Output "################ M-C7 : supply the missing vowel_ratio so the suite can pass ################"
@'
"""Tiny functions used by the swarm efficiency rounds."""

from collections.abc import Sequence


def word_lengths(words: Sequence[str]) -> list[int]:
    """Return the length of each word, in order."""
    return [len(word) for word in words]


def longest_word(words: Sequence[str]) -> str:
    """Return the longest word in ``words``.

    On a tie the first such word in input order wins. An empty sequence
    returns the empty string.
    """
    best = ""
    for word in words:
        if len(word) > len(best):
            best = word
    return best


def vowel_ratio(text: str) -> float:
    """MUTATION M-C7: supplies the function demanded by tests/test_spec_vowel_ratio.py."""
    if not text:
        return 0.0
    vowels = sum(1 for char in text if char.lower() in "aeiou")
    return vowels / len(text)
'@ | ForEach-Object { Write-Utf8 "$root\src\effdemo\core.py" $_ }
Run-Pytest "M-C7 FULL suite" @()
Restore "src\effdemo\core.py"

Write-Output "################ FINAL BASELINE CHECK (scratch restored) ################"
Run-Pytest "final baseline FULL suite" @()
