import { apiErrorSchema } from '@savent/contracts';
import { ZodError } from 'zod';

import type { ErrorRequestHandler, RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

export const notFoundHandler: RequestHandler = (request, response) => {
  const body = apiErrorSchema.parse({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.path} was not found`,
    },
  });

  response.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  void next;

  if (error instanceof AppError) {
    const body = apiErrorSchema.parse({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });

    response.status(error.statusCode).json(body);
    return;
  }

  if (error instanceof ZodError) {
    const body = apiErrorSchema.parse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request did not pass validation',
        details: error.issues,
      },
    });

    response.status(400).json(body);
    return;
  }

  console.error(error);

  const body = apiErrorSchema.parse({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });

  response.status(500).json(body);
};
