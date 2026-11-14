# Python and Node.js are executed; the other three languages are read

Date: 2026-11-14. Asked by the Lead, answered by the user.
Amended: 2026-11-14, after two lanes found toolchains the Coordinator had missed.

## The question

This host has a Python runtime and no Go, JDK or Rust toolchain, so four of
the five implementations could only be judged by reading. The user was asked
whether to accept that, or to install the missing toolchains.

## The decision

The user answered "Test python and nodejs for now". So:

- **Python** is executed: its own tests run, and the shared fixture is
  processed by the command line.
- **TypeScript** is executed as well, on the runtime this host does have:
  Node v24.21.0, reached through the Electron binary
  (`$env:ELECTRON_RUN_AS_NODE="1"` before
  `D:\software\dsh\DeepSeek Harness.exe`). It is not a nodejs installation,
  and the report says so: the version floor it proves is the one that runtime
  carries, not the one a user's machine would carry.
- **Go, Java and Rust** stay read-only for now. Their lanes judged their own
  code by reading, and every verdict for them is marked `read`, never
  `executed`.

## Why it matters

The contract is cross-language: the same fixture must give the same answer in
every language. With two of the five executed and three read, the cross-check
has a real anchor for two languages and an inspection for three. The report
must not present the three read verdicts as if they had been run.

## Correction (2026-11-14)

Two premises above were wrong, and both lanes that found them said so rather
than working around the gap.

- **A JDK is installed.** The Java lane found OpenJDK 17.0.19 at
  `C:\Program Files\OpenLogic\jdk-17.0.19.10-hotspot\bin` — `javac` and
  `java` both run. It compiled `Ledger.java`, ran its own 16 JUnit tests
  (through a junit-platform-console-standalone jar downloaded to a temp
  directory) and ran the whole error matrix, so **Java is executed**, and its
  verdict is marked `executed` in the R6 verdict table. The R6 lane re-derived
  the same result independently. The earlier statement "no Go, JDK or Rust
  toolchain" was the Coordinator's mistake: the toolchain was looked for in
  the wrong places (it is not on PATH, and it is under OpenLogic, not under a
  JDK-named directory).
- **There is a real Node, not only the Electron binary.** The TypeScript lane
  found Node v24.21.0 at
  `C:\Users\leroy\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`
  and ran its tests with it.

Go and Rust remain read-only: there is genuinely no `go` and no `cargo` on
this host, and the lanes probed for them.

The decision the user made still stands — the user chose what to execute, and
more was executed than the question assumed, which is not a reason to ask
again. What changed is the record: three languages are executed (Python,
TypeScript, Java) and two are read (Go, Rust).
