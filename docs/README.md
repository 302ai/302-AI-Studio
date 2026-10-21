# Documentation Index

This directory contains structured documentation following "Harness Engineering" principles.

## Directory Structure

```
docs/
├── architecture/          # System architecture and design
├── workflows/            # Step-by-step development guides
├── decision-trees/       # Decision-making guides
├── patterns/             # Code templates and patterns
├── quality/              # Quality standards and gates
├── references/           # Deep technical documentation
├── imgs/                 # Images and assets
└── superpowers/          # Superpowers specifications
```

## Quick Navigation

### Getting Started

- **Start Here**: [../AGENTS.md](../AGENTS.md) - Main entry point for AI agents
- **Architecture Overview**: [architecture/index.md](architecture/index.md)
- **Development Workflows**: [workflows/index.md](workflows/index.md)

### Common Tasks

- [Add IPC Service](workflows/adding-ipc-service.md)
- [Add Svelte Store](workflows/adding-store.md)
- [Add UI Component](workflows/adding-component.md)
- [Debug Issues](workflows/debugging.md)

### Making Decisions

- [Where Should Code Live?](decision-trees/code-location.md)
- [State Management Choices](decision-trees/state-management.md)
- [AI Provider Integration](decision-trees/ai-provider-integration.md)

### Quality & Standards

- [Quality Gates](quality/quality-gates.md)
- [Testing Standards](quality/testing-standards.md)
- [Code Review Checklist](quality/code-review-checklist.md)

### Reference Documentation

- [Tech Stack](references/tech-stack.md)
- [Logging System](references/logging-guide.md)
- [Code Generation](references/code-generation-guide.md)

## Documentation Principles

1. **Progressive Disclosure**: Start with high-level maps, drill down as needed
2. **Single Source of Truth**: Each concept documented once, linked everywhere
3. **Executable Workflows**: Step-by-step guides with commands
4. **Decision Trees**: Clear guidance for architectural choices
5. **Living Documentation**: Updated with code changes

## For AI Agents

This documentation structure is designed for AI coding assistants:

- **AGENTS.md** is your entry point (100 lines, acts as a map)
- **architecture/** explains system design
- **workflows/** provides executable procedures
- **decision-trees/** helps with choices
- **patterns/** offers copy-paste templates
- **quality/** defines standards

## Maintenance

- Documentation is version-controlled with code
- Update docs when changing architecture or workflows
- Run linters to validate cross-links
- Keep AGENTS.md under 150 lines (it's a map, not a manual)

---

**Last Updated**: 2026-04-03
