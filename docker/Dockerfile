# Stage 1: Build React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace, lock files, and pnpm configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/package.json ./frontend/

# Install dependencies
RUN pnpm install --filter frontend... --frozen-lockfile

# Copy frontend source code
COPY frontend ./frontend

# Build frontend production assets
RUN pnpm --filter frontend build

# Stage 2: Build Golang Backend
FROM golang:1.26-alpine AS backend-builder
WORKDIR /app

# Copy backend dependencies configuration
COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /app/backend
RUN go mod download

# Copy backend source code
COPY backend /app/backend

# Compile statically linked Go server binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server cmd/api/main.go

# Stage 3: Minimal runtime image (using a pinned stable Alpine version for reproducible builds)
FROM alpine:3.20.5
WORKDIR /app

# Install essential certs, timezone data and create a secure non-root user
RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 10001 -S spinner && \
    adduser -u 10001 -S -G spinner -h /app spinner && \
    mkdir -p /app/data && \
    chown -R spinner:spinner /app

# Copy compiled Go server binary with correct non-root owner
COPY --from=backend-builder --chown=spinner:spinner /app/server /app/server

# Copy compiled React frontend assets with correct non-root owner
COPY --from=frontend-builder --chown=spinner:spinner /app/frontend/dist /app/frontend/dist

# Configure environment variables
ENV DB_PATH=/app/data/spinner.db
ENV PORT=8080
ENV FRONTEND_URL=http://localhost:8080
ENV BASE_URL=http://localhost:8080

# Switch to the non-root user
USER spinner

# Expose ports
EXPOSE 8080

# Start server
CMD ["/app/server"]
