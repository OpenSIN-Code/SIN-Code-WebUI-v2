// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import { SIN_AGENTS, agentPrompt, type SinAgentId } from './agents'

describe('sin agents', () => {
  it('declares a stable agent id union', () => {
    const ids: SinAgentId[] = ['auto', 'build', 'review', 'plan', 'scout']
    expect(SIN_AGENTS.map((a) => a.id)).toEqual(ids)
  })

  describe('agentPrompt()', () => {
    it('returns empty string for auto', () => {
      expect(agentPrompt('auto')).toBe('')
    })

    it('returns builder instructions', () => {
      const p = agentPrompt('build')
      expect(p).toMatch(/BUILDER/)
      expect(p).toMatch(/sin_ibd/)
    })

    it('returns reviewer instructions', () => {
      const p = agentPrompt('review')
      expect(p).toMatch(/REVIEWER/)
      expect(p).toMatch(/sin_oracle/)
    })

    it('returns planner instructions', () => {
      const p = agentPrompt('plan')
      expect(p).toMatch(/PLANNER/)
      expect(p).toMatch(/sin_orchestrator_plan/)
    })

    it('returns scout instructions', () => {
      const p = agentPrompt('scout')
      expect(p).toMatch(/SCOUT/)
      expect(p).toMatch(/Allowed/i)
    })

    it('returns empty string for an unknown id', () => {
      expect(agentPrompt('not-a-real-agent')).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(agentPrompt()).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(agentPrompt('')).toBe('')
    })
  })
})
