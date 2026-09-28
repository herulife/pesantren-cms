FROM node:20-alpine AS deps
WORKDIR /app/apps/frontend
COPY apps/frontend/package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app/apps/frontend
COPY --from=deps /app/apps/frontend/node_modules ./node_modules
COPY apps/frontend ./
# Defense in depth: a stale .next in the build context would otherwise survive
# the build and stay servable as an orphaned public chunk.
RUN rm -rf .next && npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -g 1001 nextjs && adduser -u 1001 -S nextjs -G nextjs
COPY --from=builder /app/apps/frontend ./
RUN chown -R nextjs:nextjs /app/apps/frontend
USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
