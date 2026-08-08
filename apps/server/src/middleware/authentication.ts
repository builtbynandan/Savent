import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';
import {
  getSessionUser,
  sessionCookieName,
} from '../modules/auth/auth.service.js';

export function readSessionToken(cookieHeader: string | undefined) {
  const cookie = cookieHeader
    ?.split(';')
    .map((value) => value.trim().split('='))
    .find(([name]) => name === sessionCookieName);
  return cookie?.slice(1).join('=') || undefined;
}

export const requireAuthentication: RequestHandler = async (
  request,
  response,
  next,
) => {
  const token = readSessionToken(request.headers.cookie);
  const user = token ? await getSessionUser(token) : null;

  if (!user) {
    next(new AppError('Sign in to continue', 401, 'AUTHENTICATION_REQUIRED'));
    return;
  }

  response.locals.user = user;
  response.locals.userId = user.id;
  next();
};
