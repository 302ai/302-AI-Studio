import logger from "@shared/logger/renderer-logger";

// Configure logging for renderer process
// The new logger system handles colors and formatting automatically

// Re-export the logger functions for compatibility
export const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info(message, context);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    logger.debug(message, context);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    logger.warn(message, context);
  },
  error: (message: string, context?: Record<string, unknown>) => {
    logger.error(message, context);
  },
  verbose: (message: string, context?: Record<string, unknown>) => {
    logger.debug(message, context); // Map verbose to debug
  },
};

// Set default logging level for renderer
// This can be controlled via the main process
logger.setLoggingEnabled(true);

export default log;
