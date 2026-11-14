"""Observable-check probe for criteria C1..C5.

Run with PYTHONPATH pointing at the <repo>\\src directory under test.
Exits 0 only when every check passes; prints the actual value for each check.
"""

import sys

from effdemo import word_lengths
from effdemo.core import longest_word
from effdemo.strings import char_counts
from effdemo.text import first_last_letter

results = []


def check(cid, label, actual, expected):
    ok = actual == expected
    results.append((cid, ok))
    print(f"[{'PASS' if ok else 'FAIL'}] {cid} {label}")
    print(f"         actual   = {actual!r}")
    print(f"         expected = {expected!r}")


# C1 -- longest word, ties broken alphabetically
check("C1", "two equal-length words in non-alphabetical order",
      longest_word(["ddd", "aaa"]), "aaa")
check("C1", "three equal-length words (alphabetically first is last)",
      longest_word(["bbb", "ccc", "aaa"]), "aaa")
check("C1", "three equal-length words (alphabetically first is first)",
      longest_word(["aaa", "bbb", "ccc"]), "aaa")
check("C1", "two equal-length words in non-alphabetical order (bbb/aaa)",
      longest_word(["bbb", "aaa"]), "aaa")

# C2 -- empty input
check("C2", "longest_word([]) is the empty string", longest_word([]), "")

# C3 -- lengths in input order
check("C3", "word_lengths of different lengths, in order",
      word_lengths(["a", "bb", "ccc"]), [1, 2, 3])
check("C3", "word_lengths([]) is []", word_lengths([]), [])

# C4 -- character counts
check("C4", "two cases of the same letter + punctuation counted separately",
      char_counts("aA!"), {"a": 1, "A": 1, "!": 1})
check("C4", "char_counts('') is {}", char_counts(""), {})

# C5 -- first/last alphanumeric, lowercased
check("C5", "first and last alphanumeric separated by punctuation",
      first_last_letter("...Hello, World!"), ("h", "d"))
check("C5", "text with no alphanumeric character",
      first_last_letter("! ? - ."), ("", ""))
check("C5", "empty text", first_last_letter(""), ("", ""))

failed = [cid for cid, ok in results if not ok]
print()
print(f"TOTAL={len(results)} FAILED={len(failed)} FAILED_IDS={sorted(set(failed))}")
sys.exit(1 if failed else 0)
