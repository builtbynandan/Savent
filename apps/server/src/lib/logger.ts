import { env } from '../config/env.js';

type LogFields = Record<string, unknown>;
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelPriority: Record<LogLevel | 'silent', number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

function write(level: LogLevel, message: string, fields: LogFields = {}) {
  if (levelPriority[level] < levelPriority[env.LOG_LEVEL]) return;
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'savent-api',
    message,
    release: env.RELEASE_SHA,
    ...fields,
  });

  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug: (message: string, fields?: LogFields) =>
    write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) =>
    write('error', message, fields),
};
