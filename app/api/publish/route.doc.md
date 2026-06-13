# `app/api/publish/route.ts`

Publish endpoint that triggers the Docker image build workflow.

## What it does

Dispatches the `docker.yml` GitHub Actions workflow via `workflow_dispatch` so
the VPS or local stack can pull the new image and restart without exposing the
Docker socket.

## Dependencies

- `next/server` for `NextResponse`.
- GitHub REST API for `workflow_dispatch`.

## Important values

- Required env vars: `GITHUB_REPO`, `GITHUB_TOKEN`.
- Returns 202 on success, 401/403/429/502 on GitHub API errors.

## Caveats

The body fields (`chatId`, `projectId`, `visibility`) are informational and
passed to the workflow as inputs. The actual deployment is handled by the GitHub
Actions runner, not by this endpoint directly.
