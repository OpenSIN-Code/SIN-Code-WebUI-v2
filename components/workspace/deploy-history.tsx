"use client"

import useSWR from "swr"

type DeployRecord = { id: string; url: string; status: string; target: string; createdAt: string }
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DeployHistory() {
  const { data } = useSWR<DeployRecord[]>("/api/workspace/deployments", fetcher, {
    refreshInterval: 10000,
  })

  if (!data?.length) {
    return <p className="p-4 text-sm text-muted-foreground">Noch keine Deployments.</p>
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {data.map((d) => (
        <li key={d.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
          <div className="flex min-w-0 flex-col">
            <a href={d.url} target="_blank" rel="noreferrer" className="truncate underline">
              {d.url.replace("https://", "")}
            </a>
            <span className="text-xs text-muted-foreground">
              {d.target} · {new Date(d.createdAt).toLocaleString()}
            </span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
              d.status === "READY"
                ? "bg-primary/10 text-primary"
                : d.status === "ERROR"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {d.status}
          </span>
        </li>
      ))}
    </ul>
  )
}
