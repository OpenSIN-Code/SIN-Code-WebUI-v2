FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
# Bypass pnpm 10 ignored-builds error and global policy in this build context
RUN pnpm config set minimumReleaseAge 0
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
RUN pnpm config set minimumReleaseAge 0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# NEU: sin-code Backend-Binary bauen
FROM golang:1.25-alpine AS sincode
RUN apk add --no-cache git
RUN go install github.com/OpenSIN-Code/SIN-Code-Bundle/cmd/sin-code@latest

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
ENV SIN_CODE_BIN=/usr/local/bin/sin-code
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# NEU: Binary aus dem Go-Stage kopieren
COPY --from=sincode /go/bin/sin-code /usr/local/bin/sin-code
RUN mkdir -p /app/.sin-webui && chown -R app:app /app/.sin-webui
USER app
EXPOSE 3000
CMD ["node", "server.js"]
