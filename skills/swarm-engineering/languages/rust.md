---
name: swarm-craft-rust
description: The Rust pieces - the idioms, the version floors and the traps, one section per topic.
whenToUse: Read in any lane that changes Rust code, before it changes it.
---

# The Rust pieces

## 0. How to use this file

The `swarm-engineering` skill owns the **process** — what a lane does, what it
reports — and `../shared.md` owns the **shared pieces** that hold in every
language. This file owns the **idioms**: the Rust rules that are not generic,
the version floors they carry, and the traps this language has shipped. Read
the piece that matches what you are changing, before you change it: "read §6
of the Rust craft before you touch the error handling". Everything here is
checkable — if a rule cannot be checked, treat it as advice rather than
guidance.

## 1. The surface: layout, packaging, the version floor

* `cargo new` for a package: `src/lib.rs` or `src/main.rs`.
* A `[workspace]` groups the crates of one repository.
* Declare the floor in `Cargo.toml` as `rust-version = "1.85"`.
* Cargo 1.56 and later read it; CI runs the suite on that toolchain.
* Pin the compiler in `rust-toolchain.toml`: `channel`, `components`.
* Edition 2021 needs Rust 1.56; edition 2024 needs Rust 1.85.
* `cargo build`, `cargo test`, `cargo clippy`, `cargo fmt` are the tools.

## 2. Typing

* Absence is `Option<T>`, failure is `Result<T, E>` — Python's `None` and
  Java's `null` have no equivalent.
* No implicit numeric conversion: a `u32` does not become a `u64`.
* `as` casts never fail: `u32 as u8` drops high bytes, `i32 as u32`
  reinterprets the sign. Use `TryFrom` where it may not fit.
* `Display` for the user, `Debug` for the programmer; `?` needs `E: Debug`.
* `Send`: may move to another thread. `Sync`: `&T` may be shared.

## 3. Data modelling

* An `enum` for a closed set of states, a `struct` for a record.
* Two `bool` flags that must not both be true become an `enum`.
* Derive what you mean: `#[derive(Clone, Debug, PartialEq, Eq, Hash)]`.
* `PartialEq` without `Eq` breaks use as a `HashMap` key.
* Parse at the boundary and convert into your own type: `UserId::parse`
  returns `Result<UserId, ParseError>`.
* `serde` with `derive` for wire types; `deny_unknown_fields` rejects a
  new field instead of defaulting it.

## 4. Collections and the standard library

* `Vec`, `HashMap`/`BTreeMap`, `HashSet`/`BTreeSet`, `VecDeque` cover most
  needs; `BTreeMap` when you need sorted order or a range.
* `HashMap` iteration order is unspecified and randomised per process.
* Unlike JavaScript's `Map`, it does not keep insertion order — sort the
  keys before you depend on the order.
* `map.entry(k)` looks up and inserts in one pass: `Vacant` gives an
  `Entry` to `insert` into, `Occupied` the value already there.
* `or_insert_with(|| ...)` computes the default lazily; `or_insert(x)` does
  not.
* `String` and `str` are UTF-8. `str::len()` counts bytes, not characters.

## 5. Iteration and laziness

* `Iterator` is lazy: `map` and `filter` do nothing until the chain is
  consumed by `collect`, `sum` or a `for` loop.
* `iter()` borrows, `iter_mut()` borrows mutably, `into_iter()` consumes the
  value.
* `filter_map` beats `filter(..).map(..)`: one pass, no `Option` left.
* `collect::<Result<Vec<_>, _>>()` stops at the first error;
  `collect::<Vec<_>>()` hands back a vector of `Result`s.
* `group_by` needs the input sorted by the key first — the
  `itertools.groupby` trap, and the reason a count comes out wrong.
* `rev` and `nth` need `DoubleEndedIterator`/`ExactSizeIterator`.

## 6. Errors and the Result type

* A library returns errors; it does not panic. Go returns the error as its
  last value and Java throws — Rust returns `Result`.
* `?` propagates and converts: the error type must implement `From` for the
  inner error, or `?` will not compile.
* `unwrap`/`expect` only where the invariant is written down:
  `expect("invariant: the file was created above")`.
* Never on a value from outside the program: a file, an argument, the
  network, the environment.
* A custom error implements `std::error::Error` — it needs `Debug` and
  `Display` — and returns the cause from `source()`. `thiserror` derives it.
* `unwrap_or` evaluates its default eagerly; `unwrap_or_else(|| ...)` does
  not. Match `io::ErrorKind`: `NotFound` is not `PermissionDenied`.

## 7. Resources

* `Drop` is the cleanup. A `File`, a `MutexGuard`, a socket all release on
  scope exit, including on an early return or a panic.
* There is no `finally`; `Drop` is the equivalent, and it runs while the
  panic unwinds. Code after a `panic!` in the same scope does not run.
* `Drop` cannot be async. If the cleanup must await, hand the future back
  to the caller instead of hiding it in a `Drop`.
* `mem::forget` leaks on purpose — only when another owner takes the
  resource. `ManuallyDrop` when you must bypass `Drop` deliberately.
* A `std::sync::MutexGuard` is not `Send`, and a guard held across an
  `.await` is a deadlock. See §11.

## 8. Files and paths

* `Path` and `PathBuf`, never a `String` path: `Path::join` and
  `PathBuf::push` build a path, `format!("{}/{}", dir, name)` does not.
* `Path::new` borrows, `PathBuf::from` owns. A function that only reads a
  path takes `&Path`.
* `fs::canonicalize` resolves symlinks and fails if the path does not
  exist. A path is not normalised: `a/./b` and `a/b` are different paths.
* Write atomically when a reader may see a partial file: write a temporary
  file in the same directory, then `fs::rename` over the target.
  `tempfile::NamedTempFile::persist` does this.
* Rust does not translate newlines: `writeln!` writes `\n` on every
  platform, and `lines()` strips a trailing `\r`.
* `std::env::temp_dir` is not a safe place for a secret file; the
  `tempfile` crate creates one with restrictive permissions.

## 9. The shell and the outside world

* `Command::new("prog").arg(x)` — an argument list, never a shell string.
  `Command` does not spawn a shell.
* Unlike Python's `subprocess.run(check=True)`, a non-zero exit is not an
  error: check `status.code()` yourself.
* On Windows a `.bat` or `.cmd` target still goes through `cmd.exe`. Do not
  hand untrusted input to one.
* `Command::output()` captures stdout and stderr; `Command::status()` lets
  the child inherit them. A child that fills the pipe buffer while you are
  not reading blocks forever.
* `std::process::exit` skips every `Drop` — the destructors do not run.
  Return an `ExitCode` from `main` instead.

## 10. Time and clocks

* `Instant` for a duration: it is monotonic, so a clock change cannot make
  it run backwards. `SystemTime` is for a wall-clock stamp.
* `Instant::now()` and `SystemTime::now()` are the only places that read the
  clock. Take "now" as a parameter so the code can be tested at a fixed
  moment.
* `Instant + Duration` panics on overflow; `checked_add` returns an
  `Option`.
* `Duration::from_secs`, `from_millis`, `as_millis` — integers, no float
  rounding. `as_secs_f64` loses precision on a long duration.
* `chrono` or `time` for calendar arithmetic, time zones and parsing. The
  standard library has no calendar.
* `std::thread::sleep` blocks the thread. Inside an async task it stalls
  the executor; use the runtime's timer.

## 11. Concurrency

* `Send` and `Sync` decide what may cross a thread boundary. `Rc<T>` is
  neither; `Arc<T>` is `Send + Sync` when `T` is.
* `Arc<Mutex<T>>` for shared mutable state across threads;
  `Rc<RefCell<T>>` for single-threaded shared state. A `RefCell` panics at
  runtime on a double borrow, where `&mut` would not compile.
* `Mutex::lock` returns a `Result` because of poisoning; `unwrap()` on it
  hides the poisoning, `unwrap_or_else(|e| e.into_inner())` keeps going
  deliberately.
* `std::thread::scope` (Rust 1.63) lets a scoped thread borrow data
  instead of requiring `move` and a `'static` clone.
* A `tokio::spawn`ed future must be `Send + 'static`: clone or `Arc` the
  data it needs. `spawn_local` and `LocalSet` exist for the `!Send` case.
* Never hold a `std::sync::MutexGuard` across an `.await`: the task that
  needs the lock can never run, and the program deadlocks.
  `cargo clippy -- -W clippy::await_holding_lock` reports it.
* A blocking call inside an async task stalls the whole executor. Use the
  async API (`tokio::fs`, `tokio::net`) or `spawn_blocking`.
* A channel's `recv` returns `Err` when the sender is dropped — that ends
  the loop. Dropping a `JoinHandle` detaches the task; `abort()` cancels it.

## 12. Testing

* `cargo test` runs the unit tests, the integration tests and the doctests.
  `#[cfg(test)] mod tests` inside the source file, integration tests in
  `tests/`.
* A shared helper goes in `tests/common/mod.rs`, not `tests/common.rs` — a
  `.rs` file directly in `tests/` is compiled as its own test binary.
* `#[should_panic(expected = "...")]` pins the message when the panic is
  the contract. A test that only says "it panicked" is too loose.
* `tempfile::tempdir()` for a temporary directory. A test that writes into
  the repository fails in someone else's checkout.
* Compare floats with an explicit epsilon. `a == b` on `f64` is wrong, and
  an exact equality assert on a computed value is a flaky test.
* `cargo test --release` when the test measures time; `cargo test -- --ignored`
  for the `#[ignore]`d ones, and `cargo test -- --nocapture` to see output.
* Property tests (`proptest`, `quickcheck`) for the invariants you cannot
  enumerate. No race detector ships with `cargo test`: use `loom`
  (third-party) or the nightly thread sanitizer.

## 13. The command line

* `clap` with the `derive` feature for a real CLI; `std::env::args` for a
  script with one flag.
* `std::env::args()` panics if any argument is not valid Unicode;
  `args_os()` does not. Use `args_os` when the arguments may be paths.
* `main` returns `ExitCode` (Rust 1.61 and later) or `Result<(), Box<dyn
  Error>>`. `std::process::exit` skips the destructors.
* Results go to stdout, diagnostics to stderr, one diagnostic per failure.
* Exit 0 for success and a documented non-zero for each failure mode, with
  the meaning of each code in `--help`.
* Offer `--json` for a machine consumer and keep the human output stable.
  The usage line names the real syntax, optional arguments included.

## 14. Performance

* `cargo build --release` before you measure: the debug profile keeps
  `debug_assertions` and `overflow-checks` on.
* `cargo bench` with `criterion` for a number you can compare. A benchmark
  with no baseline is an anecdote.
* Profile before you change: `cargo flamegraph` (third-party), `perf`, or
  `samply`. Optimise what the profile names.
* `sort_unstable_by_key` does not allocate the buffer `sort_by_key` needs,
  but it is not a stable sort — equal keys may move.
* A `clone()` in a loop is the usual cost. Borrow instead, or use `Cow`.
  Iterator chains usually compile to the same code as a hand-written loop:
  check the assembly before you rewrite one.
* `rayon` for data parallelism; `#[inline]` only with a measurement behind
  it. A release build wraps on integer overflow — `checked_add` and
  `saturating_add` where the wrap would be wrong.

## 15. Style, naming and docstrings

* `snake_case` for functions, variables and modules; `CamelCase` for types
  and traits; `SCREAMING_SNAKE_CASE` for `const` and `static`.
* `rustfmt` is the format of record: `cargo fmt` to write, `cargo fmt
  --check` to verify. A formatted diff is not a style debate.
* `clippy` is the lint of record: `cargo clippy --all-targets -- -D
  warnings`.
* `///` is the doc comment and it is the published documentation; `//!` is
  the module documentation. `#![warn(missing_docs)]` for a library crate.
* A doc comment says what the caller must know: the contract, the failure
  modes, the panics. A doctest inside it is a test that `cargo test` runs.
* A comment explains why; the code says what. `#[allow(...)]` needs a
  reason — `#[allow(dead_code)]` hides an unfinished feature.

## 16. Dependencies and environments

* `Cargo.toml` holds `[dependencies]`, `[dev-dependencies]` and
  `[build-dependencies]`. `Cargo.lock` holds the resolved versions.
* Commit `Cargo.lock` for a binary; do not commit it for a library. Use
  `cargo build --locked` in CI so the lock file is honoured.
* `rust-version` in `Cargo.toml` is the floor you promise. A dependency
  with a higher floor raises yours — check the dependency's own metadata.
* Features are additive: a dependent cannot switch a dependency's feature
  off. `cargo tree -e features` shows what is enabled, `cargo tree -d` shows
  the duplicates.
* `cargo update -p <crate> --precise <version>` for a targeted bump, and
  read the `Cargo.lock` diff before you keep it. `cargo audit` and
  `cargo deny` (third-party) cover advisories and licences.

## 17. Logging and diagnostics

* `tracing` for structured events and spans, `tracing-subscriber` for the
  subscriber. `log` only when you must interop with a crate that uses it.
* `tracing::info!(user_id = %id, "loaded user")` — the fields are
  structured, so a machine can read them as well as a human.
* A library logs; a binary prints. `println!` in a library takes over the
  caller's terminal.
* Levels mean something: `error` — someone must act; `warn` — a tolerated
  surprise; `info` — the milestones; `debug` — the noise.
* `#[instrument]` records the arguments of a function; `skip` the ones that
  are large or sensitive. Implement `Debug` by hand for a type that holds a
  secret — the derived one prints it into the log.
* `RUST_LOG` with `EnvFilter` sets the level. Never configure a subscriber
  inside a library.

## 18. Security

* `unsafe` needs a `// SAFETY:` comment saying why the operation is sound.
  `#![forbid(unsafe_code)]` where it is not needed (Rust 1.52).
* `cargo +nightly miri test` checks a crate's `unsafe` code for undefined
  behaviour at runtime. `unsafe impl Send`/`Sync` is a safety claim about
  your type — justify it in a comment.
* Integer overflow wraps in release. Use `checked_*` where it matters, or
  set `overflow-checks = true` in the release profile.
* `as` truncates silently: `u32 as u8` drops the high bytes, `i32 as u32`
  reinterprets the sign. `TryFrom` refuses instead.
* Secrets come from the environment or a secret store, never from a default
  value that hides a missing configuration. `getrandom` or `rand`'s `OsRng`
  for a token — never the general PRNG.
* `Command` with an argument list; never build a shell string. Normalise a
  path from outside and check it stays under the root: `canonicalize` it,
  then `starts_with`.
* Compare a secret in constant time (`subtle::ConstantTimeEq`); `==` on
  bytes leaks the length and the first difference. There is no `eval`
  equivalent: parse the data.

## 19. The common traps

A checklist, not a style guide — each line is a bug that has shipped:

* `unwrap()` or `expect()` on a value from outside the program.
* `panic!`, `todo!()` or `unimplemented!()` left in a library.
* `Rc`/`RefCell` shared across threads — the fix is `Arc`/`Mutex`.
* A lock guard held across an `.await`.
* A blocking call inside an async task, stalling the executor.
* A `clone()` added to escape the borrow checker — use `mem::take`.
* `unwrap_or(expensive())` — the default runs on the hit path too.
* `str::len()` counts bytes; it was read as characters.
* `HashMap` iteration order assumed to be stable.
* An `as` cast that truncates a value that did not fit.
* Integer overflow in a release build.
* `std::env::args()` panicking on a non-UTF-8 argument.
* `std::process::exit()` skipping every `Drop`.
* `println!` in library code; `unsafe` with no `// SAFETY:` comment.
* A `Box<dyn Error>` without `Send + Sync` crossing a thread.
* `v[i]` on a `Vec` and a `String` sliced mid-character — both panic.
* `Cargo.lock` committed for a library, or missing for a binary.
