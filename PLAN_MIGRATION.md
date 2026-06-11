# PLAN: Migration Python `sin` CLI → Go `sin-code` v2.5.0

Quelle Backend: https://github.com/OpenSIN-Code/SIN-Code-Bundle
Ziel WebUI: https://github.com/OpenSIN-Code/SIN-Code-WebUI-v2

## Ground Truth (verifiziert gegen Bundle@main)

| Fakt | Wert | Quelle |
| --- | --- | --- |
| Aktuelles Release | `v2.5.0` | GitHub Releases |
| Subcommands | **32** | `cmd/sin-code/main.go` (30× `AddCommand` + `tui` + `webui`) |
| MCP-Tools (`sin-code serve`) | **44** `sin_*` Tools | `cmd/sin-code/internal/serve.go` |
| AI SDK 6 MCP-Client | `@ai-sdk/mcp` (NICHT `ai/mcp-stdio`) | `ai@6.0.202` exports: nur `.`, `./internal`, `./test` |

> Achtung: Issues #2/#4 sprechen von „19 MCP tools", PR #7 listet 21 —
> beides ist veraltet. `serve.go` registriert aktuell 44 Tools.

## Issue → Datei Mapping

| Issue | Datei | Fix |
| --- | --- | --- |
| #1 | `lib/sin/client.ts` | `execFile` (keine Shell), `sin-code`-Binary, 32-Subcommand-Whitelist, `--format json`, graceful `{installed:false}` |
| #2 | `lib/sin/mcp.ts` | `sin-code serve` via `createMCPClient` aus `@ai-sdk/mcp` + `Experimental_StdioMCPTransport` aus `@ai-sdk/mcp/mcp-stdio` |
| #3 | `app/api/sin/status/route.ts` | Response-Shape = `SinCodeStatus` aus `client.ts`; Tool-Liste zentral aus `lib/sin/tools.ts` |
| #4 | `app/api/chat/route.ts` | SYSTEM_PROMPT mit den echten 44 Tools + Routing-Regeln; Tool-Count dynamisch aus `SIN_MCP_TOOLS.length` |
| #5 | `app/page.tsx` + `components/sin-status-tile.tsx` | Status-Tile (installed/missing, Version, Counts, Install-Cmd kopieren) |
| #6 | `.github/workflows/ceo-audit.yml` | Dependabot-Bypass + Node/TS-Skip → required Check wird grün ohne Audit-Aufweichung |
| #7 (PR) | alle | PR-Review eingearbeitet: falsche Imports, inkonsistente Tool-Listen, doppelte Wahrheit beseitigt |

## Architektur-Entscheidung

`lib/sin/tools.ts` ist die **einzige Quelle der Wahrheit** für
Subcommands und MCP-Tool-Namen. Status-Route, Chat-Prompt und
Status-Tile importieren von dort — keine handgepflegten Kopien mehr
(das war die Ursache von Issue #3).

## Abhängigkeiten

```bash
pnpm add @ai-sdk/mcp swr
```

`ai` ≥ 6.x und `@ai-sdk/react` ≥ 3.x sind bereits vorhanden.

## Env-Variablen (optional)

| Variable | Zweck |
| --- | --- |
| `SIN_CODE_BIN` | Pfad-Override für das Binary (CI / nicht-PATH-Installationen) |

## Offene Punkte

- [ ] PR #7 aktualisieren oder schließen (Imports + Tool-Listen falsch)
- [ ] Branch-Protection: `ceo-audit` als required Check beibehalten (Job liefert jetzt immer einen Status)
- [ ] Optional: `sin_code_version` im Footer/Sidebar anzeigen
