# Makefile for 302 AI Studio
# Simplifies common development operations

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Phony targets (not files)
.PHONY: help install dev start clean build build-unpack typecheck compile lint lint-fix format rebuild clean-install commit release

# Help target - shows all available commands
help: ## Show this help message
	@echo "$(BLUE)302 AI Studio Development Commands$(NC)"
	@echo "=================================="
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Common workflows:$(NC)"
	@echo "  make install    # First time setup"
	@echo "  make dev        # Start development"
	@echo "  make build      # Production build"
	@echo "  make lint-fix   # Fix code issues"

# Installation commands
install: ## Install all dependencies including Electron deps
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@yarn install
	@echo "$(BLUE)Installing Electron dependencies...$(NC)"
	@yarn install:deps
	@echo "$(GREEN)Installation complete!$(NC)"

# Development commands
dev: ## Start development server with hot reload
	@echo "$(BLUE)Starting development server...$(NC)"
	@yarn dev

start: dev ## Alias for dev command

# Clean commands
clean: ## Clean development artifacts
	@echo "$(BLUE)Cleaning development artifacts...$(NC)"
	@yarn clean:dev
	@echo "$(GREEN)Clean complete!$(NC)"

# Build commands
build: ## Full production build (prebuild + typecheck)
	@echo "$(BLUE)Running production build...$(NC)"
	@yarn build
	@echo "$(GREEN)Build complete!$(NC)"

build-unpack: ## Build without packaging (for testing)
	@echo "$(BLUE)Building unpackaged version...$(NC)"
	@yarn build:unpack
	@echo "$(GREEN)Unpack build complete!$(NC)"

typecheck: ## Run TypeScript type checking
	@echo "$(BLUE)Running TypeScript type checking...$(NC)"
	@yarn typecheck

compile: ## Compile app and package.json
	@echo "$(BLUE)Compiling application...$(NC)"
	@yarn compile:app
	@yarn compile:packageJSON
	@echo "$(GREEN)Compilation complete!$(NC)"

# Code quality commands
lint: ## Run code linting
	@echo "$(BLUE)Running code linting...$(NC)"
	@yarn lint

lint-fix: ## Auto-fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	@yarn lint:fix
	@echo "$(GREEN)Linting fixes applied!$(NC)"

format: lint-fix ## Alias for lint-fix

# Troubleshooting commands
rebuild: ## Rebuild native modules (fixes database connection errors)
	@echo "$(YELLOW)Rebuilding native modules (this may take a while)...$(NC)"
	@yarn electron-rebuild
	@echo "$(GREEN)Rebuild complete!$(NC)"

clean-install: ## Clean install (remove node_modules and reinstall)
	@echo "$(YELLOW)Performing clean install...$(NC)"
	@echo "$(BLUE)Removing node_modules...$(NC)"
	@rm -rf node_modules
	@echo "$(BLUE)Removing yarn.lock...$(NC)"
	@rm -f yarn.lock
	@echo "$(BLUE)Reinstalling dependencies...$(NC)"
	@yarn install
	@yarn install:deps
	@echo "$(GREEN)Clean install complete!$(NC)"

# Git and release commands
commit: ## Interactive commit with commitizen
	@echo "$(BLUE)Starting interactive commit...$(NC)"
	@yarn commit

release: ## Create release build
	@echo "$(BLUE)Creating release build...$(NC)"
	@yarn make:release
	@echo "$(GREEN)Release build complete!$(NC)"

# Testing command
test: ## Run tests (typecheck + lint)
	@echo "$(BLUE)Running tests (typecheck + lint)...$(NC)"
	@make typecheck
	@make lint
	@echo "$(GREEN)All tests passed!$(NC)"

# Development utilities
check: typecheck lint ## Run all checks (typecheck + lint)
	@echo "$(GREEN)All checks passed!$(NC)"

# Quick development cycle
quick: clean compile ## Quick rebuild cycle (clean + compile)
	@echo "$(GREEN)Quick rebuild complete!$(NC)"

# Development environment setup
setup: install ## Complete development environment setup
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@make clean
	@make typecheck
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  make dev    # Start development server"
	@echo "  make help   # Show all available commands"