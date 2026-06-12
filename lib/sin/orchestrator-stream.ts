/**
 * Purpose: All node:child_process spawn work for orchestrator-stream lives here.
 * Loaded via `await import()` from the route handler so Turbopack's NFT tracer
 * never sees spawn() at the route boundary (#59 / #60).
 *
 * `spawn` itself is dynamically imported inside the function so this module
 * also stays NFT-clean. The whole file is split across two layers of
 * dynamic imports because Next.js 16.2.6 still flags any module that
 * transitively references node:child_process, fs, path, or process.cwd().
 */
/* __sin_nft_clean__ */
export async function runOrchestratorStream(
  task: string,
  signal: AbortSignal | null,
): Promise<Response> {
  return (await import('./orchestrator-stream-impl')).runOrchestratorStreamImpl(
    task,
    signal,
  )
}
