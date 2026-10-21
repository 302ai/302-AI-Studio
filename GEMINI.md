# AI Agent Development Guide

> **For all AI coding assistants**: Claude Code, Gemini CLI, Codex, Copilot CLI, and other AI development tools.

## 🚀 Global Mandate: Activate Skills First

Before you perform any research or implementation, you **MUST** activate the relevant skills to ensure you follow the project's specific Svelte 5, Tailwind v4, and Electron 38 patterns.

```bash
# For UI, Stores, and Frontend Logic:
activate_skill sveltekit-svelte5-tailwind-skill

# For Main Process, IPC, and Native Features:
activate_skill electron
```

**Why this is mandatory**: This project uses Svelte 5 Runes and Tailwind v4, which differ significantly from older versions in your training data. Use the skill's `Stage 0-4` research methodology before writing any code.

## Project Overview

**302-AI-Studio** is an Electron desktop AI chat application with multi-provider support, Code Agent (Claude Code sandbox), MCP integration, and multi-tab architecture.

- **License**: AGPL-3.0
- **Repository**: https://github.com/302ai/302-AI-Studio-sv
- **Version**: v25.53.2-beta.2

## Quick Start

```bash
pnpm install              # Install dependencies (REQUIRED: pnpm only)
pnpm dev                  # Start development
pnpm quality              # Run all quality checks
pnpm generate:ipc         # Regenerate IPC bindings
pnpm gen:service <Name>   # Generate IPC service
pnpm gen:state <Name>     # Generate Svelte store
```

**Tech Stack**: SvelteKit 2.39 + Svelte 5.38 + Electron 38.1 + TypeScript 5.9 + Hono 4.9

## Repository Map

### Architecture

Start here to understand system design:

- **Overview**: [docs/architecture/index.md](docs/architecture/index.md)
- Main Process: [docs/architecture/electron-main.md](docs/architecture/electron-main.md)
- Renderer: [docs/architecture/renderer.md](docs/architecture/renderer.md)
- IPC System: [docs/architecture/ipc-system.md](docs/architecture/ipc-system.md)
- State Management: [docs/architecture/state-management.md](docs/architecture/state-management.md)

### Development Workflows

Step-by-step guides for common tasks:

- **Index**: [docs/workflows/index.md](docs/workflows/index.md)
- Add IPC Service: [docs/workflows/adding-ipc-service.md](docs/workflows/adding-ipc-service.md)
- Add Svelte Store: [docs/workflows/adding-store.md](docs/workflows/adding-store.md)
- Add Component: [docs/workflows/adding-component.md](docs/workflows/adding-component.md)
- Debugging: [docs/workflows/debugging.md](docs/workflows/debugging.md)

### Decision Trees

When you need to make architectural choices:

- **Code Location**: [docs/decision-trees/code-location.md](docs/decision-trees/code-location.md)
- State Management: [docs/decision-trees/state-management.md](docs/decision-trees/state-management.md)
- AI Provider Integration: [docs/decision-trees/ai-provider-integration.md](docs/decision-trees/ai-provider-integration.md)

### Quality Standards

Before every commit:

- **Quality Gates**: [docs/quality/quality-gates.md](docs/quality/quality-gates.md)
- Testing Standards: [docs/quality/testing-standards.md](docs/quality/testing-standards.md)
- Code Review: [docs/quality/code-review-checklist.md](docs/quality/code-review-checklist.md)

### Code Patterns

Copy-paste templates:

- IPC Service: [docs/patterns/ipc-service-template.md](docs/patterns/ipc-service-template.md)
- Svelte Store: [docs/patterns/store-template.md](docs/patterns/store-template.md)
- UI Component: [docs/patterns/component-template.md](docs/patterns/component-template.md)

### Reference Documentation

Deep technical details:

- **Tech Stack**: [docs/references/tech-stack.md](docs/references/tech-stack.md)
- Logging System: [docs/references/logging-guide.md](docs/references/logging-guide.md)
- Code Generation: [docs/references/code-generation-guide.md](docs/references/code-generation-guide.md)

## Core Principles

1. **Use Code Generators First**: `pnpm gen:service` and `pnpm gen:state` for scaffolding
2. **Type Safety**: TypeScript strict mode, no `any` types
3. **Quality Gates**: All checks must pass before commit
4. **IPC Pattern**: Service classes with auto-generated bindings
5. **State Pattern**: Svelte 5 runes with singleton instances
6. **No Console.log**: Use `createLogger()` from `@shared/logger`
7. **Conventional Commits**: `feat:`, `fix:`, `chore:`, etc.
8. **pnpm Only**: Project has patches, npm/yarn will break

## Repository Structure

```
src/
├── lib/
│   ├── components/ui/      # Shadcn-Svelte components (60+)
│   ├── components/buss/    # Business components
│   ├── stores/             # Svelte 5 state (20+ stores)
│   └── api/                # Frontend API layer
├── routes/                 # SvelteKit routes
└── shared/                 # Shared types/utils

electron/main/
├── services/               # IPC services (20+)
├── server/                 # Hono backend (port 8089)
└── generated/              # Auto-generated IPC bindings

docs/                       # Documentation (you are here)
```

## When You're Stuck

1. **Where should this code live?** → [docs/decision-trees/code-location.md](docs/decision-trees/code-location.md)
2. **How do I add X?** → [docs/workflows/index.md](docs/workflows/index.md)
3. **Quality check failed?** → [docs/quality/quality-gates.md](docs/quality/quality-gates.md)
4. **Need a code template?** → [docs/patterns/](docs/patterns/)
5. **Architecture question?** → [docs/architecture/index.md](docs/architecture/index.md)

## Tool-Specific Notes

### For Claude Code Users

- This file (AGENTS.md) is your entry point
- Use `Skill` tool to invoke skills when available
- Follow workflows in `docs/workflows/` for step-by-step guidance

### For Gemini CLI Users

- Use `activate_skill` tool for skills
- Tool mappings available in GEMINI.md if present
- Same workflow documents apply

### For Codex Users

- Follow OpenAI "Harness Engineering" patterns
- Repository knowledge is in `docs/` structure
- Use code generators for scaffolding

### For All Agents

- Start with [docs/architecture/index.md](docs/architecture/index.md) for system understanding
- Use decision trees when making architectural choices
- Run `pnpm quality` before requesting review
- Check existing code for patterns before creating new ones

---

**Last Updated**: 2026-04-03
**Maintained By**: 302.AI Team
