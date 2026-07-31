import 'dotenv/config';

import { app } from './app.js';
import { prisma } from './lib/prisma.js';

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Savent API running at http://localhost:${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down Savent API`);

  server.close(async (error) => {
    await prisma.$disconnect();

    if (error) {
      console.error('Failed to close the HTTP server cleanly', error);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
