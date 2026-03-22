/**
 * Structured logging utility for CloudWatch
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(formatLog('info', message, meta));
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(formatLog('warn', message, meta));
  },

  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    console.error(
      formatLog('error', message, {
        ...meta,
        error: error?.message,
        stack: process.env.NODE_ENV === 'dev' ? error?.stack : undefined,
      })
    );
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'dev') {
      console.log(formatLog('debug', message, meta));
    }
  },
};

/**
 * Mask sensitive data for logging
 */
export function maskMobile(mobile: string): string {
  if (mobile.length < 4) return '****';
  return `${mobile.slice(0, 2)}****${mobile.slice(-2)}`;
}

export function maskAadhaar(aadhaar: string): string {
  if (aadhaar.length < 4) return '****';
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}
