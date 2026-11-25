# =============================================================================
# check-policy-sync.ps1 - the drift guard between the shipped bundle and the
# canonical repository.
#
# WHAT IT COMPARES
#   The bundle ships three policy files (prompt-overlay.md, swarm-prompt.md,
#   skills/swarm-engineering/swarm-engineering.md) that are the user's own text,
#   adapted to this host.  The canonical repository holds the source text.  The
#   bundle's own adaptation record - docs/host-adaptation.json - names every
#   adapted section, with the hash of both sides, the reason, and the host
#   surfaces the passage names.
#
#   The policy comparison runs section by section:
#     * a section nobody adapted must be byte-identical to the canonical;
#     * an adapted section must be listed in the record, with both hashes, a
#       reason, and the surfaces it names;
#     * a section the record lists must still carry the recorded hash;
#     * a heading the record cannot map (a rename with no canonicalHeading) is
#       a structural difference and is refused.
#
#   The nine craft files are the same text by contract: the canonical is a PORT
#   of the bundle.  The port's rules are LITERALS IN THIS SCRIPT - see the rule
#   tables below - transcribed from the port decision and the port scripts.
#   This script reads no file outside the bundle and the canonical repository.
#
# THE CANONICAL REVISION
#   The record pins the canonical revision (canonicalCommit).  The canonical
#   side is read at that revision with `git show <commit>:<path>`, never from a
#   working tree that may have moved.  The canonical's actual HEAD is reported
#   separately, and a HEAD that no longer matches the pin is a distinct failing
#   state.
#
#   The canonical's WORKING TREE is a second, separate state.  It is read with
#   `git status --porcelain` and, for the files this guard compares, by reading
#   the working-tree copy and comparing it with the pinned blob.  A working tree
#   that has moved away from the pin is a distinct failing state ("the canonical
#   working tree"): it is never folded into the comparison and never a silent
#   pass.
#
# THE OUTCOME KINDS
#   PASS   a comparison was made and it agreed.
#   FAIL   a comparison was made and it disagreed, or a file could not be read.
#   GAP    a comparison could not be made and what is at fault is not the
#          bundle's own file.
#   SKIP   the comparison was not needed in this mode.
#   BLOCK  the comparison was needed and could not be made.  It is counted under
#          `skipped` - never under `passed` - and it makes the run not clean.
#
# MODES
#   Check   (default) - the full check: the record, the bundle's sections, the
#                       canonical's sections at the pinned revision, and the nine
#                       craft pairs.
#   Self             - the bundle-local half only: the record against the
#                       bundle's own text.  It needs no canonical repository; the
#                       canonical half is reported as SKIPPED, never as passed.
#   Refresh          - rewrite the record from the current tree.  The Lead's
#                       tool: it keeps the reasons that are already written, so
#                       a refresh never launders an unreviewed change into the
#                       record.
#   Emit             - print the derived surfaces column, so the record can be
#                       written from the text instead of by hand.
#
# PATHS
#   Everything is derived from this script's own location ($PSScriptRoot), so a
#   copy of the bundle runs the same guard.  The canonical repository comes from
#   -Canonical, else $env:SWARM_POLICY_CANONICAL, else the record's
#   canonicalRepo, else the built-in default.
#
# EXIT CODE
#   0  every comparison clean: nothing failed and nothing was left uncompared
#   1  at least one drift, failure, gap, or a comparison that could not be made
#   2  the guard could not run: the bundle tree is not there
# =============================================================================

[CmdletBinding()]
param(
  # The bundle root.  Defaults to the directory that holds this script's
  # parent - i.e. the repository this file lives in.
  [string]$Bundle,
  # The canonical repository.  Defaults to $env:SWARM_POLICY_CANONICAL, else the
  # record's canonicalRepo, else the built-in default.
  [string]$Canonical,
  [ValidateSet('Check', 'Self', 'Refresh', 'Emit')]
  [string]$Mode = 'Check',
  # Emit mode only: where to write the derived surfaces as JSON.
  [string]$OutFile
)

$ErrorActionPreference = 'Stop'

$script:pass = 0
$script:fail = 0
$script:gap  = 0
$script:skip = 0
$script:blocked = 0

# --------------------------------------------------------------- where I am

$script:ToolDir = $PSScriptRoot
if (-not $script:ToolDir) { $script:ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$script:BundleRoot = (Split-Path -Parent $script:ToolDir).TrimEnd('\', '/')
if (-not $Bundle) { $Bundle = $script:BundleRoot }

# There is nothing to check without the bundle tree: that is the documented
# "the guard could not run" case, and it is not a drift verdict.
if (-not (Test-Path -LiteralPath $Bundle)) {
  "POLICY DRIFT CHECK: mode $Mode | bundle $Bundle | canonical (not resolved) | record (not resolved)"
  "RESULT: NOT CLEAN - the guard could not run: the bundle tree is not there: $Bundle"
  exit 2
}

$canonicalSource = 'the -Canonical parameter'
if (-not $Canonical) {
  $Canonical = ''
  if ($env:SWARM_POLICY_CANONICAL) {
    $Canonical = $env:SWARM_POLICY_CANONICAL
    $canonicalSource = '$env:SWARM_POLICY_CANONICAL'
  }
}

# ---------------------------------------------------------------- house helpers

function Read-Bytes([string]$p) { [System.IO.File]::ReadAllBytes($p) }

function Read-Text([string]$p) {
  $bytes = [System.IO.File]::ReadAllBytes($p)
  # strict UTF-8: a file that is not valid UTF-8 is drift, not mojibake to shrug at
  return (New-Object System.Text.UTF8Encoding($false, $true)).GetString($bytes)
}

function Sha256([byte[]]$b) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([System.BitConverter]::ToString($sha.ComputeHash($b))).Replace('-', '') }
  finally { $sha.Dispose() }
}

function Norm([string]$t) { ($t -replace '\s+', ' ').Trim() }

function Check([string]$name, [bool]$ok, [string]$detail = '') {
  if ($ok) { $script:pass++; "  PASS  $name" }
  else { $script:fail++; "  FAIL  $name  $detail" }
}

function Gap([string]$name, [string]$reason) {
  $script:gap++
  "  GAP   $name  $reason"
}

function Skip([string]$name, [string]$reason) {
  $script:skip++
  "  SKIP  $name  $reason"
}

# A comparison that was needed and could not be made.  It is counted under
# `skipped` - never under `passed` - and it makes the run not clean.
function Block([string]$name, [string]$reason) {
  $script:skip++
  $script:blocked++
  "  BLOCK $name  $reason"
}

# --------------------------------------------------------------------- git

function Quote-Arg([string]$a) {
  if ($a -match '[\s"]') { return '"' + ($a -replace '"', '\"') + '"' }
  return $a
}

# Runs git and captures stdout as UTF-8 text.  `git show` writes the blob as
# it is stored, so the text this returns is the committed content, byte for
# byte, with no CRLF translation.
function Invoke-Git([string[]]$gitArgs) {
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'git'
  $psi.Arguments = (($gitArgs | ForEach-Object { Quote-Arg $_ }) -join ' ')
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
  $p = [System.Diagnostics.Process]::Start($psi)
  $out = $p.StandardOutput.ReadToEnd()
  $err = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  return @{ Exit = $p.ExitCode; Out = $out; Err = $err }
}

function Get-CanonicalHead([string]$repo) {
  $g = Invoke-Git @('-C', $repo, 'rev-parse', 'HEAD')
  if ($g.Exit -ne 0) { return $null }
  return $g.Out.Trim()
}

function Get-CanonicalBlob([string]$repo, [string]$commit, [string]$repoPath) {
  $g = Invoke-Git @('-C', $repo, 'show', "$commit`:$repoPath")
  if ($g.Exit -ne 0) { return $null }
  return $g.Out
}

# ------------------------------------------------------------------ sections

# A section starts at an ATX heading and runs to the next heading.  A line
# inside a fenced code block that looks like a heading is not one.
function Split-Sections([string]$text) {
  $t = $text -replace "`r`n", "`n"
  $lines = $t.Split("`n")
  $sections = [ordered]@{}
  $key = '(preamble)'
  $buf = New-Object System.Collections.Generic.List[string]
  $inFence = $false
  $dupes = 0
  foreach ($line in $lines) {
    if ($line -match '^\s*(```|~~~)') { $inFence = -not $inFence }
    if (-not $inFence -and $line -match '^(#{1,6})\s+(.+?)\s*$') {
      $sections[$key] = ($buf -join "`n")
      $buf = New-Object System.Collections.Generic.List[string]
      $key = $Matches[2]
      if ($sections.Contains($key)) { $dupes++; $key = "$key ($dupes)" }
    }
    $buf.Add($line)
  }
  $sections[$key] = ($buf -join "`n")
  return $sections
}

# The hash covers the section text (heading included) with the line endings and
# the trailing whitespace normalised away, so a CRLF checkout does not read as
# a change.
function Section-Hash([string]$text) {
  $t = ($text -replace "`r`n", "`n")
  $lines = @($t.Split("`n") | ForEach-Object { $_.TrimEnd() })
  $joined = (($lines -join "`n").Trim())
  return Sha256 ([System.Text.Encoding]::UTF8.GetBytes($joined))
}

# ------------------------------------------------------------------ frontmatter

# The craft files carry a YAML frontmatter.  The bundle's has a `whenToUse`
# line, the canonical's does not: the port folds the two into one description
# (D-C2).  Only the three keys this script needs are read.
function Split-Fm([string]$text) {
  $t = $text -replace "`r`n", "`n"
  $lines = $t.Split([string[]]@("`n"), [System.StringSplitOptions]::None)
  if ($lines[0].Trim() -ne '---') { throw 'no frontmatter start' }
  $close = -1
  for ($i = 1; $i -lt $lines.Length; $i++) { if ($lines[$i].Trim() -eq '---') { $close = $i; break } }
  if ($close -lt 0) { throw 'no frontmatter end' }
  $map = @{}
  foreach ($l in $lines[1..($close - 1)]) {
    if ($l.StartsWith('name: '))          { $map['name'] = $l.Substring(5) }
    elseif ($l.StartsWith('description: ')) { $map['description'] = $l.Substring(13) }
    elseif ($l.StartsWith('whenToUse: '))   { $map['whenToUse'] = $l.Substring(11) }
  }
  $body = ''
  if ($close + 1 -lt $lines.Length) { $body = ($lines[($close + 1)..($lines.Length - 1)]) -join "`n" }
  return @{ Fm = $map; Body = $body }
}

# =============================================================================
# THE HOST SURFACE VOCABULARY
#
# The `surfaces` column of the record is defined as "the host surfaces the
# passage names".  These are the names this host's surfaces have - the list
# the bundle's runtime-note.md gives, plus the surfaces the record itself
# names.  The list is a literal here: this script does not read runtime-note.md
# at run time, so a copy of the bundle needs nothing else on disk.
#
# A name is "named by" a passage when it appears there as a whole word.  A name
# with an underscore is distinctive enough to match bare; a single word is only
# counted when it is written as a code span, so ordinary prose ("the skill",
# "a read of the diff") is never mistaken for a surface.
# =============================================================================

$script:HostSurfaces = @(
  'acp_cache', 'acp_status', 'ask_user_question', 'compress', 'create_goal',
  'decompress', 'edit', 'exit_plan_mode', 'get_goal', 'glob', 'grep',
  'interrupt_agent', 'job_kill', 'job_list', 'job_output', 'list_agents',
  'load_workspace_dependencies', 'present', 'pwsh', 'read', 'schedule_create',
  'schedule_delete', 'schedule_list', 'schedule_update', 'search_context',
  'send_message', 'skill', 'spawn_teammate', 'subagent', 'subagent_fork',
  'swarm_child', 'swarm_task', 'swarm_worktree', 'team_task_create',
  'team_task_get', 'team_task_list', 'team_task_update', 'todo_write',
  'update_goal', 'wait_agent', 'web_fetch', 'web_search', 'workflow', 'write'
)

function Names-Surface([string]$text, [string]$name) {
  if (-not $text) { return $false }
  if ($name -match '_') {
    return ($text -cmatch "(?<![A-Za-z0-9_])$([regex]::Escape($name))(?![A-Za-z0-9_])")
  }
  return $text.Contains('`' + $name + '`')
}

function Find-Surfaces([string]$text) {
  $found = New-Object System.Collections.Generic.List[string]
  foreach ($s in $script:HostSurfaces) {
    if (Names-Surface $text $s) { $found.Add($s) }
  }
  return $found.ToArray()
}

# =============================================================================
# THE DOCUMENTED PORT TRANSFORMATION, applied to the BUNDLE side.
#
# The rules below are LITERALS IN THIS SCRIPT.  They were transcribed from the
# port decision (D-C1 through D-C7 - those are the port's own decision ids, not
# repair ids in the tables below) and from the port scripts that produced the
# canonical craft skills; this script does not read those files - they live
# outside the bundle, and a copy of the bundle must still run.
#
#   * the frontmatter is folded: the bundle's `description:` and `whenToUse:`
#     become one `description:` (D-C2), with one documented exception;
#   * the body's file references are rewritten to Skill names (D-C3);
#   * the core craft file carries its own repairs (R-A, R-B, R-C, R-D, R-F, R-G,
#     R-H, R-I, R-J - the ids are not consecutive, and every id this script names
#     exists in the tables below);
#   * the tester craft file names the process skill once;
#   * a Skill reference that opens a sentence is capitalised;
#   * four of the bundle's craft files carry wording the canonical does not:
#     the core file's section 4 (R-I, R-J), the Rust copy's example (L-01), the
#     Go copy's section sign (L-02) and the TypeScript copy's section 0 (L-03).
#     Each of those rules maps the bundle's wording back to the canonical's, so
#     the comparison still works.
#
# A new rule for a deliberate change is a 'from' -> 'to' pair in one of the
# tables below, in the shape the table already uses.  The pair maps the BUNDLE
# text back to the CANONICAL text, so the comparison still works.
# =============================================================================

# (1) path -> Skill name.  Inline code spans: never split across a line.
$PathRules = @(
  @{ id = 'p01'; from = '`../shared.md`';           to = 'the `swarm-craft-shared` Skill' }
  @{ id = 'p02'; from = '`languages/python.md`';     to = 'the `swarm-craft-python` Skill' }
  @{ id = 'p03'; from = '`languages/java.md`';       to = 'the `swarm-craft-java` Skill' }
  @{ id = 'p04'; from = '`languages/go.md`';         to = 'the `swarm-craft-go` Skill' }
  @{ id = 'p05'; from = '`languages/typescript.md`'; to = 'the `swarm-craft-typescript` Skill' }
  @{ id = 'p06'; from = '`languages/rust.md`';       to = 'the `swarm-craft-rust` Skill' }
  @{ id = 'p07'; from = '`languages/<language>.md`'; to = 'the `swarm-craft-<language>` Skill' }
  @{ id = 'p08'; from = '`shared.md`';               to = 'the `swarm-craft-shared` Skill' }
  @{ id = 'p09'; from = '`developer.md`';            to = 'the `swarm-craft-developer` Skill' }
  @{ id = 'p10'; from = '`tester.md`';               to = 'the `swarm-craft-tester` Skill' }
  @{ id = 'p11'; from = '`reviewer.md`';             to = 'the `swarm-craft-reviewer` Skill' }
)

# (2) "file" -> "Skill" wording.  Regexes, because the port's source text is
#     hard-wrapped and a phrase can straddle a line break.  The case of the
#     matched text is preserved, so a phrase that opened a sentence keeps its
#     capital (the port's deviation 1).
$PhraseRules = @(
  @{ id = 'h01'; rx = 'the\s+language\s+file\s+for\s+the\s+language\s+in\s+play\s+sits\s+under\s+`languages/`'; to = 'the language Skill for the language in play' }
  @{ id = 'h02'; rx = 'the\s+language\s+file\s+under\s+`languages/`';                to = 'the language Skill' }
  @{ id = 'h03'; rx = 'under\s+`languages/`';                                       to = 'as its own Skill' }
  @{ id = 'h04'; rx = 'one\s+file\s+per\s+language';                                to = 'one Skill per language' }
  @{ id = 'h05'; rx = 'the\s+language\s+files\s+that\s+ship\s+with\s+this\s+bundle'; to = 'the language Skills that ship with this set' }
  @{ id = 'h06'; rx = 'beside\s+this\s+file';                                       to = 'a sibling Skill' }
  @{ id = 'h07'; rx = 'this\s+directory';                                            to = 'this craft set'; case = 'preserve' }
  @{ id = 'h08'; rx = 'this\s+bundle';                                               to = 'this set'; case = 'preserve' }
  @{ id = 'h09'; rx = 'this\s+file';                                                 to = 'this Skill'; case = 'preserve' }
  @{ id = 'h10'; rx = 'any\s+of\s+these\s+files';                                    to = 'any of these Skills' }
  @{ id = 'h11'; rx = 'the\s+shared\s+file';                                         to = 'the `swarm-craft-shared` Skill' }
  @{ id = 'h12'; rx = 'the\s+language\s+file';                                       to = 'the language Skill' }
  @{ id = 'h13'; rx = 'its\s+own\s+file';                                            to = 'its own Skill' }
  @{ id = 'h14'; rx = "that\s+file's";                                               to = "that Skill's" }
)

# (3) the core craft file's own repairs.
$SharedRepairs = @(
  @{ id = 'R-A'; kind = 'lit'; from = '| File | What it is |'; to = '| Skill | What it is |' }
  @{ id = 'R-B'; kind = 'rx';  rx = 'The\s+language-specific\s+pieces\s+live\s+(under\s+`languages/`|as\s+its\s+own\s+Skill),\s+so\s+that\s+a\s+language\s+can\s+grow\s+without\s+this\s+(file|Skill)\s+growing\s+with\s+it\.'; to = 'The language-specific pieces are separate Skills, one per language, so that a language can be loaded on its own and grow without this Skill growing with it.' }
  @{ id = 'R-C'; kind = 'rx';  rx = 'A\s+brief\s+names\s+the\s+file\s+and\s+the\s+piece:'; to = 'A brief names the Skill and the piece:' }
  @{ id = 'R-D'; kind = 'rx';  rx = 'the\s+first\s+language\s+file\s+covered'; to = 'the first language Skill covered' }
  @{ id = 'R-F'; kind = 'rx';  rx = 'the\s+language\s+file\s+for\s+the\s+language\s+in\s+play\s+has\s+the\s+rest'; to = 'the language Skill for the language in play has the rest' }
  @{ id = 'R-G'; kind = 'rx';  rx = 'A\s+language\s+that\s+deserves\s+its\s+own\s+(file|Skill)\s+gets\s+one,\s+as\s+its\s+own\s+Skill\.'; to = 'A language that deserves its own Skill gets one.' }
  @{ id = 'R-H'; kind = 'rx';  rx = 'That\s+is\s+the\s+file\s+named\s+after\s+the\s+role\.'; to = 'That is the Skill named after the role.' }
  # R-I and R-J: section 4 of the core craft file.  The bundle now says WHERE
  #     the language pieces live; the canonical says WHICH pieces to read when
  #     the repository is not Python.  The bundle also carries one sentence that
  #     is true only in the bundle - the stack paragraphs follow in the same
  #     file - and that the canonical, where every stack is its own Skill, does
  #     not have.  Both rules map the bundle's wording back to the canonical's,
  #     so the comparison still works.  The non-ASCII characters are written as
  #     \uXXXX escapes: this script is read by Windows PowerShell, which would
  #     otherwise decode them wrongly.
  @{ id = 'R-I'; kind = 'rx'; rx = 'The\s+pieces\s+for\s+the\s+language\s+in\s+play\s+live\s+in\s+that\s+language''s\s+own\s+file\s+(?:under\s+`languages/`|as\s+its\s+own\s+Skill)\s+\u2014\s+read\s+the\s+one\s+that\s+matches\s+the\s+repository\s+you\s+are\s+working\s+in\.'; to = 'When the repository is not Python, these are the pieces to read.' }
  @{ id = 'R-J'; kind = 'rx'; rx = '\s*The\s+paragraphs\s+below\s+carry\s+the\s+same\s+ground\s+in\s+brief,\s+for\s+the\s+stacks\s+they\s+name\.'; to = '' }
)

# (4) the one place the port named the process skill where the source said
#     "the skill".  Only the tester craft file says it.
$TesterRepair = @(
  @{ id = 'T-01'; kind = 'lit'; from = 'The skill owns the **process**'; to = 'The `swarm-engineering` skill owns the **process**' }
)

# (4b) the language craft files' own repairs.  Three of the bundle's language
#     copies carry a wording the canonical does not: the Rust copy names a
#     piece in its example, the Go copy writes the section sign where the
#     canonical writes the section out, and the TypeScript copy of section 0
#     carries the "A brief names the piece" clause and the long closing
#     sentence where the canonical writes a colon and a shorter sentence.
#     All three map the bundle's wording back to the canonical's.
$LanguageRepairs = @(
  @{ id = 'L-01'; kind = 'rx'; rx = '\s*A\s+brief\s+names\s+the\s+piece:\s*"read\s+\u00A76\s+of\s+the\s+Rust\s+craft\s+before\s+you\s+touch\s+the\s+error\s+handling"\.'; to = '' }
  @{ id = 'L-02'; kind = 'rx'; rx = 'read\s+\u00A76\s+of\s+the\s+Go\s+craft'; to = 'read section 6 of the Go craft' }
  @{ id = 'L-03'; kind = 'rx'; rx = 'before\s+you\s+change\s+it\.\s+A\s+brief\s+names\s+the\s+piece:\s*"read\s+\u00A76\s+of\s+the\s+TypeScript\s+craft\s+before\s+you\s+touch\s+the\s+error\s+handling"\.\s*Everything\s+here\s+is\s+checkable\s+\u2014\s+if\s+a\s+rule\s+cannot\s+be\s+checked,\s+treat\s+it\s+as\s+advice\s+rather\s+than\s+guidance\.'; to = "before you change it: `"read $([char]0x00A7)6 of the TypeScript craft before you touch the error handling`". Everything here is checkable $([char]0x2014) a rule that cannot be checked is advice, not guidance." }
)

# (5) D-C2's one documented exception to the frontmatter fold: the core craft
#     file's description says "the role Skills apply" where the bundle says
#     "the role files apply".
$DescriptionException = @(
  @{ id = 'D-C2-exception'; kind = 'lit'; from = 'the core the role files apply'; to = 'the core the role Skills apply' }
)

# A heading's number: "2.2.2 Tool-Call Budgets" -> "2.2.2", "14. The
# Verification Paths This Host Offers" -> "14", "(preamble)" -> "".  It is how a
# renamed heading is matched to its canonical counterpart: the number and the
# level are stable across the two trees, the wording is not.
function Get-HeadingNumber([string]$heading) {
  if ($heading -match '^([0-9]+(?:\.[0-9]+)*)\.?\s') { return $Matches[1] }
  return ''
}

# The bundle's heading for a canonical heading.  The record's own entry wins
# when it names a heading the bundle has; otherwise the canonical heading is
# looked up as it stands, and failing that the bundle's heading with the same
# number - a rename keeps the number and the level and changes the wording.
# $null means the canonical section has no counterpart in the bundle.
function Resolve-BundleKey([string]$canonicalKey, $entry, $bSections) {
  if ($entry) {
    $h = [string]$entry.heading
    if ($bSections.Contains($h)) { return $h }
  }
  if ($bSections.Contains($canonicalKey)) { return $canonicalKey }
  $num = Get-HeadingNumber $canonicalKey
  if ($num) {
    foreach ($bk in @($bSections.Keys)) {
      if ((Get-HeadingNumber $bk) -eq $num) { return $bk }
    }
  }
  return $null
}

function Apply-PathRules([string]$text, $rules) {
  foreach ($r in $rules) { $text = $text.Replace($r.from, $r.to) }
  return $text
}

function Apply-PhraseRules([string]$text, $rules) {
  foreach ($r in $rules) {
    $rx = New-Object System.Text.RegularExpressions.Regex($r.rx, 'IgnoreCase')
    $text = $rx.Replace($text, [System.Text.RegularExpressions.MatchEvaluator]{
      param($m)
      $to = $r.to
      # case of the matched text is preserved: a phrase that opened a sentence stays capitalised
      if ($m.Value.Length -gt 0 -and [char]::IsUpper($m.Value[0])) {
        $to = $to.Substring(0, 1).ToUpper() + $to.Substring(1)
      }
      return $to
    })
  }
  return $text
}

function Apply-LitRxRules([string]$text, $rules) {
  foreach ($r in $rules) {
    if ($r.kind -eq 'rx') {
      $rx = New-Object System.Text.RegularExpressions.Regex($r.rx)
      $text = $rx.Replace($text, $r.to)
    } else {
      $text = $text.Replace($r.from, $r.to)
    }
  }
  return $text
}

# (6) "a sentence that opened with the name of a file now opens with a capital"
#     (the port's deviation 1).  A Skill reference that opens a sentence is
#     capitalised; one that sits mid-sentence is not.
function Capitalise-SentenceStart([string]$text) {
  $rx = New-Object System.Text.RegularExpressions.Regex('the `swarm-craft-[a-z<>+-]+` Skill')
  return $rx.Replace($text, [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    $pre = $text.Substring(0, $m.Index)
    $j = $pre.Length - 1
    while ($j -ge 0 -and [char]::IsWhiteSpace($pre[$j])) { $j-- }
    $isStart = $false
    if ($j -lt 0) { $isStart = $true }                       # start of the body
    elseif ('.!?:'.Contains($pre[$j])) { $isStart = $true }   # after a sentence end
    elseif ($pre[$j] -eq "`n") {                              # start of a line
      $k = $pre.LastIndexOf("`n", $j - 1)
      if ($k -lt 0 -or $pre.Substring($k + 1, $j - $k - 1).Trim() -eq '') { $isStart = $true }
    }
    if ($isStart) { return 'The' + $m.Value.Substring(3) }
    return $m.Value
  })
}

# The whole documented transformation, for one craft pair.
function Port-Body([string]$body, [string]$kind) {
  $t = Apply-PathRules  $body $PathRules
  $t = Apply-PhraseRules $t $PhraseRules
  if ($kind -eq 'shared') { $t = Apply-LitRxRules $t $SharedRepairs }
  if ($kind -eq 'tester') { $t = Apply-LitRxRules $t $TesterRepair }
  if ($kind -eq 'language') { $t = Apply-LitRxRules $t $LanguageRepairs }
  $t = Capitalise-SentenceStart $t
  return $t
}

# --------------------------------------------------------------------- the pairs

$PolicyPairs = @(
  @{ Label = 'prompt-overlay.md';       BundleRel = 'prompt-overlay.md';                             ConfigRel = 'prompt-overlay.md' }
  @{ Label = 'swarm-prompt.md';         BundleRel = 'swarm-prompt.md';                               ConfigRel = 'swarm-prompt.md' }
  @{ Label = 'swarm-engineering skill'; BundleRel = 'skills/swarm-engineering/swarm-engineering.md'; ConfigRel = 'skills/swarm-engineering/SKILL.md' }
)

$CraftPairs = @(
  @{ Skill = 'swarm-craft-shared';     BundleRel = 'skills/swarm-engineering/shared.md';            Kind = 'shared' }
  @{ Skill = 'swarm-craft-developer';  BundleRel = 'skills/swarm-engineering/developer.md';         Kind = 'developer' }
  @{ Skill = 'swarm-craft-tester';     BundleRel = 'skills/swarm-engineering/tester.md';            Kind = 'tester' }
  @{ Skill = 'swarm-craft-reviewer';   BundleRel = 'skills/swarm-engineering/reviewer.md';          Kind = 'reviewer' }
  @{ Skill = 'swarm-craft-python';     BundleRel = 'skills/swarm-engineering/languages/python.md';  Kind = 'language' }
  @{ Skill = 'swarm-craft-java';       BundleRel = 'skills/swarm-engineering/languages/java.md';    Kind = 'language' }
  @{ Skill = 'swarm-craft-go';         BundleRel = 'skills/swarm-engineering/languages/go.md';      Kind = 'language' }
  @{ Skill = 'swarm-craft-typescript'; BundleRel = 'skills/swarm-engineering/languages/typescript.md'; Kind = 'language' }
  @{ Skill = 'swarm-craft-rust';       BundleRel = 'skills/swarm-engineering/languages/rust.md';    Kind = 'language' }
)

function Show-TokenDiff([string]$aNorm, [string]$bNorm, [string]$aLabel, [string]$bLabel) {
  $aw = $aNorm -split ' '
  $bw = $bNorm -split ' '
  $n = [Math]::Min($aw.Count, $bw.Count)
  for ($i = 0; $i -lt $n; $i++) {
    if ($aw[$i] -cne $bw[$i]) {
      $from = [Math]::Max(0, $i - 6)
      $aCtx = ($aw[$from..([Math]::Min($aw.Count - 1, $i + 6))] -join ' ')
      $bCtx = ($bw[$from..([Math]::Min($bw.Count - 1, $i + 6))] -join ' ')
      "      first difference at word $i of $($aw.Count)/$($bw.Count)"
      "        $aLabel : ...$aCtx..."
      "        $bLabel : ...$bCtx..."
      return
    }
  }
  if ($aw.Count -ne $bw.Count) {
    "      the two sides differ in length only: $($aw.Count) vs $($bw.Count) words"
    if ($aw.Count -gt $n) { "        $aLabel : ..." + (($aw[$n..($aw.Count - 1)] | Select-Object -First 20) -join ' ') + '...' }
    if ($bw.Count -gt $n) { "        $bLabel : ..." + (($bw[$n..($bw.Count - 1)] | Select-Object -First 20) -join ' ') + '...' }
  }
}

# =============================================================================
# THE RECORD
# =============================================================================

$RecordRel    = 'docs/host-adaptation.json'
$RecordMdRel  = 'docs/host-adaptation.md'
$recordPath   = Join-Path $Bundle $RecordRel
$recordMdPath = Join-Path $Bundle $RecordMdRel

$record = $null
if (Test-Path -LiteralPath $recordPath) {
  try { $record = Get-Content -Raw -Encoding UTF8 -LiteralPath $recordPath | ConvertFrom-Json }
  catch { Gap 'adaptation record' "could not be parsed: $($_.Exception.Message)" }
} elseif ($Mode -ne 'Refresh') {
  Gap 'adaptation record' "missing: $recordPath (the adapted policy files cannot be checked without it)"
}

# The canonical repository: the parameter, else the environment, else the
# record's own answer, else the built-in default.
if (-not $Canonical) {
  if ($record -and $record.canonicalRepo) {
    $Canonical = [string]$record.canonicalRepo
    $canonicalSource = "the record's canonicalRepo"
  } else {
    $Canonical = 'D:\project\lazible-jcode'
    $canonicalSource = 'the built-in default'
  }
}

# The record's two indexes: by the bundle heading it names, and by the
# canonical heading it maps to (canonicalHeading when the heading was renamed,
# the heading itself otherwise).
$recByBundle = @{}
$recByCanonical = @{}
if ($record) {
  foreach ($e in @($record.sections)) {
    $recByBundle["$($e.file)||$($e.heading)"] = $e
    $ch = $e.heading
    if ($e.PSObject.Properties.Name -contains 'canonicalHeading' -and $e.canonicalHeading) { $ch = [string]$e.canonicalHeading }
    $recByCanonical["$($e.file)||$ch"] = $e
  }
}

$canonicalLabel = $Canonical
if ($Mode -eq 'Self') { $canonicalLabel = '(none needed in this mode)' }
"POLICY DRIFT CHECK: mode $Mode | bundle $Bundle | canonical $canonicalLabel | record $recordPath"
""
"== bundle =="
"   bundle    : $Bundle"
"   tool      : $script:ToolDir"
"   record    : $recordPath"
"   mode      : $Mode"

# =============================================================================
# THE CANONICAL REVISION
# =============================================================================

$pinnedCommit = ''
$headCommit = ''
$canonicalReady = $false
$workingTreeState = 'unknown'

if ($Mode -eq 'Self') {
  ""
  "== canonical =="
  "   canonical : (none needed in this mode)"
  Skip 'the canonical half of the check' "Self mode compares the record against the bundle's own text; no canonical repository is used"
} else {
  ""
  "== canonical =="
  "   canonical : $Canonical   (source: $canonicalSource)"
  if (-not (Test-Path -LiteralPath $Canonical)) {
    # The canonical half was needed and could not be made: a BLOCK, never a
    # gap that reads like a pass and never a silent pass.
    Block 'the canonical half of the check' "the canonical repository is not there: $Canonical (nothing was compared with the canonical)"
  } else {
    $headCommit = Get-CanonicalHead $Canonical
    if (-not $headCommit) {
      Block 'the canonical half of the check' "$Canonical is not a git repository (git rev-parse HEAD failed; is git on PATH?) (nothing was compared with the canonical)"
    } else {
      $canonicalReady = $true
      if ($record -and $record.canonicalCommit) {
        $pinnedCommit = [string]$record.canonicalCommit
        $matches = ($headCommit.StartsWith($pinnedCommit) -or $pinnedCommit.StartsWith($headCommit))
        "   pinned    : $pinnedCommit   (the revision the record was written against)"
        "   actual HEAD: $headCommit"
        if ($matches) {
          Check 'the canonical revision' $true "the canonical is at the pinned revision $pinnedCommit"
        } else {
          Check 'the canonical revision' $false "the canonical has moved: the record pins $pinnedCommit, the canonical's HEAD is $headCommit"
        }
      } else {
        Block 'the canonical half of the check' 'the record carries no canonicalCommit, so there is no revision to compare against'
      }
    }
  }
}

# --- the canonical's working tree, against the pinned revision -----------------
# The comparison itself is made at the pinned revision, so a working tree that
# has moved away from it is a state of its own: a distinct failing state, never
# folded into the comparison and never a silent pass.  When the working tree is
# clean the state is reported as a line of its own and not as a comparison, so
# the number of comparisons the guard makes does not change.
if ($Mode -ne 'Self' -and $canonicalReady -and $pinnedCommit) {
  ""
  "== canonical working tree =="
  $moved = @{}
  $untracked = @()
  # git's own view of the working tree.  `status --porcelain` sees tracked
  # modifications, staged changes, deletions and renames; `diff --name-only
  # <pin>` compares the working tree with the pinned revision THROUGH git's
  # filters, so a checkout whose line endings differ (a fresh clone on Windows
  # checks out CRLF while the blobs are LF) is not reported as movement.
  # Untracked files are reported but do not fail the run: they are not part of
  # the pinned revision and the guard does not compare them.
  $porcelain = Invoke-Git @('-C', $Canonical, 'status', '--porcelain')
  if ($porcelain.Exit -eq 0) {
    foreach ($line in @($porcelain.Out -split "`r?`n")) {
      $t = $line.Trim()
      if ($t -eq '') { continue }
      if ($t.StartsWith('??')) { $untracked += $t.Substring(2).Trim() }
      else { $moved[$t] = "working tree: $t" }
    }
  } else {
    $moved['(git status)'] = "(git status --porcelain failed: $($porcelain.Err.Trim()))"
  }
  $diff = Invoke-Git @('-C', $Canonical, 'diff', '--name-only', $pinnedCommit)
  if ($diff.Exit -eq 0) {
    foreach ($line in @($diff.Out -split "`r?`n")) {
      $t = $line.Trim()
      if ($t -eq '') { continue }
      $moved[$t] = "differs from the pinned revision: $t"
    }
  } else {
    $moved['(git diff)'] = "(git diff --name-only $pinnedCommit failed: $($diff.Err.Trim()))"
  }
  if ($untracked.Count -gt 0) {
    "   untracked  : $($untracked -join ', ') (present in the canonical, not part of the pinned revision, not compared)"
  }
  if ($moved.Count -gt 0) {
    $workingTreeState = 'moved'
    Check 'the canonical working tree' $false "the canonical has moved away from the pinned revision ${pinnedCommit}: $(($moved.Values | Sort-Object) -join '; ') (the comparison itself was made at the pinned revision)"
  } else {
    $workingTreeState = 'clean'
    "   working tree: matches the pinned revision $pinnedCommit (git status --porcelain names no tracked change and git diff --name-only against the pin names no file)"
  }
}

# =============================================================================
# THE POLICY FILES - section by section
# =============================================================================

""
"== policy files (section by section, against the adaptation record) =="

$policyAdapted = 0
$policyInSync  = 0
$refreshEntries = @()
$structural = 0
$droppedEntries = @()

foreach ($p in $PolicyPairs) {
  $bp = Join-Path $Bundle $p.BundleRel
  if (-not (Test-Path -LiteralPath $bp)) {
    Check $p.Label $false "missing in bundle: $bp"
    Block $p.Label "the sections of this file were not compared (the file is not there)"
    continue
  }

  try {
    $bSections = Split-Sections (Read-Text $bp)
  } catch {
    Check $p.Label $false "the bundle file could not be read: $($_.Exception.Message)"
    Block $p.Label "the sections of this file were not compared (the file could not be read)"
    continue
  }

  $entries = @()
  if ($record) { $entries = @($record.sections | Where-Object { $_.file -eq $p.BundleRel }) }
  # the count for THIS file: the sections of this file that are in sync with the
  # canonical.  The label below used to print the running total of every file
  # compared so far, so a file with no in-sync section showed the number of the
  # file before it.
  $fileInSync = 0
  $problems = 0

  # --- the bundle half: the record against the bundle's own text --------------
  foreach ($e in $entries) {
    $label = "  {0} :: {1}" -f $p.BundleRel, $e.heading
    if (-not $bSections.Contains([string]$e.heading)) {
      Check $label $false "the record names a section the bundle does not have (a renamed heading needs a canonicalHeading in the record)"
      $problems++
      continue
    }
    $bh = Section-Hash $bSections[[string]$e.heading]
    if ($bh -ne [string]$e.bundleSha256) {
      Check $label $false "the record is out of date: the bundle section changed since it was recorded (recorded $($e.bundleSha256), now $bh)"
      $problems++
      continue
    }
    if (-not $e.reason -or ([string]$e.reason).Trim() -eq '') {
      Check $label $false "the record entry carries no reason"
      $problems++
      continue
    }

    # the surfaces column: every surface listed must be a real host surface and
    # must be named in the passage or in the reason; an empty list is legal
    # only when the passage names none.
    $passage = [string]$bSections[[string]$e.heading]
    $reason  = [string]$e.reason
    $stored = @()
    if ($e.PSObject.Properties.Name -contains 'surfaces' -and $null -ne $e.surfaces) { $stored = @($e.surfaces) }
    $derived = @(Find-Surfaces $passage)
    $surfaceProblems = @()
    foreach ($s in $stored) {
      $sn = [string]$s
      if ($script:HostSurfaces -notcontains $sn) {
        $surfaceProblems += "fabricated surface '$sn': it is not a host surface name"
        continue
      }
      if (-not (Names-Surface $passage $sn) -and -not (Names-Surface $reason $sn)) {
        $surfaceProblems += "surface '$sn' is named in neither the passage nor the reason"
      }
    }
    if ($stored.Count -eq 0 -and $derived.Count -gt 0) {
      $surfaceProblems += "the passage names $($derived.Count) surface(s) ($($derived -join ', ')) but the record lists none"
    }
    $missing = @($derived | Where-Object { $stored -notcontains $_ })
    if ($missing.Count -gt 0) {
      $surfaceProblems += "the passage names $($missing.Count) surface(s) the record does not list: $($missing -join ', ')"
    }
    if ($surfaceProblems.Count -gt 0) {
      Check $label $false ($surfaceProblems -join '; ')
      $problems++
      continue
    }
    $policyAdapted++
    Check $label $true ("adapted (recorded): " + $reason)
  }

  # --- the canonical half: only when there is a canonical to compare with ---
  $cSections = $null
  if ($canonicalReady -and $pinnedCommit) {
    $configRel = 'config'
    if ($record -and $record.canonicalPath) { $configRel = [string]$record.canonicalPath }
    $repoPath = ($configRel.TrimEnd('/') + '/' + $p.ConfigRel)
    $cText = Get-CanonicalBlob $Canonical $pinnedCommit $repoPath
    if ($null -eq $cText) {
      Gap $p.Label "the canonical file could not be read at the pinned revision $pinnedCommit ($repoPath)"
    } else {
      $cSections = Split-Sections $cText
      $consumed = @{}
      foreach ($ck in @($cSections.Keys)) {
        $entry = $recByCanonical["$($p.BundleRel)||$ck"]
        $bundleKey = Resolve-BundleKey $ck $entry $bSections
        if (-not $bundleKey) {
          Check ("  {0} :: {1}" -f $p.BundleRel, $ck) $false "structural difference: the canonical section has no counterpart in the bundle (a renamed heading needs a canonicalHeading in the record)"
          $structural++
          $problems++
          continue
        }
        $consumed[$bundleKey] = $true
        $bh = Section-Hash $bSections[$bundleKey]
        $ch = Section-Hash $cSections[$ck]
        if ($bh -eq $ch) {
          if ($entry) {
            Check ("  {0} :: {1}" -f $p.BundleRel, $ck) $false "stale record entry: the section no longer differs from the canonical"
            $problems++
          } else {
            $policyInSync++
            $fileInSync++
          }
        } else {
          if (-not $entry) {
            Check ("  {0} :: {1}" -f $p.BundleRel, $ck) $false "unrecorded adaptation: the section differs from the canonical and the record does not list it"
            $problems++
            continue
          }
          if ([string]$entry.canonicalSha256 -ne $ch) {
            Check ("  {0} :: {1}" -f $p.BundleRel, $ck) $false "the record is out of date: the canonical section changed since it was recorded (recorded $($entry.canonicalSha256), now $ch)"
            $problems++
            continue
          }
        }
      }
      foreach ($bk in @($bSections.Keys)) {
        if (-not $consumed.ContainsKey($bk)) {
          Check ("  {0} :: {1}" -f $p.BundleRel, $bk) $false "structural difference: the bundle has a section the canonical does not"
          $structural++
          $problems++
        }
      }
      # every record entry must name a canonical section the pinned revision has
      foreach ($e in $entries) {
        $ch = [string]$e.heading
        if ($e.PSObject.Properties.Name -contains 'canonicalHeading' -and $e.canonicalHeading) { $ch = [string]$e.canonicalHeading }
        if (-not $cSections.Contains($ch)) {
          Check ("  {0} :: {1}" -f $p.BundleRel, $e.heading) $false "the record names a canonical section that the pinned revision $pinnedCommit does not have: $ch"
          $problems++
        }
      }
    }
  }

  if ($Mode -eq 'Refresh' -and $cSections) {
    foreach ($ck in @($cSections.Keys)) {
      $old = $recByCanonical["$($p.BundleRel)||$ck"]
      $bundleKey = Resolve-BundleKey $ck $old $bSections
      $canonicalHeading = $null
      if ($old -and $old.PSObject.Properties.Name -contains 'canonicalHeading' -and $old.canonicalHeading) { $canonicalHeading = [string]$old.canonicalHeading }
      if (-not $bundleKey) { continue }
      if ($bundleKey -ne $ck) { $canonicalHeading = $ck }
      $bh = Section-Hash $bSections[$bundleKey]
      $ch = Section-Hash $cSections[$ck]
      if ($bh -eq $ch) { continue }
      $reason = ''
      $surfaces = @()
      if ($old) {
        if ($old.reason) { $reason = [string]$old.reason }
        if ($old.PSObject.Properties.Name -contains 'surfaces' -and $null -ne $old.surfaces) { $surfaces = @($old.surfaces) }
      }
      $derived = @(Find-Surfaces ([string]$bSections[$bundleKey]))
      if ($derived.Count -gt 0) { $surfaces = $derived }
      $entry = [ordered]@{
        file            = $p.BundleRel
        heading         = $bundleKey
        canonicalSha256 = $ch
        bundleSha256    = $bh
        reason          = $reason
        surfaces        = @($surfaces)
      }
      if ($canonicalHeading -and $canonicalHeading -ne $bundleKey) { $entry['canonicalHeading'] = $canonicalHeading }
      $refreshEntries += $entry
    }
  }

  if ($Mode -ne 'Refresh') {
    $label = "{0}  ({1} sections, {2} adapted, {3} in sync)" -f $p.Label, $bSections.Count, (@($entries).Count), $fileInSync
    if ($problems -eq 0) { Check $label $true }
    else { Check $label $false "$problems problem(s) in this file" }
  }
}

# ------------------------------------------------------------------- refresh

if ($Mode -eq 'Refresh') {
  if ($structural -gt 0) {
    ""
    "REFRESH ABORTED: $structural heading(s) were added, removed or renamed.  The record"
    "  describes adapted sections; it cannot describe a changed structure.  Fix the"
    "  structure first, then refresh."
    exit 1
  }

  $newCommit = $headCommit
  if (-not $newCommit) { $newCommit = $pinnedCommit }

  $doc = [ordered]@{
    workItem        = 'dsh-policy-adaptation'
    canonicalRepo   = $Canonical
    canonicalPath   = 'config'
    canonicalCommit = $newCommit
    generatedOn     = (Get-Date -Format 'yyyy-MM-dd')
    sections        = @($refreshEntries)
  }
  $json = $doc | ConvertTo-Json -Depth 6
  [System.IO.File]::WriteAllText($recordPath, ($json + "`n"), (New-Object System.Text.UTF8Encoding($false)))
  ""
  "RECORD WRITTEN: $recordPath  ($($refreshEntries.Count) adapted section(s), canonicalCommit $newCommit)"

  if (Test-Path -LiteralPath $recordMdPath) {
    $md = Get-Content -Raw -Encoding UTF8 -LiteralPath $recordMdPath
    $start = '<!-- host-adaptation:table -->'
    $end   = '<!-- /host-adaptation:table -->'
    $si = $md.IndexOf($start)
    $ei = $md.IndexOf($end)
    if ($si -ge 0 -and $ei -gt $si) {
      $rows = @('| File | Section | Why it differs | Surfaces |', '| --- | --- | --- | --- |')
      foreach ($e in $refreshEntries) {
        $reason = if ($e.reason -and $e.reason.Trim() -ne '') { ([string]$e.reason) -replace '\|', '\|' } else { '**TODO - a reason is required**' }
        $surfaces = if ($e.surfaces -and @($e.surfaces).Count -gt 0) { ((@($e.surfaces)) -join '; ') -replace '\|', '\|' } else { '-' }
        $section = [string]$e.heading
        if ($e.PSObject.Properties.Name -contains 'canonicalHeading' -and $e.canonicalHeading) {
          $section = "$section (canonical: $($e.canonicalHeading))"
        }
        $rows += "| ``$($e.file)`` | $section | $reason | $surfaces |"
      }
      $newMd = $md.Substring(0, $si + $start.Length) + "`n" + ($rows -join "`n") + "`n" + $md.Substring($ei)
      [System.IO.File]::WriteAllText($recordMdPath, $newMd, (New-Object System.Text.UTF8Encoding($false)))
      "RECORD TABLE WRITTEN: $recordMdPath"
    } else {
      "NOTE: $recordMdPath has no '<!-- host-adaptation:table -->' markers; the table was not rewritten."
    }
  }
  exit 0
}

# =============================================================================
# EMIT - the derived surfaces column
# =============================================================================

if ($Mode -eq 'Emit') {
  ""
  "== derived surfaces (the record's `surfaces` column, derived from the passage) =="
  $emitRows = @()
  foreach ($e in @($record.sections)) {
    $file = [string]$e.file
    $bp = Join-Path $Bundle $file
    $stored = @()
    if ($e.PSObject.Properties.Name -contains 'surfaces' -and $null -ne $e.surfaces) { $stored = @($e.surfaces) }
    $derived = @()
    if (Test-Path -LiteralPath $bp) {
      $secs = Split-Sections (Read-Text $bp)
      if ($secs.Contains([string]$e.heading)) { $derived = @(Find-Surfaces ([string]$secs[[string]$e.heading])) }
    }
    $emitRows += [ordered]@{
      file     = $file
      heading  = [string]$e.heading
      stored   = @($stored)
      derived  = @($derived)
    }
    "   {0} :: {1}" -f $file, $e.heading
    "      stored  : {0}" -f $(if ($stored.Count -gt 0) { $stored -join ', ' } else { '(none)' })
    "      derived : {0}" -f $(if ($derived.Count -gt 0) { $derived -join ', ' } else { '(none)' })
  }
  $json = $emitRows | ConvertTo-Json -Depth 5
  if ($OutFile) {
    [System.IO.File]::WriteAllText($OutFile, ($json + "`n"), (New-Object System.Text.UTF8Encoding($false)))
    ""
    "DERIVED SURFACES WRITTEN: $OutFile"
  } else {
    ""
    "== derived surfaces, as JSON =="
    $json
  }
  exit 0
}

# =============================================================================
# THE CRAFT FILES
# =============================================================================

if ($Mode -eq 'Self') {
  ""
  "== craft files =="
  Skip 'the craft files' "the canonical craft skills live in the canonical repository; Self mode does not use one"
} else {
  ""
  "== craft files (normalised: the documented port transformation, D-C2 + D-C3) =="
  "   rules     : 11 path->Skill, 14 file->Skill wordings, the core file's R-A, R-B,"
  "               R-C, R-D, R-F, R-G, R-H, R-I, R-J, the tester's process-skill"
  "               naming, the language files' L-01, L-02, L-03, D-C2's description"
  "               exception (D-C2-exception), and a sentence-initial capital"
  "   note      : craft bodies are compared with runs of whitespace collapsed, because the"
  "               port re-wrapped one paragraph of the core craft file.  Every word is"
  "               checked; a re-wrap on its own is not."

  foreach ($p in $CraftPairs) {
    $bp = Join-Path $Bundle $p.BundleRel
    if (-not (Test-Path -LiteralPath $bp)) { Check $p.Skill $false "missing in bundle: $bp"; continue }
    if (-not $canonicalReady -or -not $pinnedCommit) {
      Block $p.Skill "no canonical revision to compare against (the canonical repository is missing, is not a git repository, or the record carries no canonicalCommit)"
      continue
    }
    $configRel = 'config'
    if ($record -and $record.canonicalPath) { $configRel = [string]$record.canonicalPath }
    $repoPath = ($configRel.TrimEnd('/') + '/skills/' + $p.Skill + '/SKILL.md')
    $cText = Get-CanonicalBlob $Canonical $pinnedCommit $repoPath
    if ($null -eq $cText) {
      Gap $p.Skill "the canonical craft file could not be read at the pinned revision $pinnedCommit ($repoPath)"
      continue
    }

    try {
      $bSplit = Split-Fm (Read-Text $bp)
    } catch {
      Check $p.Skill $false "the bundle's craft file could not be read: $($_.Exception.Message)"
      continue
    }
    try {
      $cSplit = Split-Fm $cText
    } catch {
      Gap $p.Skill "the canonical craft file's frontmatter could not be parsed: $($_.Exception.Message)"
      continue
    }

    # --- the bundle side, put through the documented port --------------------
    $bBody = Port-Body $bSplit.Body $p.Kind

    $bName = $bSplit.Fm['name']
    $bDesc = $bSplit.Fm['description']
    $bWhen = $bSplit.Fm['whenToUse']
    if (-not $bDesc -or -not $bWhen) {
      Gap $p.Skill "bundle frontmatter has no description/whenToUse to fold (D-C2)"
      continue
    }
    $bDesc = (Apply-LitRxRules ($bDesc + ' ' + $bWhen) $DescriptionException).Trim()

    # --- the canonical side, read as it is -----------------------------------
    $cName = $cSplit.Fm['name']
    $cDesc = $cSplit.Fm['description']
    if (-not $cDesc) {
      Gap $p.Skill "canonical frontmatter has no description"
      continue
    }
    $cDesc = $cDesc.Trim()
    if ($cDesc.Length -ge 2 -and $cDesc.StartsWith('"') -and $cDesc.EndsWith('"')) {
      $cDesc = $cDesc.Substring(1, $cDesc.Length - 2)
    }

    # --- compare --------------------------------------------------------------
    $label = "{0}  ({1} vs SKILL.md)" -f $p.Skill, (Split-Path -Leaf $p.BundleRel)
    if ($bName -cne $cName) {
      Check $label $false "name differs: bundle '$bName' vs canonical '$cName'"
      continue
    }
    if ($bDesc -cne $cDesc) {
      Check $label $false "description differs after the D-C2 fold"
      Show-TokenDiff (Norm $bDesc) (Norm $cDesc) 'bundle   ' 'canonical'
      continue
    }

    $bNorm = Norm $bBody
    $cNorm = Norm $cSplit.Body
    if ($bNorm -ceq $cNorm) {
      $bLines = ($bBody -split "`n").Count
      $cLines = ($cSplit.Body -split "`n").Count
      $detail = if ($bLines -eq $cLines) { '' } else { "  (same wording, $bLines vs $cLines lines)" }
      Check $label $true $detail
    } else {
      Check $label $false "body differs after the D-C3 rewrite table"
      Show-TokenDiff $bNorm $cNorm 'bundle   ' 'canonical'
    }
  }
}

# =============================================================================
# THE SUMMARY
# =============================================================================

""
if ($Mode -eq 'Self') {
  $summary = "SELF CHECK: {0} recorded section(s), {1} drifted" -f (@($record.sections)).Count, $script:fail
  $summary += ", {0} not comparable, {1} skipped" -f $script:gap, $script:skip
  if ($script:blocked -gt 0) { $summary += " ({0} blocking)" -f $script:blocked }
  $summary += ", canonical: SKIPPED"
  if ($record -and $record.canonicalCommit) { $summary += " (the record pins canonical $($record.canonicalCommit))" }
} else {
  $summary = "DRIFT CHECK: {0} policy files, {1} craft files, {2} drifted" -f $PolicyPairs.Count, $CraftPairs.Count, $script:fail
  $summary += ", {0} not comparable, {1} skipped" -f $script:gap, $script:skip
  if ($script:blocked -gt 0) { $summary += " ({0} blocking: a required comparison was not made)" -f $script:blocked }
  if ($pinnedCommit) { $summary += " | canonical @ $pinnedCommit (the revision the record was written against)" }
  if ($headCommit) { $summary += ", HEAD $headCommit" }
  if ($workingTreeState -ne 'unknown') { $summary += " | working tree: $workingTreeState" }
}
$summary
"  policy sections: $policyAdapted adapted (each recorded with a reason), $policyInSync in sync with the canonical"
"  passed: $script:pass   failed: $script:fail   not comparable: $script:gap   skipped: $script:skip"

if ($script:fail -gt 0 -or $script:gap -gt 0 -or $script:blocked -gt 0) {
  "RESULT: NOT CLEAN - {0} failed, {1} not comparable, {2} skipped ({3} blocking)" -f $script:fail, $script:gap, $script:skip, $script:blocked
  exit 1
}
if ($Mode -eq 'Self') {
  "RESULT: CLEAN - every comparison the self-check makes agreed; the canonical half and the craft files are skipped by design"
} else {
  "RESULT: CLEAN - every comparison was made and every one of them agreed"
}
exit 0
