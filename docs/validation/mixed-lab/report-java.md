# The Java lane — the ledger module

Java implementation of `docs/contract.md`, in `Ledger.java` and `LedgerTest.java`,
with `pom.xml` describing the build. This lane is **executed**: a JDK 17 is
installed on this host (the brief said there was none — see §3.9), the module
was compiled, the test suite was run, and the program was run against the
shared fixture and against the error cases.

---

## 1. What I read

Three craft files, loaded with the skill tool before any code was written
(`swarm-craft-shared`, `swarm-craft-developer`, `swarm-craft-java`), plus the
contract, the shared fixture, the oracle (`tools/oracle.md`) and the
requirements file (`.swarm/requirements/mixed-lab.md`).

| rule | where | what it decided here |
| --- | --- | --- |
| Falsifiable checks; every number re-derived a second way | shared.md §2.1, §2.2 | The fixture's totals were derived by hand from the bytes, then derived again with a second, independent calculation (sum of the per-label totals) and compared with the program. A third derivation was made by running the Python reference lane and comparing **bytes**, not text. |
| Validate where the artifact actually runs | shared.md §2.3 | The program was run on this host with this JDK, not "reasoned about". The compile, the test suite and every error case were executed; §3 lists the commands and the outputs. |
| Boundaries: parse at the boundary, trust inside | shared.md §3.1, §3.2 | The JSON parser runs once, at the file boundary; inside, the code deals in `long` amounts and trimmed labels only. `Summary` is a record of two `long`-valued fields; the totals map is immutable. |
| Errors: one diagnostic per failure, on stderr; results on stdout; exit codes are a contract | shared.md §3.3 | `run(String[], PrintStream, PrintStream)` returns the exit code and writes each diagnostic to the error stream only. The success path writes exactly one line to the output stream. |
| Standard library first | shared.md §3.4 | No dependency at all: `java.nio.file`, `java.nio.charset`, `java.util`. The one dependency is the test framework, and it is named and pinned in `pom.xml`. |
| Encoding is explicit; input is untrusted; paths are not strings | shared.md §3.7 | The file is read through a `CharsetDecoder` that **reports** malformed input instead of replacing it, so a file that is not UTF-8 is a file that could not be read (exit 2), not a file with corrupted labels. The path is a `java.nio.file.Path` from the first moment; it is never concatenated into a string. |
| One behaviour per test; cover the boundary, not the middle; pin the wording when the wording is the contract | shared.md §3.9 | Sixteen tests, one behaviour each. The exit codes are asserted as the **literal numbers** 0, 2 and 3 (not as the `EXIT_*` constants), because the contract pins those numbers: a wrong constant must not be able to pass the test. The malformed message is asserted to contain the line number and the reason. |
| Naming and comments say what the code means | shared.md §3.12 | `summarize`, `run`, `toJson`, `Summary`, `MalformedRecordException`, `EXIT_OK`/`EXIT_UNREADABLE`/`EXIT_MALFORMED`; every public member has javadoc. |
| Java and Kotlin: nullability in the type, try-with-resources, immutable value objects, JUnit 5 | shared.md §4 | `Summary` is an immutable record whose map is an unmodifiable `TreeMap`; the reader is closed in try-with-resources; the tests are JUnit 5 with `@TempDir`. |
| Name the target before the edit: files touched, behaviour changed, behaviour left alone, files not touched | developer.md §2 | Before writing: `Ledger.java`, `LedgerTest.java`, `pom.xml`, this report — and nothing else. The other lanes' files and `README.md` were read only. |
| Shape the change: settle input, output and failure mode in the signature first | developer.md §3 | `summarize(Path)` throws `IOException` (cannot read) and `MalformedRecordException` (read, but a record is malformed) — the two failure modes of the contract are two types. `run(...)` adds the exit code and the streams so the same code path can be tested without starting a second JVM. |
| Make the code say what it means | developer.md §4 | The record holds `balanceCents` and `byLabel`; the JSON keys (`balance_cents`, `by_label`) appear only in the printer. The parser keeps the **literal text** of a number, so "is this an integer?" is answered without ever creating a floating point value. |
| Prove it as you go: write the check with the code; make it fail on purpose | developer.md §5 | The tests were written with the code; four deliberate mutations of the implementation were compiled and run against the suite, and each one is caught by a named test (§3.5). |
| Layout: `src/main/java`, one public class per file, file name = class name, Java 17 floor | java.md §1 | File name = class name (`Ledger.java`/`Ledger.java` ✓), Java 17 ✓. **Deviation:** the sources sit at the root of the repository, not under `src/main/java`, because the brief gives this lane exactly four files and forbids any other path. |
| Typing: primitives over boxed | java.md §2 | Amounts are `long`; the map is `Map<String, Long>` because a `Map` cannot hold primitives, and every value is unboxed at the one place it is used. |
| Data modelling: records, immutable | java.md §3 | `public record Summary(long balanceCents, Map<String, Long> byLabel)`, with a compact constructor that copies the totals into an unmodifiable, code-point-ordered map. |
| Errors: checked exceptions in the signature, narrowest catch | java.md §6 | `MalformedRecordException extends Exception` (checked) and is thrown by `summarize`; `run` catches exactly `MalformedRecordException` and `IOException`, and lets anything else propagate rather than misreporting it as a read failure. |
| Resources: try-with-resources | java.md §7 | The reader is closed by try-with-resources in `summarize`. |
| Files and paths: `Path`/`Files`, never a concatenated path, UTF-8 decoding | java.md §8 | `Path.of(name)`, `Files.newInputStream(path)`, decoding with `StandardCharsets.UTF_8` through a reporting decoder. |
| Shell: `System.exit` only in `main`; diagnostics on stderr | java.md §9 | `System.exit` appears once, in `main`. `run` returns the code. |
| Testing: JUnit 5, `assertEquals(expected, actual)`, `@TempDir`, `assertThrows` checking type and message | java.md §12 | JUnit 5 (Jupiter) 5.10.2, `@TempDir Path workDir` for the fixture files, `assertThrows(Ledger.MalformedRecordException.class, ...)` followed by assertions on the line number and the reason. Expected value first in every `assertEquals`. |
| Command line: `public static void main`, `System.exit` only there | java.md §13 | `main(String[])` sets both streams to UTF-8 and calls `System.exit(run(args, System.out, System.err))`. |
| Style: camelCase / PascalCase / UPPER_SNAKE_CASE, javadoc on the public surface, doclint must pass | java.md §15 | `javadoc -Xdoclint:all` exits 0 (§3.4). |
| Dependencies: declare and pin every version, plugins included | java.md §16 | One dependency (`org.junit.jupiter:junit-jupiter:5.10.2`, test scope) and every plugin of the default lifecycle pinned in `pom.xml`; each pinned version was checked against Maven Central with an HTTP request (§3.8). |
| Common traps | java.md §19 | Three traps avoided and checked: `String.compareTo` is UTF-16 order, not code point order (§3.6); `PrintStream.println` writes the platform line separator, so the line is written with `print` + `'\n'` to be LF everywhere; a shared static `CharsetDecoder` is not thread-safe, so a fresh decoder is built per call. |

---

## 2. What I built

Three files (plus this report), all UTF-8, LF only, no CR anywhere.

### `Ledger.java` — the module (811 lines, one public class, default package)

The public surface:

```java
public final class Ledger {
    public static final int EXIT_OK = 0;
    public static final int EXIT_UNREADABLE = 2;
    public static final int EXIT_MALFORMED = 3;

    public record Summary(long balanceCents, Map<String, Long> byLabel) { }

    public static final class MalformedRecordException extends Exception {
        public MalformedRecordException(int lineNumber, String reason);
        public int lineNumber();
        public String reason();          // the message is "line <n>: <reason>"
    }

    /** @throws IOException if the file cannot be read or is not valid UTF-8
     *  @throws MalformedRecordException if one of its lines is not a record */
    public static Summary summarize(Path path) throws IOException, MalformedRecordException;

    /** @return the exit code: 0, 2 or 3 */
    public static int run(String[] args, PrintStream out, PrintStream err);

    public static void main(String[] args);
}
```

Inside the file, and not part of the public surface: the JSON parser the JDK
does not ship (`JsonValue` — a sealed interface permitting `JsonObject`,
`JsonArray`, `JsonString`, `JsonNumber`, `JsonBoolean`, `JsonNull` — plus
`JsonSyntaxException` and `DuplicateKeyException`), the package-private
`toJson(Summary)` and `jsonString(String)`, and the small value records the
parser returns.

How the contract's rules are met:

* **Blank lines** — `line.isBlank()` (blank means empty or whitespace only).
* **Three keys, no more, no less** — a missing key, an unexpected extra key
  and a duplicate key are all malformed.
* **`amount_cents` is an integer, never a float** — the parser keeps the
  literal text of a number; a literal that contains `.`, `e` or `E` is
  malformed, and the literal is handed to `Long.parseLong`, so the value is a
  `long` from the file to the output. No `double`, `float`, `BigDecimal`,
  `Math.` or `parseDouble` appears anywhere in the file (the only occurrences
  of the word "float" are in prose comments).
* **The label is trimmed once, at the boundary** — `String.strip()` is applied
  when the record is read; the trimmed value is what is summed and what is
  printed. An empty label after trimming is malformed.
* **The dates are read, compared and reported, never parsed into a
  timezone-aware object** — the date is checked as text (shape `YYYY-MM-DD`,
  month 1–12, day within the month, leap rule included) and never handed to
  `LocalDate` or to any date factory.
* **The keys are sorted by code point** — the totals live in a `TreeMap` with
  a `compareByCodePoint` comparator, not `String.compareTo` (which is UTF-16
  code-unit order and differs for supplementary characters).
* **One JSON line on stdout, exit 0** — `run` writes exactly one line to the
  output stream and returns 0; nothing else is ever written there.
* **Exit 2** — the message is `cannot read <path>: <ExceptionName>: <message>`
  and it names the path. A file that is not valid UTF-8 is a file that could
  not be read, so it also exits 2. A wrong number of arguments is a usage
  error: `usage: java Ledger <path>`, also exit 2 (the contract does not give
  the usage error a code of its own).
* **Exit 3** — the message is `line <n>: <reason>`, with `n` the 1-based
  **physical line** of the file, and it goes to stderr. Nothing is written to
  stdout in this case.
* **Encoding** — the file is read as UTF-8 with a decoder that reports bad
  bytes; the output is written as UTF-8 (`main` replaces `System.out` and
  `System.err` with UTF-8 streams, because the default charset of this host is
  GBK and would write `café` as two bytes no UTF-8 reader could read back).
  The line is terminated with `\n` on every platform, not with the platform
  line separator.

### `LedgerTest.java` — the tests (287 lines, JUnit 5)

Sixteen tests, one behaviour each, all of them run in the same JUnit run:
`aNegativeAmountCountsTowardsTheBalance`, `aZeroAmountIsAnAmount`,
`aBlankLineIsIgnored`, `aPaddedLabelIsTrimmedOnceAtTheBoundary`,
`aLabelOutsideAsciiKeepsItsText`, `aMalformedRecordNamesItsLineNumberAndItsReason`,
`anAmountThatIsNotAnIntegerIsMalformed`, `aLineThatIsNotAJsonObjectIsMalformed`,
`anEmptyFileGivesAnEmptySummary`, `aFileOfBlankLinesGivesAnEmptySummary`,
`labelsAreOrderedByCodePoint`, `theSharedFixtureContentGivesTheAgreedLine`,
`theProgramPrintsOneJsonLineAndExitsZero`, `aMissingFileIsReportedAndExitsTwo`,
`aMalformedRecordIsReportedAndExitsThree`,
`aWrongNumberOfArgumentsIsReportedAndExitsTwo`.

The seven boundaries the contract names are covered by
`aNegativeAmountCountsTowardsTheBalance`, `aZeroAmountIsAnAmount`,
`aBlankLineIsIgnored`, `aPaddedLabelIsTrimmedOnceAtTheBoundary`,
`aLabelOutsideAsciiKeepsItsText`,
`aMalformedRecordNamesItsLineNumberAndItsReason` and
`anEmptyFileGivesAnEmptySummary`. The test file is pure ASCII: the non-ASCII
text is written as `\uXXXX` escapes, so the file cannot be misread by a
compiler that reads sources in another charset.

### `pom.xml` — the build

`org.swarm.mixedlab:ledger-java:1.0.0`, packaging `jar`, UTF-8 source
encoding, `maven.compiler.release=17`; one dependency,
`org.junit.jupiter:junit-jupiter:5.10.2` (test scope); the compiler plugin
3.13.0 with `<release>17</release>` and `<encoding>UTF-8</encoding>`, excluding
the test class from the main compile and the module from the test compile
(the sources are not under `src/main/java`); surefire 3.2.5; and every other
plugin of the default lifecycle pinned in `<pluginManagement>`.

---

## 3. How I checked it

Everything below was run on this host with
`C:\Program Files\OpenLogic\jdk-17.0.19.10-hotspot\bin` (OpenJDK 17.0.19,
`javac 17.0.19`). All build artefacts were written to
`%LOCALAPPDATA%\Temp\ledger-java-verify`; nothing was added to the repository.

### 3.1 The compile

```
javac -encoding UTF-8 -Xlint:all -d <tmp>\classes -cp <tmp>\junit-console.jar \
      Ledger.java LedgerTest.java
```

Exit 0, **no warnings at all** (`-Xlint:all`). The test framework is
`junit-platform-console-standalone-1.10.2.jar`, downloaded to the temp
directory only.

### 3.2 The test suite

```
java -jar <tmp>\junit-console.jar execute --class-path <tmp>\classes \
     --select-class=LedgerTest --details=tree
```

`16 tests found, 16 tests successful, 0 tests failed, 0 tests skipped` — exit 0.

### 3.3 The shared fixture

```
java -cp <tmp>\classes Ledger D:\project\swarm-mixed-lab\fixtures\ledger.jsonl
```

Exit 0, stderr empty, stdout exactly 85 bytes, one line:

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

(0x0A at the end; `é` is U+00E9 as the two UTF-8 bytes `c3 a9`.)

### 3.4 The style gate

`javadoc -Xdoclint:all -encoding UTF-8` on `Ledger.java` (run in an isolated
copy, so that javadoc cannot pick up the test class): exit 0, no warning.

### 3.5 The mutations — does the suite actually discriminate?

Four deliberate changes to the implementation, each compiled and run against
the unchanged test suite. Each one is caught by a named test:

| mutation | tests that fail |
| --- | --- |
| the label is not trimmed | `aPaddedLabelIsTrimmedOnceAtTheBoundary`, `theSharedFixtureContentGivesTheAgreedLine` |
| the map is ordered by `String.compareTo` instead of by code point | `labelsAreOrderedByCodePoint` |
| `EXIT_MALFORMED` is changed from 3 to 2 | `aMalformedRecordIsReportedAndExitsThree` |
| the malformed branch returns `EXIT_UNREADABLE` | `aMalformedRecordIsReportedAndExitsThree` |

The third mutation is why the tests assert the literal numbers 0, 2 and 3
rather than the constants: with the constants, a wrong constant passed the
test. The test was changed, and the mutation then failed it.

### 3.6 The error paths, one by one

Every case was run as a separate process; stdout and stderr were captured
separately.

| input | exit | stdout | stderr |
| --- | --- | --- | --- |
| the shared malformed case of `tools/oracle.md` §5 (4 lines, the 4th missing `amount_cents`) | 3 | empty | `line 4: missing key "amount_cents"` |
| a record missing `amount_cents` | 3 | empty | `line 1: missing key "amount_cents"` |
| `"amount_cents": 12.5` | 3 | empty | `line 1: "amount_cents" is not an integer` |
| `[1, 2, 3]` | 3 | empty | `line 1: not a JSON object` |
| an extra key | 3 | empty | `line 1: unexpected key "extra"` |
| a duplicate key | 3 | empty | `line 1: duplicate key "label"` |
| `"label": "   "` | 3 | empty | `line 1: "label" is empty after trimming` |
| `"date": "2026-13-05"` | 3 | empty | `line 1: "date" is not an ISO date (YYYY-MM-DD)` |
| an empty file | 0 | `{"balance_cents": 0, "by_label": {}}` | empty |
| a file of blank lines only | 0 | `{"balance_cents": 0, "by_label": {}}` | empty |
| a file that is not UTF-8 | 2 | empty | `cannot read <path>: MalformedInputException: Input length = 1` |
| a file that does not exist | 2 | empty | `cannot read <path>: NoSuchFileException: <path>` |
| a directory | 2 | empty | `cannot read <path>: AccessDeniedException: <path>` |
| no argument | 2 | empty | `usage: java Ledger <path>` |

The shared malformed case reports **line 4** — the physical line of the file,
not the third record — which is what `tools/oracle.md` §5 asks for.

### 3.7 The cross-language check

The Python lane's `ledger.py` was run on the same fixture and its output was
compared with the Java output **byte by byte**:

```
java   stdout = 85 bytes: 7b 22 62 61 6c ... 63 61 66 c3 a9 22 ... 7d 7d 0a
python stdout = 85 bytes: 7b 22 62 61 6c ... 63 61 66 c3 a9 22 ... 7d 7d 0a
byte-identical = True      (both stderr empty, both exit 0)
```

So the two implementations agree on the bytes, not merely on the values, and
the `café` label survives the round trip unchanged.

### 3.8 The build description

`pom.xml` was parsed with an XML parser (well-formed, root `project`, the
expected children) and every pinned version was checked against Maven Central
with an HTTP request: maven-clean 3.3.2, maven-resources 3.3.1,
maven-compiler 3.13.0, maven-surefire 3.2.5, maven-jar 3.4.1,
maven-install 3.1.2, maven-deploy 3.1.2, junit-jupiter 5.10.2 — all HTTP 200.

### 3.9 The brief's premise about this host

The brief said "This host has no JDK. You therefore CANNOT compile or run
your code." That is not true of this host: a JDK 17 is installed
(`C:\Program Files\OpenLogic\jdk-17.0.19.10-hotspot\bin`, `javac 17.0.19`,
OpenJDK 64-Bit Server VM). Everything above was therefore executed. The oracle lane's report says that
"No Go, JDK, Node or Rust toolchain is present on this host" — that is right
about Go, Node and Rust (a probe of this host finds `go`, `node`, `npx`,
`rustc`, `cargo` and `tsc` all absent) and wrong about the JDK, so the claim
should be corrected. What is genuinely absent is Maven (`mvn` and `gradle` are
not installed, and there is no local `~/.m2` repository), which is why
`pom.xml` was verified by parsing and by checking its pinned versions, and not
by running it (§5).

### 3.10 The contract, rule by rule

| contract | where it is met | evidence |
| --- | --- | --- |
| UTF-8 JSON Lines, one object per line | `summarize` reads through a reporting UTF-8 decoder | §3.6 (invalid UTF-8 → exit 2), §3.3 |
| an empty or whitespace-only line is ignored | `line.isBlank()` | `aBlankLineIsIgnored`, `aFileOfBlankLinesGivesAnEmptySummary` |
| exactly three keys | missing / extra / duplicate key are malformed | §3.6 |
| `date` is an ISO date | checked as text, never parsed into a date object | `line 1: "date" is not an ISO date (YYYY-MM-DD)` |
| `label` is not empty after trimming; it is trimmed | `strip()` at the boundary | `aPaddedLabelIsTrimmedOnceAtTheBoundary` |
| `amount_cents` is an integer, may be negative, never a float | the literal is kept as text and parsed with `Long.parseLong` | `aNegativeAmountCountsTowardsTheBalance`, `anAmountThatIsNotAnIntegerIsMalformed`, the scan for floating point in §2 |
| a malformed record is reported and the program stops | `MalformedRecordException` carries the line number and the reason | §3.6, `aMalformedRecordNamesItsLineNumberAndItsReason` |
| the message names the line number (1-based) and the reason, on stderr | `line <n>: <reason>` | §3.6 |
| one JSON object on one line, keys `balance_cents` then `by_label` | `toJson` | §3.3, `theProgramPrintsOneJsonLineAndExitsZero` |
| `balance_cents` is the exact sum, no floating point | `long` accumulator | §2, the scan |
| `by_label` maps each trimmed label to its exact sum | `byLabel.merge(..., Long::sum)` | `aPaddedLabelIsTrimmedOnceAtTheBoundary` |
| the keys are sorted lexicographically by code point | `TreeMap` with a code-point comparator | `labelsAreOrderedByCodePoint` |
| a file with no records prints `{"balance_cents": 0, "by_label": {}}` | — | `anEmptyFileGivesAnEmptySummary`, §3.6 |
| the output is on stdout, the program exits 0 | `run` / `main` | §3.3, §3.6 |
| exactly one path on the command line | `run` checks `args.length != 1` | `aWrongNumberOfArgumentsIsReportedAndExitsTwo` |
| exit 0 / 2 / 3 | `EXIT_OK` / `EXIT_UNREADABLE` / `EXIT_MALFORMED` | §3.6 |
| integer arithmetic only | `long` from the file to the output | the scan |
| the label is trimmed once, at the boundary | one `strip()` call, at read time | `aPaddedLabelIsTrimmedOnceAtTheBoundary` |
| the dates are read, compared and reported, never parsed | text comparison only | §2 |
| nothing is printed except the one JSON line on stdout | the diagnostic stream is a separate argument | §3.6 (stdout empty in every failure case) |

---

## 4. The result on the shared fixture

`fixtures/ledger.jsonl` holds six physical lines, of which line 2 is blank
and ignored, so five records:

```
0
+ 450   (coffee)     = 450
− 150   (coffee)     = 300
+ 120000 (rent)      = 120300
+ 0     (coffee)     = 120300
+ 300   (café)       = 120600
```

`coffee` = 450 − 150 + 0 = 300, `rent` = 120000, `café` = 300; and
300 + 120000 + 300 = 120600, the same number by the other route.

The line my implementation prints, and does print (§3.3):

```
{"balance_cents": 120600, "by_label": {"café": 300, "coffee": 300, "rent": 120000}}
```

85 bytes including the trailing `\n`; `café` is U+00E9 (NFC, not normalised
further) as the UTF-8 bytes `63 61 66 c3 a9`; the labels are in code point
order (`café` < `coffee` because `61` < `6f`, `coffee` < `rent` because `63` <
`72`). This is byte for byte the line the Python lane prints (§3.7) and it
carries the same values as `tools/expected.json`.

---

## 5. What I did not check — the boundary

* **`pom.xml` was never executed.** Maven is not installed on this host and
  there is no local `~/.m2` repository. The file was checked by parsing it as
  XML and by confirming that every pinned version exists in Maven Central, but
  `mvn test` was never run. The equivalent build **was** run by hand:
  `javac -encoding UTF-8 -Xlint:all` and the JUnit console launcher, with the
  same JUnit 5.10.2 the pom declares. The `<sourceDirectory>` /
  `<testSourceDirectory>` pointing at the repository root is unusual and is
  the part most likely to need a tweak when it is first run under Maven.
* **The other four lanes were not run by me.** I compared my output with the
  Python lane byte by byte; the TypeScript, Go and Rust lanes I did not run
  and did not compare against.
* **One platform.** Everything was run on Windows with OpenJDK 17 on a host
  whose default charset is GBK. The output is written as UTF-8 explicitly, so
  another charset or another platform should not change the bytes, but that
  was not tested here. The `\n` line ending is written explicitly rather than
  with the platform separator, but only Windows was exercised.
* **No CRLF fixture and no BOM fixture.** The contract says the file is UTF-8
  JSON Lines; the shared fixture is LF-only and has no BOM. A file with CRLF
  line endings or with a UTF-8 BOM was not tested, and a BOM would very likely
  make the first line a malformed record (the BOM is not whitespace).
* **Exotic whitespace.** Java's `String.strip()` removes the characters that
  `Character.isWhitespace` calls whitespace; Python's `str.strip()` removes a
  slightly different set (it also removes U+00A0 NO-BREAK SPACE and U+000B,
  which `strip()` keeps). A label padded with a non-breaking space would
  therefore be trimmed in Python and not in Java. A probe confirmed the
  difference. The contract does not say which set it means, and the shared
  fixture does not use either character.
* **The strictness choices are interpretations.** The contract names three
  kinds of malformed record (not an object, a missing key, a non-integer
  amount). This implementation treats an **unexpected extra key**, a
  **duplicate key**, a **label that is empty after trimming**, a **date that
  is not `YYYY-MM-DD`** and a **date that does not exist** (such as
  `2026-02-30`) as malformed as well. The contract fixes the wording of the
  failure only as "the line number and the reason", so another lane may
  disagree on these five cases; the shared fixture and the shared malformed
  case do not contain any of them.
* **Overflow** of a 64-bit amount is reported as malformed
  (`out of range for a 64-bit integer`) rather than being wrapped or
  saturated. No shared case covers it.
* **The usage error** (no path, or more than one path) exits 2 and prints
  `usage: java Ledger <path>`. The contract gives no code for it; 2 was chosen
  because it is the code for "the file could not be read".
* **Concurrency.** The module is single-threaded; the reader is not shared
  between threads, and a fresh decoder is built per call, so nothing is
  shared and mutable.

### Two things for the Lead to note

* The file is `Ledger.java`, not `ledger.java` as `README.md` lists it. Java
  requires the file name to match the public class, so the file name is
  `Ledger.java` and the class is `Ledger`. The command line is
  `java -cp <classes> Ledger fixtures/ledger.jsonl`. `README.md` is not this
  lane's file, so it was not changed.
* The sources are at the root of the repository rather than under
  `src/main/java`, because this lane owns exactly four files and may not
  create a directory tree. `pom.xml` says so in its `<description>`.
