.PHONY: all dev stop clean build install help lint docker-dev

# Default target
all: help

help: ## Show this help message containing all available developer targets
	@echo "\n✨ \033[1;36mSpinner Monorepo Developer Tooling\033[0m ✨"
	@echo "=================================================="
	@echo "\033[1;33mUsage:\033[0m make [target]\n"
	@echo "\033[1;32mAvailable targets:\033[0m"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[1;36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

install: ## Install both frontend (pnpm) and backend (go modules) dependencies
	@echo "📦 Installing monorepo and package dependencies..."
	@pnpm install
	@echo "📦 Downloading backend Go dependencies..."
	@cd backend && go mod download
	@echo "✅ All dependencies installed successfully."

dev: ## Start backend (Golang) and frontend (React/Vite) concurrently in local development mode
	@echo "🚀 Starting Go backend and Vite React frontend concurrently..."
	@pnpm run dev:frontend & pnpm run dev:backend

stop: ## Stop all native application processes (ports 8080, 5173) and Docker containers
	@echo "🛑 Stopping all native processes running on ports 8080 (backend) and 5173 (frontend)..."
	@-lsof -t -i:8080 -i:5173 | xargs kill -9 2>/dev/null || echo "No native processes found on port 8080 or 5173."
	@echo "🛑 Stopping any Docker containers..."
	@-docker compose -f docker/compose.yaml down 2>/dev/null || true
	@echo "✅ All application instances stopped."

clean: ## Delete SQLite database files to reset state
	@echo "🧹 Cleaning SQLite database files..."
	@rm -f backend/spinner.db spinner.db
	@echo "✅ Database files deleted successfully."

build: ## Build the production Docker image locally
	@echo "🐳 Building Docker image locally via Docker Compose..."
	@docker compose -f docker/compose.yaml build
	@echo "✅ Docker image built successfully."

lint: ## Run linting and formatting on Go backend and React frontend
	@echo "🔍 Linting frontend codebase..."
	@pnpm --filter frontend lint || true
	@echo "🔍 Formatting backend Go code..."
	@cd backend && go fmt ./...
	@echo "✅ Lint and format check completed."

docker-dev: ## Run the entire stack inside local Docker in detached mode
	@echo "🐳 Starting Spinner application in Docker containers..."
	@docker compose -f docker/compose.yaml up -d
	@echo "✅ Application running in background. Access http://localhost:8080"
