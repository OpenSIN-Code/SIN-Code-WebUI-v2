// Purpose: Next.js configuration for standalone build, NFT exclusions, and security headers.
// Docs: next.config.mjs.doc.md

/** @type {import('next').NextConfig} */
// SPDX-License-Identifier: MIT

const nextConfig = {
  // Standalone output produces a self-contained server in `.next/standalone/`
  // that the Dockerfile copies into a slim runtime image.
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
          },
        ],
      },
    ]
  },
  // NFT fix (#53 / #59 / #60): child_process/fs usage in API routes makes
  // the tracer conservatively include the whole project. Exclude runtime-
  // data and non-server directories from the standalone trace explicitly.
  outputFileTracingExcludes: {
    '*': [
      './.sin-webui/**',
      './.git/**',
      './deploy/**',
      './scripts/**',
      './public/**',
      './**/*.test.ts',
      './lib/storage/**',
      './lib/db.ts',
      './lib/auth/better-auth.ts',
      './lib/chat-history.ts',
      './lib/tokens.ts',
      './lib/audit.ts',
      './lib/audit-fs.ts',
      './lib/sin/run.ts',
      './lib/sin/guard.ts',
      './lib/sin/orchestrator-stream.ts',
      './lib/workspace/design-history.ts',
      './lib/workspace/design-history-fs.ts',
      './lib/workspace/design-edit-fs.ts',
      './lib/workspace/files-fs.ts',
    ],
    'app/api/workspace/**': ['**/*'],
    'app/api/settings/mcp/route.ts': ['**/*'],
    'app/api/settings/workspace/route.ts': ['**/*'],
    'app/api/sin/orchestrator/stream/route.ts': ['**/*'],
  },
}

export default nextConfig
