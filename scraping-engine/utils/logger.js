import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isDevelopment = process.env.NODE_ENV !== 'production';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        host: bindings.hostname,
        node_version: process.version
      };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// File transport for production
if (!isDevelopment) {
  const streams = [
    {
      level: 'info',
      stream: fs.createWriteStream(path.join(logsDir, 'app.log'), { flags: 'a' })
    },
    {
      level: 'error',
      stream: fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' })
    }
  ];

  // Also log to console in production
  streams.push({ level: 'info', stream: process.stdout });
}

export default logger;
