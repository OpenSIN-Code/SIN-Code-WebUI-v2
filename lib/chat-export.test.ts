// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest'
import { chatToMarkdown } from './chat-export'
import type { UIMessage } from 'ai'

describe('chatToMarkdown()', () => {
  it('renders a simple user message', () => {
    const messages: UIMessage[] = [
      { role: 'user', id: '1', parts: [{ type: 'text', text: 'Hello' }] },
    ]
    const md = chatToMarkdown({ id: 'chat-1', label: 'Chat One' }, messages)
    expect(md).toContain('# Chat One')
    expect(md).toContain('## User')
    expect(md).toContain('Hello')
  })

  it('renders an assistant message', () => {
    const messages: UIMessage[] = [
      { role: 'assistant', id: '2', parts: [{ type: 'text', text: 'Hi there' }] },
    ]
    const md = chatToMarkdown({ id: 'chat-2', label: 'Chat Two' }, messages)
    expect(md).toContain('## SIN')
    expect(md).toContain('Hi there')
  })

  it('renders a tool call with input and output', () => {
    const messages: UIMessage[] = [
      {
        role: 'assistant',
        id: '3',
        parts: [
          {
            type: 'dynamic-tool',
            toolName: 'sin_status',
            toolCallId: 't1',
            state: 'output-available',
            input: { foo: 'bar' },
            output: { ok: true },
          } as UIMessage['parts'][number],
        ],
      },
    ]
    const md = chatToMarkdown({ id: 'chat-3', label: 'Tool Chat' }, messages)
    expect(md).toContain('<details>')
    expect(md).toContain('sin_status')
    expect(md).toContain('"foo": "bar"')
    expect(md).toContain('"ok": true')
  })

  it('renders a failed tool call with error text', () => {
    const messages: UIMessage[] = [
      {
        role: 'assistant',
        id: '4',
        parts: [
          {
            type: 'dynamic-tool',
            toolName: 'sin_status',
            toolCallId: 't2',
            state: 'output-error',
            input: { q: 'x' },
            errorText: 'boom',
          } as UIMessage['parts'][number],
        ],
      },
    ]
    const md = chatToMarkdown({ id: 'chat-4', label: 'Error Chat' }, messages)
    expect(md).toContain('(error)')
    expect(md).toContain('boom')
  })
})
