// SPDX-License-Identifier: MIT

const API = "https://api.vercel.com"

export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN)
}

export async function vercelFetch<T>(
  path: string,
  init?: RequestInit & { raw?: boolean },
): Promise<T> {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error("VERCEL_TOKEN is not set")

  const sep = path.includes("?") ? "&" : "?"
  const url = `${API}${path}${process.env.VERCEL_TEAM_ID ? `${sep}teamId=${process.env.VERCEL_TEAM_ID}` : ""}`

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.raw ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vercel API ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

export type VercelDeployment = {
  id: string
  url: string
  readyState: "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED"
  createdAt: number
  target?: "production" | "preview"
}
