# The `textnorm` specification

This is the whole specification. Both implementations follow it exactly; where
it is silent, the implementer chooses and says so in the report.

## The module

A package `textnorm` with three public functions and a command line.

### `normalize(text: str) -> str`

1. Every Unicode whitespace character becomes a plain space. That includes the
   non-breaking space, tabs, and the line breaks.
2. The typographic quotes become the ASCII ones: `'` (U+2018) and `'` (U+2019)
   become `'`, and `"` (U+201C) and `"` (U+201D) become `"`.
3. The en dash (U+2013) and the em dash (U+2014) become a single `-`.
4. A run of whitespace becomes exactly one space.
5. The result has no leading or trailing space.

### `stats(text: str) -> dict`

Returns a dict with exactly three keys:

- `chars` — the number of characters in `normalize(text)`.
- `words` — the number of whitespace-separated words in `normalize(text)`; an
  empty result is zero words.
- `lines` — the number of lines in the **original** text, split on universal
  newlines (`\r\n`, `\r` and `\n` all count). A trailing newline does not add
  an empty line, and an empty text has zero lines.

`lines` is counted on the original text, never on the normalised one. A text
that is only spaces has one line and no characters.

### The command line

`python -m textnorm <file>` reads the file as UTF-8 and prints three lines:

```
chars: <n>
words: <n>
lines: <n>
```

It exits 0 on success. If the file cannot be read, it exits 2, prints nothing
on stdout, and writes exactly this line to stderr:

```
textnorm: no such file: <path>
```

`<path>` is the path as it was given on the command line.

## The tests

Each implementation carries its own tests under `tests/`, written with the
standard library only (`unittest`), and they must run with

```
python -m unittest discover -s tests -t .
```

from the directory that holds the package. In this test bed each arm works in
its own directory under the repository root, so the command is run from that
directory.
