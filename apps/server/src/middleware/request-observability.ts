import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

import { logger } from '../lib/logger.js';
import { observeRequest } from '../lib/metrics.js';

export const requestObservability: RequestHandler = (
  request,
  response,
  next,
) => {
  const incomingRequestId = request.header('x-request-id');
  const requestId =
    incomingRequestId && incomingRequestId.length <= 128
      ? incomingRequestId
      : randomUUID();
  const startedAt = process.hrtime.bigint();

  response.locals.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  response.once('finish', () => {
    const durationMilliseconds =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const requestPath =
      response.statusCode === 404
        ? '/unmatched'
        : (request.originalUrl.split('?')[0] ?? request.path);
    observeRequest(
      request.method,
      requestPath,
      response.statusCode,
      durationMilliseconds / 1000,
    );
    logger.info('request_completed', {
      requestId,
      method: request.method,
      path: requestPath,
      status: response.statusCode,
      durationMilliseconds: Math.round(durationMilliseconds * 100) / 100,
    });
  });
  next();
};
