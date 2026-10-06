# Build image Darussunnah Parung — frontend.
#
# image runtime sengaja hanya berisi output `standalone` Next.js (server.js +
# dependensi yang terpakai) plus public/. Versi sebelumnya menyalin seluruh
# source dan node_modules ke runner, sehingga image mencapai ~2.7GB dan langkah
# `chown -R` membuat build berjalan belasan menit.
FROM node:20-alpine AS deps
WORKDIR /app/apps/frontend
# Lockfile ikut di-copy supaya perubahan package.json tanpa lockfile ketahuan
# di diff, bukan baru gagal saat `npm ci` di server.
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/apps/frontend/node_modules ./node_modules
COPY apps/frontend ./
# .next dari build context bisa saja berasal dari mesin lain dan tidak cocok
# dengan lockfile, jadi selalu build dari nol.
RUN rm -rf .next && npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 nextjs && adduser -u 1001 -S nextjs -G nextjs

# server.js sudah listen di HOSTNAME/PORT di dalam standalone output.
COPY --from=builder --chown=nextjs:nextjs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/frontend/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/frontend/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]