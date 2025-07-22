# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Development Commands
```bash
# Start development server with hot reload
yarn dev

# Type checking (required before builds)
yarn typecheck

# Code linting and formatting (uses Biome)
yarn lint
yarn lint:fix

# Build for production
yarn build

# Install Electron dependencies (run after yarn install)
yarn install:deps

# Rebuild native modules if database issues occur
yarn electron-rebuild

# Clean development artifacts
yarn clean:dev
```

### Build Process
The build system uses a multi-step process:
1. `yarn clean:dev` - Clean previous builds
2. `yarn compile:app` - Compile with electron-vite
3. `yarn compile:packageJSON` - Generate package metadata
4. `yarn typecheck` - Validate TypeScript

Always run `yarn typecheck` before committing. The build will fail without it.

### Troubleshooting Development Issues

**Database Connection Errors (`ERR_DLOPEN_FAILED`)**:
```bash
yarn electron-rebuild  # Rebuild native modules
```

**GPU Process Errors in Headless Environments**:
```bash
ELECTRON_DISABLE_GPU=1 yarn dev  # Disable GPU acceleration
```

These errors don't affect React Compiler functionality or core development workflow.

## React Compiler Integration

This project uses React Compiler (RC) for automatic optimization of React components. The compiler is integrated via Vite's Babel plugin and runs during the build process.

### How It Works
- Components are automatically memoized where beneficial
- No manual `useMemo`/`useCallback` needed in most cases
- Compiler analyzes component dependencies and optimizes renders
- Look for ✨ badge in React DevTools to see optimized components

### Debugging Compilation Issues
If a component has unexpected behavior after compilation:
1. Add `"use no memo"` directive at the top of the component to temporarily disable optimization
2. Verify the issue is compiler-related (should disappear with directive)
3. Check for Rules of React violations - common causes of issues
4. Remove directive once underlying issue is fixed

### Development Notes
- The compiler runs automatically - no special configuration needed
- Build output will contain `react/compiler-runtime` imports when optimization occurs
- Components violating React rules are safely skipped by the compiler

## Architecture Overview

### Electron Multi-Process Architecture
- **Main Process** (`src/main/`): Node.js backend with service layer
- **Renderer Process** (`src/renderer/`): React frontend
- **Preload** (`src/preload/`): Secure IPC bridge
- **Shared** (`src/shared/`): Common types, database schema, utilities

### Service-Oriented Main Process
The main process uses dependency injection (Inversify) with 16 services:
- `ChatService` - AI conversation management
- `AttachmentService` - File upload and processing  
- `MessageService` - Message CRUD operations
- `ThreadService` - Conversation thread management
- `ModelService` - AI model provider management
- `SettingsService` - Application configuration
- `WindowService` - Desktop window management
- `TriplitService` - Database operations
- Plus 8 additional services for UI, tabs, shortcuts, toolbox, etc.

Services auto-register IPC handlers via decorators. Find service methods in `src/main/services/`.

### Database Layer (Triplit)
Real-time SQLite database with 10 collections:
- `providers` - AI service configurations (302.AI, OpenAI)
- `models` - Available AI models per provider
- `threads` - Chat conversations
- `messages` - Individual messages with streaming support
- `attachments` - File uploads with metadata
- `settings` - App configuration
- Plus collections for tabs, shortcuts, toolbox, UI state

Schema definitions in `src/shared/triplit/schemas/`. Uses versioned migrations.

### AI Provider Architecture
Pluggable provider system supporting:
- **302.AI** (primary) - Custom SDK integration
- **OpenAI** - AI SDK compatibility layer
- Provider switching at runtime
- Model discovery and caching

Find provider implementations in `src/main/api/`.

### File Processing Pipeline
Multi-format file support via adapter pattern:
- **Supported**: PDF, CSV, Excel, Word, PowerPoint, images, code files, audio
- **Processing**: Text extraction, thumbnail generation, metadata parsing
- **Storage**: SQLite BLOB storage with filename/MIME type
- **Preview**: Markdown conversion for chat integration

File processing logic in `AttachmentService` (`src/main/services/attachment-service.ts`).

## Key Development Patterns

### IPC Communication
Services expose methods to renderer via decorators:
```typescript
@ipcHandler('methodName')
async someMethod(param: string): Promise<Result> {
  // Implementation
}
```

Frontend calls via bridge:
```typescript
const result = await window.api.serviceName.someMethod(param);
```

### Database Queries
Use Triplit reactive queries in React:
```typescript
const messages = useQuery(client, client.query('messages').where('threadId', '=', threadId));
```

### AI Streaming
Messages support real-time streaming via server-sent events. Check `ChatService` for streaming implementation.

### Theme System
Supports light/dark modes with system preference detection. Theme state managed in `settings` collection.

## File Structure Conventions

### Component Organization
- `src/renderer/components/business/` - Domain-specific components
- `src/renderer/components/ui/` - Reusable UI primitives
- Use React Aria Components for accessibility
- Tailwind CSS for styling

### Service Location
- Main process services: `src/main/services/[name]-service.ts`
- API integrations: `src/main/api/`
- Shared utilities: `src/shared/`

### Type Definitions
- Database types: Auto-generated from Triplit schemas
- Service types: `src/main/shared/types.ts`
- Shared types: `src/shared/types/`

## Testing and Quality

The project uses Biome for linting and TypeScript for type checking. Always run:
1. `yarn typecheck` - Validates all TypeScript
2. `yarn lint` - Checks code style and potential issues
3. `yarn lint:fix` - Auto-fixes formatting issues

## Platform-Specific Notes

### Cross-Platform Building
- Uses electron-builder for packaging
- Supports Windows (x64/ARM64), macOS (Universal/x64/ARM64), Linux (x64/ARM64)
- Build configurations in package.json scripts

### Desktop Integration
- Window state persistence via electron-window-state
- System tray integration
- File associations for supported document types
- Auto-updater integration

## Database Migrations

Triplit uses versioned schema migrations. When modifying database schema:
1. Update schema files in `src/shared/triplit/schemas/`
2. Create migration in `src/shared/triplit/migrations/`
3. Update schema version in migration manager

## Security Considerations

- AGPL-3.0 licensed (open source)
- Sandboxed renderer process
- Preload script provides limited API surface
- No direct Node.js access from renderer
- File uploads sanitized and validated