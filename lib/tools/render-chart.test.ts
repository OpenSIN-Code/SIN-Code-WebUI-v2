// SPDX-License-Identifier: MIT

import { describe, it, expect, vi } from 'vitest'

vi.mock('ai', () => ({
  // Pass-through: keeps the tool config intact so execute() can be tested directly.
  tool: <T>(config: T): T => config,
  generateText: {} as never,
}))

import { renderChartTool } from './render-chart'

describe('renderChartTool', () => {
  it('passes its description through', () => {
    expect(renderChartTool.description).toMatch(/chart/i)
    expect(renderChartTool.description).toMatch(/50 points/)
  })

  describe('execute()', () => {
    const valid = {
      type: 'bar' as const,
      title: 'Q1 revenue',
      xKey: 'month',
      series: [{ key: 'us', label: 'US revenue' }],
      data: [{ month: '2025-01', us: 1234 }],
    }

    it('returns the spec unchanged for valid input', async () => {
      const result = await (renderChartTool.execute as any)(valid, {})
      expect(result).toEqual(valid)
    })

    it('returns the spec unchanged for any supported chart type', async () => {
      for (const type of ['bar', 'line', 'area', 'pie'] as const) {
        const r = await (renderChartTool.execute as any)({ ...valid, type }, {})
        expect(r.type).toBe(type)
      }
    })
  })
})
