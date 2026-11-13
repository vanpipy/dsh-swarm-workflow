// The bundle's test runner.
//
//   npm test            -> node test/run.mjs
//   node test/run.mjs
//
// Every suite runs in its own process, so one suite cannot hide another's
// failure, and the runner exits non-zero when any suite fails.
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
]

let failed = 0
for (const suite of suites) {
  console.log(`\n=== ${suite} ===`)
  const result = spawnSync(process.execPath, [join(here, suite)], { stdio: 'inherit' })
  const status = result.status === null ? 1 : result.status
  if (status !== 0) {
    failed += 1
    console.log(`SUITE FAILED: ${suite} (exit ${status})`)
  }
}

console.log(failed === 0 ? `\nALL SUITES PASSED (${suites.length})` : `\n${failed} of ${suites.length} SUITE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
