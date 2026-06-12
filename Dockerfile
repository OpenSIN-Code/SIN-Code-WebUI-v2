# syntax=docker/dockerfile:1

# ── Stage 1: Build the sin-code Go binary ─────────────────────────────
FROM golang:1.23-alpine AS sincode
RUN apk add --no-cache git
# Pin a tag/commit instead of main for reproducible builds.
ARG SIN_CODE_REF=main
RUN git clone --depth 1 --branch ${SIN_CODE_REF} \
      https://github.com/OpenSIN-Code/SIN-Code.git /src
WORKDIR /src
RUN CGO_ENABLED=0 go build -o /out/sin-code ./cmd/sin-code

# ── Stage 2: Install Node dependencies ────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 3: Build the Next.js app ────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ── Stage 4: Runtime ──────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache curl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# File-store fallback location (used when DATABASE_URL is unset)
ENV SIN_DATA_DIR=/data

RUN addgroup -S sin && adduser -S sin -G sin

# sin-code backend binary
COPY --from=sincode /out/sin-code /usr/local/bin/sin-code

# Next.js standalone server + static assets
COPY --from=builder --chown=sin:sin /app/.next/standalone ./
COPY --from=builder --chown=sin:sin /app/.next/static ./.next/static
COPY --from=builder --chown=sin:sin /app/public ./public

RUN mkdir -p /data && chown sin:sin /data
VOLUME /data

USER sin
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
