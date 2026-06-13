/**
 * Purpose: All dynamic fs/path access for the workspace files route lives here.
 * Loaded via `await import()` from the route handler so Turbopack's NFT
 * tracer never sees fs/path/cwd at the route boundary (#59 / #60).
 */
// SPDX-License-Identifier: MIT

import { promises as fs } from 'node:fs'
import path from 'node:path'

function root(): string {
  return process.env.SIN_WORKSPACE_DIR ?? process.cwd()
}

const IGNORE = new Set(['node_modules', '.git', '.next', '.sin-webui', 'dist'])
const MAX_FILE_SIZE = 512 * 1024

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: TreeNode[]
}

function safeResolve(rel: string): string {
  const base = root()
  const resolved = path.resolve(base, '.' + path.sep + rel)
  if (!resolved.startsWith(base)) throw new Error('Invalid path')
  return resolved
}

async function buildTree(dir: string, relBase = ''): Promise<TreeNode[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nodes: TreeNode[] = []
  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: relPath,
        type: 'dir',
        children: await buildTree(path.join(dir, entry.name), relPath),
      })
    } else {
      nodes.push({ name: entry.name, path: relPath, type: 'file' })
    }
  }
  return nodes.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1,
  )
}

export async function readWorkspaceFile(rel: string): Promise<string> {
  const abs = safeResolve(rel)
  const stat = await fs.stat(abs)
  if (stat.size > MAX_FILE_SIZE) {
    return '// File too large to display'
  }
  return await fs.readFile(abs, 'utf8')
}

export async function listWorkspaceTree(): Promise<TreeNode[]> {
  return await buildTree(root())
}
