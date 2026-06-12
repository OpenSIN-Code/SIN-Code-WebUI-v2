/** @type {import('next').NextConfig} */
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
  // NFT fix (#53): child_process/fs usage in API routes makes the tracer
  // conservatively include the whole project. Exclude runtime-data and
  // non-server directories from the standalone trace explicitly.
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
    ],
    'app/api/workspace/**': ['**/*'],
    'app/api/settings/mcp/route.ts': ['**/*'],
    'app/api/settings/workspace/route.ts': ['**/*'],
  },
}

export default nextConfig
