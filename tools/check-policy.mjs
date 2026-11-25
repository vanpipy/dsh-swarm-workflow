// The Node wrapper for the policy drift guard.
//
//   node tools/check-policy.mjs                    -> the full check
//   node tools/check-policy.mjs --self             -> the bundle-local self-check
//   node tools/check-policy.mjs --canonical <repo> -> against another canonical
//   node tools/check-policy.mjs --canonical=<repo> -> the same, as one argument
//   node tools/check-policy.mjs --help             -> this usage
//
// The guard itself is tools/check-policy-sync.ps1, a Windows PowerShell script.
// The bundle ships the user's policy text and a guard that runs from a fresh
// clone; it does not depend on PowerShell Core being installed, so the wrapper
// looks for Windows PowerShell as well.  The wrapper adds nothing to the
// comparison: it starts the guard, lets its output through, and passes its
// exit code on.
//
// An argument the wrapper does not know is refused: it prints the usage on
// stderr and exits 2 without starting the guard.  A wrong --canonical path is
// the guard's business, not the wrapper's: the guard reports it as a blocked
// comparison and exits non-zero, so a wrong path can never produce a green
// run against a different canonical.
//
// Exit codes (the guard's):
//   0  every comparison clean: nothing failed and nothing was left uncompared
//   1  at least one drift, failure, gap, or a comparison that could not be made
//   2  the guard could not run, or could not be started
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const guard = join(here, 'check-policy-sync.ps1')

const usage = [
  'usage: node tools/check-policy.mjs [--self] [--canonical <repo>]',
  '',
  '  --self              the bundle-local self-check; it needs no canonical repository',
  '  --canonical <repo>  compare against this canonical repository (the default is',
  "                      $env:SWARM_POLICY_CANONICAL, else the record's canonicalRepo,",
  '                      else the built-in default)',
  '  --help              print this message',
].join('\n')

function refuse(message) {
  console.error(`the policy guard: ${message}`)
  console.error(usage)
  process.exit(2)
}

const args = process.argv.slice(2)
let mode = 'Check'
let canonical = ''

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--self') {
    mode = 'Self'
  } else if (arg === '--canonical') {
    const value = args[i + 1]
    if (!value || value.startsWith('--')) refuse('--canonical needs the path of a canonical repository')
    canonical = value
    i++
  } else if (arg.startsWith('--canonical=')) {
    canonical = arg.slice('--canonical='.length)
    if (!canonical) refuse('--canonical needs the path of a canonical repository')
  } else if (arg === '--help' || arg === '-h') {
    console.log(usage)
    process.exit(0)
  } else {
    refuse(`unknown argument '${arg}'`)
  }
}

if (mode === 'Self' && canonical) {
  refuse('--self and --canonical contradict each other: the self-check uses no canonical')
}

const guardArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', guard, '-Mode', mode]
if (canonical) guardArgs.push('-Canonical', canonical)

const shells = [
  'pwsh',
  'powershell.exe',
  'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
]

for (const shell of shells) {
  const result = spawnSync(shell, guardArgs, { stdio: 'inherit' })
  // ENOENT means this shell is not on this machine: try the next one.
  if (result.error && result.error.code === 'ENOENT') continue
  process.exit(result.status === null ? 1 : result.status)
}

console.error(`the policy guard could not be started: no PowerShell found (tried ${shells.join(', ')})`)
process.exit(2)
