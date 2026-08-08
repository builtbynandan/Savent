import 'dotenv/config';

import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info('server_started', { port: env.PORT });
});

function shutdown(signal: string) {
  logger.info('shutdown_started', { signal });

  server.close(async (error) => {
    await prisma.$disconnect();

    if (error) {
      logger.error('shutdown_failed', { errorMessage: error.message });
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
