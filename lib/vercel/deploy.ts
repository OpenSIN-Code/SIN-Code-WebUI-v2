import path from "node:path"
import fs from "node:fs/promises"
import { createHash } from "node:crypto"
import { vercelFetch, type VercelDeployment } from "./client"

let _workspaceDir: string | null = null
function workspaceDir(): string {
  if (!_workspaceDir) _workspaceDir = process.env.SIN_WORKSPACE_DIR || (/*turbopackIgnore: true*/ process.cwd())
  return _workspaceDir
}

let _deploymentsFile: string | null = null
function deploymentsFile(): string {
  if (!_deploymentsFile) _deploymentsFile = path.join(/*turbopackIgnore: true*/ process.cwd(), ".sin-webui", "deployments.json")
  return _deploymentsFile
}

const IGNORE = new Set(["node_modules", ".next", ".git", ".sin-webui", ".vercel"])

export type DeploymentRecord = {
  id: string
  url: string
  status: string
  target: "production" | "preview"
  createdAt: string
}

async function collectFiles(dir: string, base = dir): Promise<{ file: string; data: Buffer }[]> {
  const out: { file: string; data: Buffer }[] = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(full, base)))
    } else if (entry.isFile()) {
      out.push({ file: path.relative(base, full).replace(/\\/g, "/"), data: await fs.readFile(full) })
    }
  }
  return out
}

export async function createDeployment(opts: {
  projectName: string
  target: "production" | "preview"
}): Promise<VercelDeployment> {
  const files = await collectFiles(workspaceDir())

  const fileRefs = await Promise.all(
    files.map(async ({ file, data }) => {
      const sha = createHash("sha1").update(data).digest("hex")
      await fetch(`https://api.vercel.com/v2/files${process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ""}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/octet-stream",
          "x-vercel-digest": sha,
        },
        body: new Uint8Array(data),
      })
      return { file, sha, size: data.length }
    }),
  )

  const deployment = await vercelFetch<VercelDeployment>("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: opts.projectName,
      files: fileRefs,
      target: opts.target,
      projectSettings: { framework: "nextjs" },
    }),
  })

  await appendRecord({
    id: deployment.id,
    url: `https://${deployment.url}`,
    status: deployment.readyState,
    target: opts.target,
    createdAt: new Date().toISOString(),
  })

  return deployment
}

export async function getDeploymentStatus(id: string): Promise<VercelDeployment> {
  const d = await vercelFetch<VercelDeployment>(`/v13/deployments/${id}`)
  await updateRecord(id, d.readyState)
  return d
}

export async function listDeployments(): Promise<DeploymentRecord[]> {
  try {
    return JSON.parse(await fs.readFile(deploymentsFile(), "utf8")) as DeploymentRecord[]
  } catch {
    return []
  }
}

async function appendRecord(record: DeploymentRecord): Promise<void> {
  const records = await listDeployments()
  records.unshift(record)
  await fs.mkdir(path.dirname(deploymentsFile()), { recursive: true })
  await fs.writeFile(deploymentsFile(), JSON.stringify(records.slice(0, 50), null, 2))
}

async function updateRecord(id: string, status: string): Promise<void> {
  const records = await listDeployments()
  const r = records.find((x) => x.id === id)
  if (r && r.status !== status) {
    r.status = status
    await fs.writeFile(deploymentsFile(), JSON.stringify(records, null, 2))
  }
}
