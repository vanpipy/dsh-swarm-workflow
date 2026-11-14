# The cleanup of the lab's testing resources (2026-11-07)

The user asked for the testing resources and processes to be cleaned. This is
what was kept, what went, and why.

## Kept, and why

| What | Where | Why |
|---|---|---|
| The ledger | `D:\project\.swarm-lab\rounds` (its own git repo) | The record of every run: the findings, the verdicts, the measurement, the review reports |
| The first worktree | `D:\project\.swarm-lab\head_tree` (`swarm/lab10`, 7 commits) | Unmerged work: the empty-day-file guard and the catalog-shrink guard |
| The second worktree | `D:\project\.swarm-lab\head_tree2` (`swarm/lab11`, 12 commits) | Unmerged work: the profile refusal and the quiet/broken feed verdict |
| The proof substrate | `D:\project\.swarm-lab\eff-repo` | The toy package the phase-3 proof round used; the user committed it deliberately |
| The recovered originals | `policy_hit_1.txt`, `user_skill_paste.md` | The byte-exact baseline the plugin's integrity diffs are measured against |
| The tools | `tools/` (21 files) | The render test, the integrity checker, the session-log decoder, the mutation and citation checkers - the things that proved the work and can prove it again |
| The raw measurement | `measurement/` (8 files) | The `.jsonl` output behind the 731 agent calls against ≈431 Coordinator calls |
| The provenance | `provenance-user-turns.md` | The five user turns the design review cites, taken from the decoded session log before the log was deleted |

## Deleted

- **177 duplicate policy extracts** (`policy_hit_2.txt` … `policy_hit_187.txt`) - the same text extracted again and again while the baseline was being established. Only `policy_hit_1.txt` is the baseline.
- **The decoded session logs**: `fork2_log.txt` (13 MB), `session_log.txt` (7 MB), `auditor_log.txt` (1 MB), `p1-session.log` (1 MB). The host's session store holds the authoritative copies; the excerpt the ledger cites was kept as `provenance-user-turns.md`.
- **The scratch**: `proof-scratch/` (the mutation copies, the rendered prompts, the one-off scripts), `eff/` (after its tools and measurement were kept), and the disposable fixtures `lab-repo`, `probe`, `failure-probe`, `revert-probe`, `data`, `data-b`, `data-e`, `data-h`, `data-m`.
- **About 230 one-off files** at the lab root - the stub feeds and their server, the extraction and forensics scripts, and the captured outputs of every ad-hoc run.
- **The caches** in both worktrees (`__pycache__`, `.pytest_cache`, `.ruff_cache`, the built `site/`, the regenerated `nav.yml`). Both worktrees are clean with no ignored artefacts left.

27.2 MB freed; the lab now holds four directories and five files.

## The processes

Every background job of the session is **completed** - none was running, so
none had to be killed. The only live processes on the host are two `python.exe`
started at 20:18:50: they are the user's **own marker-pdf conversion**
(`marker_single.exe D:\project\papers\origins\2608.15591.pdf`), not a test run.
They were left alone: the repository's guide says the conversion runs one paper
at a time and must finish.

The host's own spill directories (`%TEMP%\dsh-spill-*`, 0.1-5.6 MB) belong to
the host's spill store, not to the lab, and were left in place.

## Not touched

- `D:\project\reading-collector` and `D:\project\papers` - the user's own
  repositories and workspaces. The source repo is clean; its caches are its own.
- The profile: only `@local/swarm-workflow` is installed, as a junction to
  `D:\project\dsh-plugins\swarm-workflow`.
