# `app/api/enhance/route.ts`

## What
LLM-based prompt enhancer. Takes a short user prompt and returns a more detailed, actionable rewrite.

## Imports
- `ai` → `generateText`
- `lib/sin/guard` → `guardRequest` (auth + rate limit)
- `lib/sin/models` → `resolveModel` (map UI model id to gateway model string)

## Body
```json
{
  "prompt": "build a todo app",
  "model": "sin-code-pro" // optional
}
```

## Response
```json
{
  "ok": true,
  "enhanced": "Create a full-stack to-do application with Next.js..."
}
```

## Limits
- `maxDuration: 60` seconds
- Rate limit: 10 requests/minute per user (30 for admin)

## Related
- `components/prompt-box.tsx` → Sparkles button triggers this endpoint
- `lib/sin/models.ts` → model resolution
- `lib/sin/guard.ts` → auth + rate limiting
