/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output produces a self-contained server in `.next/standalone/`
  // that the Dockerfile copies into a slim runtime image. Static assets go
  // into `.next/static/` (copied separately). See Dockerfile.
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
}

export default nextConfig
