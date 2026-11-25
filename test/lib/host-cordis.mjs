/**
 * The cordis runtime of the installed host.
 *
 * The host ships its runtime inside a packed `resources/app.asar`, so the
 * suite cannot require it from a path: the files live inside the container.
 * This module finds the container, reads its header, extracts the packages
 * the suite needs into a temporary directory, and imports the runtime from
 * there.
 *
 * Everything it writes goes to the OS temporary directory, and the copy is
 * removed when the process ends.
 */
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { extractAsarTree, findPackageRoots, readAsarHeader } from './asar.mjs'

/** The scope the runtime packages live in. */
const SCOPE = '@deepseek-ai'
/** The packages the runtime needs: the host's own cordis and its kit. */
const PACKAGES = ['cordis', 'cosmokit']

/**
 * The install roots the host may live in.
 *
 * The environment names the root when it is set; otherwise the roots this
 * host is known to use are tried, the installed one first.
 * @returns {string[]} the roots.
 */
function installRoots() {
  const roots = []
  if (process.env.DSH_INSTALL_ROOT !== undefined && process.env.DSH_INSTALL_ROOT !== '') {
    roots.push(process.env.DSH_INSTALL_ROOT)
  }
  if (process.env.DSH_HOME !== undefined && process.env.DSH_HOME !== '') {
    roots.push(join(process.env.DSH_HOME, 'dsh'))
  }
  roots.push('D:/software/dsh')
  roots.push('C:/Program Files/DeepSeek Harness')
  roots.push('C:/Program Files/dsh')
  return roots
}

/**
 * The packed containers that may hold the host's runtime.
 * @returns {string[]} the paths of the containers.
 */
export function asarCandidates() {
  const candidates = []
  if (process.env.DSH_APP_ASAR !== undefined && process.env.DSH_APP_ASAR !== '') {
    candidates.push(process.env.DSH_APP_ASAR)
  }
  for (const root of installRoots()) candidates.push(join(root, 'resources', 'app.asar'))
  return candidates
}

/**
 * The runtime module path set by hand, if the environment names one.
 * @returns {string|null} the path, or null.
 */
export function moduleOverride() {
  const value = process.env.DSH_CORDIS_MODULE
  return value === undefined || value === '' ? null : value
}

/**
 * The paths this module looks at, in the order it looks at them.
 * @returns {string[]} the paths.
 */
export function candidates() {
  const override = moduleOverride()
  return override === null ? asarCandidates() : [override, ...asarCandidates()]
}

/**
 * Extract the packages the suite needs out of a container.
 * @param {string} asarPath - the path of the container.
 * @param {string} target - the directory the packages are written to.
 * @returns {string|null} the path of the cordis runtime, or null when the container has none.
 */
function extractRuntime(asarPath, target) {
  const { header, base } = readAsarHeader(asarPath)
  const roots = findPackageRoots(header, SCOPE, PACKAGES)
  if (roots.length === 0) return null
  const parents = [...new Set(roots.map((root) => root.slice(0, root.lastIndexOf('/'))))]
  // The host's own application tree comes first: it is the copy the host runs.
  parents.sort((a, b) => Number(b.split('/').includes('dsh')) - Number(a.split('/').includes('dsh')))
  // Node resolves a package from a `node_modules` directory, so the scope is
  // written where the runtime can find its own kit.
  const scopeDir = join(target, 'node_modules', ...SCOPE.split('/'))
  mkdirSync(scopeDir, { recursive: true })
  for (const name of PACKAGES) {
    const suffix = `/${SCOPE}/${name}`
    const root = roots.find((candidate) => candidate.endsWith(suffix) && candidate.slice(0, candidate.lastIndexOf('/')) === parents[0])
      ?? roots.find((candidate) => candidate.endsWith(suffix))
    if (root === undefined) continue
    extractAsarTree(asarPath, header, base, root, join(scopeDir, name))
  }
  const entry = join(scopeDir, 'cordis', 'lib', 'index.js')
  return existsSync(entry) ? entry : null
}

/**
 * Load the cordis runtime of the installed host.
 *
 * The runtime is taken from the environment when the environment names one,
 * and from the installed host's packed container otherwise. When neither is
 * there, the host is not installed: the caller reports the host arm as
 * skipped.
 * @returns {Promise<{module: object, path: string, moduleId: string, source: string}|null>} the runtime, or null.
 */
export async function loadHostCordis() {
  const override = moduleOverride()
  if (override !== null) {
    const module = await import(pathToFileURL(override).href)
    if (typeof module?.Context === 'function') {
      return { module, path: pathToFileURL(override).href, moduleId: override, source: `DSH_CORDIS_MODULE=${override}` }
    }
  }
  for (const asarPath of asarCandidates()) {
    if (!existsSync(asarPath)) continue
    const target = mkdtempSync(join(tmpdir(), 'dsh-cordis-'))
    // The extracted copy is a build artefact of this run; it goes when the
    // suite ends.
    process.on('exit', () => { rmSync(target, { recursive: true, force: true }) })
    const entry = extractRuntime(asarPath, target)
    if (entry === null) continue
    const module = await import(pathToFileURL(entry).href)
    if (typeof module?.Context !== 'function') continue
    return { module, path: pathToFileURL(entry).href, moduleId: entry.slice(target.length + 1), source: asarPath }
  }
  return null
}
