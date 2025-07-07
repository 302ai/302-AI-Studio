# Logger System

A modern logging system for Electron applications with separate implementations for main and renderer processes.

## Architecture

The logger system consists of:

- **Base Logger** (`base-logger.ts`): Core logging functionality with formatting and colorization
- **Main Logger** (`main-logger.ts`): Logger for the main process with file logging support
- **Renderer Logger** (`renderer-logger.ts`): Logger for renderer processes (console only)

## Usage

### Main Process

```typescript
// Direct import
import logger from "@shared/logger/main-logger";

// Direct import
import logger from "@shared/logger/main-logger";

// Log messages
logger.info("Application started");
logger.error("An error occurred", { userId: 123, action: "login" });
logger.warn("Warning message");
logger.debug("Debug information");

// Enable/disable logging
import { setLoggingEnabled } from "@shared/logger/main-logger";
setLoggingEnabled(true);
```

### Renderer Process

```typescript
// Direct import
import logger from "@shared/logger/renderer-logger";

// Log messages
logger.info("Component mounted");
logger.error("API call failed", { endpoint: "/api/users" });
logger.warn("Deprecated feature used");
logger.debug("State updated");

// Enable/disable logging
import { setLoggingEnabled } from "@shared/logger/renderer-logger";
setLoggingEnabled(true);
```

## API Reference

### Logger Methods

- `debug(message: string, context?: Record<string, unknown>)`: Debug level logging
- `info(message: string, context?: Record<string, unknown>)`: Info level logging  
- `warn(message: string, context?: Record<string, unknown>)`: Warning level logging
- `error(message: string, context?: Record<string, unknown>)`: Error level logging

### Configuration

- `setLoggingEnabled(enabled: boolean)`: Enable or disable logging

### Context Logging

You can pass additional context data that will be formatted appropriately:

```typescript
logger.info("User action completed", {
  userId: 123,
  action: "file_upload",
  fileSize: 1024000,
  metadata: { type: "image", format: "png" }
});
```

## Log Levels

- `DEBUG = 0`: Detailed debugging information
- `INFO = 1`: General information messages
- `WARN = 2`: Warning messages
- `ERROR = 3`: Error messages

## File Logging (Main Process Only)

The main process logger automatically writes logs to:
- Path: `{userData}/logs/main.log`
- Max size: 10MB (configurable)
- Format: `[timestamp] LEVEL: message context`

## Output Format

Console output includes:
- Timestamp (ISO 8601 format)
- Log level (color-coded)
- Message
- Context data (pretty-printed for large objects)

Example output:
```
2024-01-15T10:30:45.123Z INFO  Application started
2024-01-15T10:30:45.124Z ERROR An error occurred userId=123 action="login"
```

## Migration from electron-log

Replace:
```typescript
// Old
import Logger from "electron-log";
Logger.info("message");

// New - Main Process
import logger from "@shared/logger/main-logger";
logger.info("message");

// New - Renderer Process  
import logger from "@shared/logger/renderer-logger";
logger.info("message");
```

## Child Loggers

Create child loggers with additional context:

```typescript
const childLogger = logger.child({ component: "UserService" });
childLogger.info("User created"); // Will include component context
```

## Best Practices

1. Use appropriate log levels
2. Include relevant context data
3. Enable logging in development, configure appropriately for production
4. Use child loggers for component-specific logging
5. Keep log messages concise but informative