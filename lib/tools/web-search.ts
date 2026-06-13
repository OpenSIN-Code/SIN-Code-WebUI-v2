/**
 * Purpose: web_search tool for the Research workspace.
 * Uses a search-grounded model via the AI Gateway (perplexity/sonar)
 * as the retrieval backend — no extra API key beyond AI_GATEWAY_API_KEY.
 * Returns summarized findings with source URLs.
 */
// SPDX-License-Identifier: MIT


import { generateText, tool } from 'ai'
import { z } from 'zod'

export const webSearchTool = tool({
  description:
    'Search the web for current information. Returns a summary with source URLs. Use for facts, news, prices, documentation — anything that may have changed after your training data.',
  inputSchema: z.object({
    query: z.string().min(3).max(200).describe('The search query'),
  }),
  execute: async ({ query }) => {
    try {
      const { text, sources } = await generateText({
        model: 'perplexity/sonar',
        prompt: `Search the web and answer concisely with sources: ${query}`,
      })

      return {
        summary: text.slice(0, 4000),
        sources: (sources ?? [])
          .slice(0, 8)
          .map((s) => ('url' in s ? s.url : null))
          .filter(Boolean),
      }
    } catch (err) {
      return {
        error: `Search failed: ${(err as Error).message.slice(0, 200)}`,
      }
    }
  },
})
