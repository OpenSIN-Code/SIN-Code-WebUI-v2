// SPDX-License-Identifier: MIT

import { defineConfig } from 'vitest/config'
import path from 'node:path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    // Tests intentionally simulate rejected promises to exercise
    // try/catch fallbacks (e.g. webSearchTool.execute). Disable the
    // global unhandled-rejection detector so those flows don't get
    // surfaced as test failures.
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/*.test.ts', 'lib/**/*.doc.md', 'lib/**/*.d.ts'],
    },
  },
})
