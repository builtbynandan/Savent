import {
  authResponseSchema,
  loginSchema,
  registerSchema,
} from '@savent/contracts';
import { Router } from 'express';

import { env } from '../../config/env.js';
import {
  readSessionToken,
  requireAuthentication,
} from '../../middleware/authentication.js';
import {
  deleteSession,
  login,
  register,
  sessionCookieName,
  sessionDurationMilliseconds,
} from './auth.service.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  maxAge: sessionDurationMilliseconds,
  path: '/',
  sameSite: 'lax' as const,
  secure: env.SESSION_COOKIE_SECURE,
};

authRouter.post('/register', async (request, response) => {
  const input = registerSchema.parse(request.body);
  const result = await register(input);
  response.cookie(sessionCookieName, result.token, cookieOptions);
  response.status(201).json(result.body);
});

authRouter.post('/login', async (request, response) => {
  const input = loginSchema.parse(request.body);
  const result = await login(input);
  response.cookie(sessionCookieName, result.token, cookieOptions);
  response.status(200).json(result.body);
});

authRouter.post('/logout', async (request, response) => {
  const body = await deleteSession(readSessionToken(request.headers.cookie));
  response.clearCookie(sessionCookieName, cookieOptions);
  response.status(200).json(body);
});

authRouter.get('/me', requireAuthentication, (_request, response) => {
  response
    .status(200)
    .json(authResponseSchema.parse({ data: { user: response.locals.user } }));
});
