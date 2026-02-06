FROM oven/bun:1 AS builder

WORKDIR /app

COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile

COPY backend/ .

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DATABASE_URL=$DATABASE_URL
RUN bunx prisma generate

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.ts ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "run", "index.ts"]
