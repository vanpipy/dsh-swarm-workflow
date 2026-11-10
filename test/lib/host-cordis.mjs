/**
 * Find the host's real cordis runtime, when this machine has one.
 *
 * The bundle's registration logic depends on how the host resolves services,
 * so the gating test runs against the real runtime whenever it can find it.
 * On a machine without a DSH host the test falls back to the local model in
 * cordis-model.mjs; the scenarios are the same either way.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Where a DSH host usually keeps its runtime. */
const HOST_PATHS = [
  'D:/software/dsh/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js',
  'C:/Program Files/DeepSeek Harness/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js',
  'C:/Program Files/dsh/resources/app.asar/node_modules/@deepseek-ai/cordis/lib/index.js',
]

/**
 * The candidate locations of the real runtime, most explicit first.
 * @returns {string[]} the candidates.
 */
export function candidates() {
  const list = []
  if (typeof process.env.DSH_CORDIS_MODULE === 'string' && process.env.DSH_CORDIS_MODULE !== '') {
    list.push(process.env.DSH_CORDIS_MODULE)
  }
  list.push(fileURLToPath(new URL('../../node_modules/@deepseek-ai/cordis/lib/index.js', import.meta.url)))
  list.push(...HOST_PATHS)
  return list
}

/**
 * Load the real runtime, if this machine has one.
 * @returns {Promise<{module: object, path: string} | null>} the runtime, or null.
 */
export async function loadHostCordis() {
  for (const candidate of candidates()) {
    if (!candidate.startsWith('file:') && !existsSync(candidate)) continue
    const url = candidate.startsWith('file:') ? candidate : `file:///${candidate.replace(/\\/g, '/')}`
    try {
      const module = await import(url)
      if (typeof module?.Context === 'function') return { module, path: url }
    } catch {
      // Not this one; try the next candidate.
    }
  }
  return null
}
