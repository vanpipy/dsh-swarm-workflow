// The bundle's test runner.
//
//   npm test            -> node test/run.mjs
//   node test/run.mjs
//
// Every suite runs in its own process, so one suite cannot hide another's
// failure, and the runner exits non-zero when any suite fails.
//
// The runner reads what each suite printed, so the run can say how large it
// was. Every suite reports the checks it executed on a line of its own:
//
//   SUITE CHECKS: 165
//
// and an arm that did not run says so:
//
//   SUITE ARM: host runtime = SKIPPED (no host runtime found on this machine)
//
// The final line carries the suite count and the number of checks the suites
// executed. A run that skipped an arm says so in that line, and that line
// does not read "ALL SUITES PASSED": a run that skipped an arm never reads as
// a run that verified it.
//
// The policy self-check runs with them: the adaptation record
// (docs/host-adaptation.json) must still describe the bundle's own policy
// text.  It needs no canonical repository, so it runs in every checkout. It
// prints its own counters, and the runner does not read them: the guard is
// owned by another lane, and the runner must not depend on what it prints.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const suites = [
  'render-prompt.test.mjs',
  'method.test.mjs',
  'swarm-tools.test.mjs',
  'gating.test.mjs',
  'verbatim.test.mjs',
  'skill-stamp.test.mjs',
  'encoding.test.mjs',
]

/** The prefix a suite prints the checks it executed behind. */
const CHECKS_PREFIX = 'SUITE CHECKS: '
/** The prefix a suite prints an arm it ran or skipped behind. */
const ARM_PREFIX = 'SUITE ARM: '

let failed = 0
let checks = 0
const perSuite = []
const skippedArms = []

for (const suite of suites) {
  console.log(`\n=== ${suite} ===`)
  const result = spawnSync(process.execPath, [join(here, suite)], { stdio: ['inherit', 'pipe', 'inherit'] })
  const output = result.stdout === null ? '' : result.stdout.toString('utf8')
  if (result.stdout !== null) process.stdout.write(result.stdout)
  const status = result.status === null ? 1 : result.status
  for (const line of output.split('\n')) {
    if (line.startsWith(CHECKS_PREFIX)) {
      const count = Number(line.slice(CHECKS_PREFIX.length).trim())
      if (Number.isFinite(count)) {
        checks += count
        perSuite.push({ suite, count })
      }
    }
    if (line.startsWith(ARM_PREFIX)) {
      const arm = line.slice(ARM_PREFIX.length).trim()
      if (arm.includes('= SKIPPED')) skippedArms.push({ suite, arm })
    }
  }
  if (status !== 0) {
    failed += 1
    console.log(`SUITE FAILED: ${suite} (exit ${status})`)
  }
}

console.log('\n=== policy self-check ===')
const policy = spawnSync(
  process.execPath,
  [join(here, '..', 'tools', 'check-policy.mjs'), '--self'],
  { stdio: 'inherit' },
)
const policyStatus = policy.status === null ? 1 : policy.status
if (policyStatus !== 0) {
  failed += 1
  console.log(`SUITE FAILED: policy self-check (exit ${policyStatus})`)
}

console.log('\n=== the size of this run ===')
for (const entry of perSuite) console.log(`  ${entry.suite.padEnd(24)} ${entry.count} checks`)
console.log(`  ${perSuite.length} test suites, ${checks} checks executed (the policy self-check is step ${suites.length + 1} of ${suites.length + 1} and prints its own counters)`)

const total = suites.length + 1
if (failed > 0) {
  console.log(`\n${failed} of ${total} SUITE(S) FAILED (${checks} checks executed)`)
} else if (skippedArms.length > 0) {
  const names = skippedArms.map((entry) => `${entry.suite}: ${entry.arm}`).join('; ')
  console.log(`\nARM SKIPPED, NOT VERIFIED - ${names} - SUITES PASSED (${total} suites, ${checks} checks)`)
} else {
  console.log(`\nALL SUITES PASSED (${total} suites, ${checks} checks)`)
}
process.exit(failed === 0 ? 0 : 1)
