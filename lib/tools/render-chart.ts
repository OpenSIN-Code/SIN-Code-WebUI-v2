/**
 * Purpose: render_chart tool for the Data Analysis workspace.
 * The model computes aggregated data points itself (it has the dataset
 * in context) and calls this tool with a chart spec. Execution is a
 * no-op pass-through — rendering happens client-side in the tool part.
 */

import { tool } from 'ai'
import { z } from 'zod'

export const renderChartTool = tool({
  description:
    'Render a chart from computed data points. Use after analyzing the dataset: aggregate the values yourself, then call this with the final points. Max 50 points.',
  inputSchema: z.object({
    type: z.enum(['bar', 'line', 'area', 'pie']),
    title: z.string().max(80),
    xKey: z.string().describe('Key used for the x axis / labels'),
    series: z
      .array(z.object({ key: z.string(), label: z.string() }))
      .min(1)
      .max(4)
      .describe('Value series to plot'),
    data: z
      .array(z.record(z.string(), z.union([z.string(), z.number()])))
      .min(1)
      .max(50),
  }),
  execute: async (spec) => spec,
})
