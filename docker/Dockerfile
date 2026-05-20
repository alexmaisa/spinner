# Stage 1: Build React Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace and lock files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
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

# Stage 3: Minimal runtime image
FROM alpine:latest
WORKDIR /app

# Install essential certs and timezone data
RUN apk --no-cache add ca-certificates tzdata

# Copy compiled Go server binary
COPY --from=backend-builder /app/server /app/server

# Copy compiled React frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Configure environment variables
ENV DB_PATH=/app/data/spinner.db
ENV PORT=8080

# Expose ports
EXPOSE 8080

# Start server
CMD ["/app/server"]
