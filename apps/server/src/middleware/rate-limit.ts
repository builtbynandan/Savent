import { apiErrorSchema } from '@savent/contracts';

import type { RequestHandler } from 'express';

interface RateLimitOptions {
  limit: number;
  windowMilliseconds: number;
}

interface ClientWindow {
  attempts: number;
  resetsAt: number;
}

export function createRateLimiter({
  limit,
  windowMilliseconds,
}: RateLimitOptions): RequestHandler {
  const clients = new Map<string, ClientWindow>();

  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const existing = clients.get(key);
    const client =
      !existing || existing.resetsAt <= now
        ? { attempts: 0, resetsAt: now + windowMilliseconds }
        : existing;

    client.attempts += 1;
    clients.set(key, client);

    const remaining = Math.max(0, limit - client.attempts);
    response.setHeader('RateLimit-Limit', String(limit));
    response.setHeader('RateLimit-Remaining', String(remaining));
    response.setHeader(
      'RateLimit-Reset',
      String(Math.ceil(client.resetsAt / 1000)),
    );

    if (client.attempts > limit) {
      const retryAfter = Math.max(1, Math.ceil((client.resetsAt - now) / 1000));
      response.setHeader('Retry-After', String(retryAfter));
      response.status(429).json(
        apiErrorSchema.parse({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many attempts. Please wait before trying again.',
          },
        }),
      );
      return;
    }

    if (clients.size > 1_000) {
      for (const [clientKey, value] of clients) {
        if (value.resetsAt <= now) clients.delete(clientKey);
      }
    }

    next();
  };
}
