FROM golang:1.25-alpine AS builder
WORKDIR /app/apps/backend
COPY apps/backend/go.mod apps/backend/go.sum ./
RUN go mod download
COPY apps/backend ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /tmp/darussunnah-api ./cmd/api

FROM alpine:3.22
WORKDIR /app/apps/backend
RUN apk add --no-cache ca-certificates tzdata
COPY apps/backend/public.key ./public.key
COPY apps/backend/ ./
# The compiled binary is copied AFTER the source tree on purpose. The previous
# order copied the source first and then the binary, which meant a stale
# host-built ./darussunnah-api in the build context silently overwrote the
# freshly compiled one and the deployed image ran old code.
COPY --from=builder /tmp/darussunnah-api ./darussunnah-api
RUN mkdir -p ./public/uploads ./private/uploads /data && chmod 750 ./private ./private/uploads
EXPOSE 8080
CMD ["./darussunnah-api"]
