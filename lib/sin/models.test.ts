// SPDX-License-Identifier: MIT

import { describe, it, expect, vi, afterEach } from 'vitest'
import { SIN_MODELS, resolveModel } from './models'

describe('sin models', () => {
  describe('SIN_MODELS catalog', () => {
    it('has exactly three tiers (pro/fast/mini)', () => {
      expect(SIN_MODELS.map((m) => m.id)).toEqual(['sin-code-pro', 'sin-code-fast', 'sin-code-mini'])
    })

    it('every model has a non-empty label, description and gateway', () => {
      for (const m of SIN_MODELS) {
        expect(m.label.length).toBeGreaterThan(0)
        expect(m.description.length).toBeGreaterThan(0)
        expect(m.gateway.length).toBeGreaterThan(0)
      }
    })

    it('every gateway string is provider/model shaped', () => {
      for (const m of SIN_MODELS) {
        expect(m.gateway).toMatch(/^[a-z0-9_-]+\/[a-z0-9._-]+$/i)
      }
    })
  })

  describe('resolveModel()', () => {
    // SIN_MODELS is computed at module load time, so we re-import with env
    // variables set before import. SIN_CHAT_MODEL is read at call time, so
    // it can be set/cleared per-test.
    async function importFresh(env: Record<string, string | undefined>) {
      vi.resetModules()
      for (const [k, v] of Object.entries(env)) {
        if (v === undefined) delete process.env[k]
        else process.env[k] = v
      }
      return await import('./models')
    }

    afterEach(() => {
      for (const k of [
        'SIN_CHAT_MODEL',
        'SIN_MODEL_PRO',
        'SIN_MODEL_FAST',
        'SIN_MODEL_MINI',
      ]) delete process.env[k]
    })

    it('resolves sin-code-pro to the default pro gateway', async () => {
      const m = await importFresh({})
      expect(m.resolveModel('sin-code-pro')).toBe('anthropic/claude-sonnet-4.5')
    })

    it('resolves sin-code-fast to the default fast gateway', async () => {
      const m = await importFresh({})
      expect(m.resolveModel('sin-code-fast')).toBe('openai/gpt-5-mini')
    })

    it('resolves sin-code-mini to the default mini gateway', async () => {
      const m = await importFresh({})
      expect(m.resolveModel('sin-code-mini')).toBe('google/gemini-3-flash')
    })

    it('honors SIN_MODEL_PRO override', async () => {
      const m = await importFresh({ SIN_MODEL_PRO: 'openai/gpt-4.1' })
      expect(m.resolveModel('sin-code-pro')).toBe('openai/gpt-4.1')
    })

    it('honors SIN_MODEL_FAST override', async () => {
      const m = await importFresh({ SIN_MODEL_FAST: 'anthropic/claude-haiku-4.5' })
      expect(m.resolveModel('sin-code-fast')).toBe('anthropic/claude-haiku-4.5')
    })

    it('honors SIN_MODEL_MINI override', async () => {
      const m = await importFresh({ SIN_MODEL_MINI: 'openai/gpt-4o-mini' })
      expect(m.resolveModel('sin-code-mini')).toBe('openai/gpt-4o-mini')
    })

    it('passes through raw provider/model gateway strings', async () => {
      const m = await importFresh({})
      expect(m.resolveModel('anthropic/claude-opus-4.6')).toBe('anthropic/claude-opus-4.6')
    })

    it('returns SIN_CHAT_MODEL when unknown id and env set', async () => {
      const m = await importFresh({})
      process.env.SIN_CHAT_MODEL = 'google/gemini-2.5-pro'
      expect(m.resolveModel('unknown-model')).toBe('google/gemini-2.5-pro')
    })

    it('returns default fallback when id is unknown and env unset', async () => {
      const m = await importFresh({})
      expect(m.resolveModel('unknown-model')).toBe('openai/gpt-5-mini')
    })

    it('returns default when id is undefined', async () => {
      const m = await importFresh({})
      expect(m.resolveModel(undefined)).toBe('openai/gpt-5-mini')
    })
  })
})
