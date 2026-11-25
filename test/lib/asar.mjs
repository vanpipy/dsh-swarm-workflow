/**
 * Read a packed asar container.
 *
 * A DSH host ships its runtime inside `resources/app.asar`, which is a packed
 * archive, not a directory: the files the host runs are inside it and cannot
 * be required from a path. The container is a header followed by the file
 * payloads:
 *
 *   u32@0   the size of the field that follows
 *   u32@4   the size of the header pickle
 *   u32@8   the size of the field that follows
 *   u32@12  the length of the header JSON
 *   bytes   the header JSON, at offset 16
 *
 * The payloads follow the header at `8 + headerPickleSize`, and every file
 * entry in the header addresses its own bytes with an `offset` into that area.
 * The header is a tree of directories: a directory entry has `files`, a file
 * entry has `size`, `offset` and (for a file unpacked next to the container)
 * `unpacked`.
 *
 * This reader is part of the bundle's test library: it uses nothing but the
 * Node standard library, and it only ever reads.
 */
import { closeSync, mkdirSync, openSync, readSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Read the header of an asar container.
 * @param {string} asarPath - the path of the container.
 * @returns {{header: object, base: number}} the header tree and the offset the payloads start at.
 */
export function readAsarHeader(asarPath) {
  const fd = openSync(asarPath, 'r')
  try {
    const prefix = Buffer.alloc(16)
    readSync(fd, prefix, 0, 16, 0)
    const headerPickleSize = prefix.readUInt32LE(4)
    const jsonSize = prefix.readUInt32LE(12)
    const raw = Buffer.alloc(jsonSize)
    readSync(fd, raw, 0, jsonSize, 16)
    return { header: JSON.parse(raw.toString('utf8')), base: 8 + headerPickleSize }
  } finally {
    closeSync(fd)
  }
}

/**
 * Find the directories that hold a package of a scope, anywhere in the header.
 * @param {object} header - the header tree.
 * @param {string} scope - the scope of the package, e.g. `@deepseek-ai`.
 * @param {string[]} names - the package names to look for, e.g. `['cordis']`.
 * @returns {string[]} the paths of the package directories, in header order.
 */
export function findPackageRoots(header, scope, names) {
  const roots = []
  const walk = (node, path) => {
    for (const [name, entry] of Object.entries(node.files ?? {})) {
      if (entry.files === undefined) continue
      const child = path === '' ? name : `${path}/${name}`
      if (path.endsWith(`/${scope}`) && names.includes(name)) roots.push(child)
      walk(entry, child)
    }
  }
  walk(header, '')
  return roots
}

/**
 * Extract one directory of the container to disk.
 * @param {string} asarPath - the path of the container.
 * @param {object} header - the header tree.
 * @param {number} base - the offset the payloads start at.
 * @param {string} sourcePath - the path of the directory inside the container.
 * @param {string} destDir - the directory the tree is written to.
 * @returns {void}
 */
export function extractAsarTree(asarPath, header, base, sourcePath, destDir) {
  const node = entryAt(header, sourcePath)
  if (node === null) throw new Error(`asar entry not found: ${sourcePath}`)
  const fd = openSync(asarPath, 'r')
  try {
    const write = (current, relDir) => {
      for (const [name, entry] of Object.entries(current.files ?? {})) {
        const rel = relDir === '' ? name : `${relDir}/${name}`
        const dest = join(destDir, ...rel.split('/'))
        if (entry.files !== undefined) {
          mkdirSync(dest, { recursive: true })
          write(entry, rel)
          continue
        }
        if (entry.unpacked === true) continue
        const buffer = Buffer.alloc(entry.size)
        readSync(fd, buffer, 0, entry.size, base + Number(entry.offset))
        mkdirSync(dirname(dest), { recursive: true })
        writeFileSync(dest, buffer)
      }
    }
    write(node, '')
  } finally {
    closeSync(fd)
  }
}

/**
 * The header entry at a path.
 * @param {object} header - the header tree.
 * @param {string} path - the path inside the container.
 * @returns {object|null} the entry, or null when the path is not there.
 */
function entryAt(header, path) {
  let node = header
  for (const part of path.split('/')) {
    const next = node.files?.[part]
    if (next === undefined) return null
    node = next
  }
  return node
}
