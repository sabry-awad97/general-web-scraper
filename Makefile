# Makefile for Scrapy project

# Variables
CARGO := cargo
NPM := npm
VITE := npx vite
CONCURRENTLY := npx concurrently

# Rust backend directory
BACKEND_DIR := scrapy

# TypeScript/React frontend directory
FRONTEND_DIR := scrapy-client

# Default target
.PHONY: all
all: build

# Build both backend and frontend
.PHONY: build
build: build-frontend build-backend

# Build Rust backend
.PHONY: build-backend
build-backend:
	cd $(BACKEND_DIR) && $(CARGO) build

# Build TypeScript/React frontend
.PHONY: build-frontend
build-frontend:
	cd $(FRONTEND_DIR) && $(NPM) install && $(NPM) run build

# Run the entire application (backend and frontend)
.PHONY: run
run:
	$(CONCURRENTLY) \
		-n "backend,frontend" \
		-c "blue,green" \
		"cd $(BACKEND_DIR) && $(CARGO) run" \
		"cd $(FRONTEND_DIR) && $(VITE)"

# Run backend only
.PHONY: run-backend
run-backend:
	cd $(BACKEND_DIR) && $(CARGO) run

# Run frontend development server
.PHONY: run-frontend
run-frontend:
	cd $(FRONTEND_DIR) && $(NPM) run dev

# Clean build artifacts
.PHONY: clean
clean:
	cd $(BACKEND_DIR) && $(CARGO) clean
	cd $(FRONTEND_DIR) && rm -rf dist node_modules

# Install dependencies
.PHONY: install
install:
	cd $(FRONTEND_DIR) && $(NPM) install

# Run tests
.PHONY: test
test:
	cd $(BACKEND_DIR) && $(CARGO) test
	cd $(FRONTEND_DIR) && $(NPM) test

# Format code
.PHONY: format
format:
	cd $(BACKEND_DIR) && $(CARGO) fmt
	cd $(FRONTEND_DIR) && $(NPM) run format

# Lint code
.PHONY: lint
lint:
	cd $(BACKEND_DIR) && $(CARGO) clippy
	cd $(FRONTEND_DIR) && $(NPM) run lint

# Help target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all            - Build both backend and frontend (default)"
	@echo "  build          - Build both backend and frontend"
	@echo "  build-backend  - Build Rust backend"
	@echo "  build-frontend - Build TypeScript/React frontend"
	@echo "  run            - Run the entire application (backend and frontend)"
	@echo "  run-backend    - Run backend only"
	@echo "  run-frontend   - Run frontend development server"
	@echo "  clean          - Clean build artifacts"
	@echo "  install        - Install frontend dependencies"
	@echo "  test           - Run tests for both backend and frontend"
	@echo "  format         - Format code for both backend and frontend"
	@echo "  lint           - Lint code for both backend and frontend"
	@echo "  help           - Show this help message"
