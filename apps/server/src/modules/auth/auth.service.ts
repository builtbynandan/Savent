import { createHash, randomBytes } from 'node:crypto';

import {
  authResponseSchema,
  logoutResponseSchema,
  type LoginInput,
  type RegisterInput,
} from '@savent/contracts';

import { AccountType, CategoryKind } from '../../generated/prisma/enums.js';
import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from './password.js';

export const sessionCookieName = 'savent_session';
export const sessionDurationMilliseconds = 7 * 24 * 60 * 60 * 1000;

const starterCategories = [
  {
    name: 'Salary',
    kind: CategoryKind.INCOME,
    color: '#16A34A',
    icon: 'wallet',
  },
  {
    name: 'Groceries',
    kind: CategoryKind.EXPENSE,
    color: '#EA580C',
    icon: 'shopping-cart',
  },
  {
    name: 'Dining',
    kind: CategoryKind.EXPENSE,
    color: '#DC2626',
    icon: 'utensils',
  },
  {
    name: 'Transport',
    kind: CategoryKind.EXPENSE,
    color: '#2563EB',
    icon: 'train',
  },
  { name: 'Rent', kind: CategoryKind.EXPENSE, color: '#7C3AED', icon: 'house' },
  {
    name: 'Utilities',
    kind: CategoryKind.EXPENSE,
    color: '#0F766E',
    icon: 'receipt',
  },
  {
    name: 'Health',
    kind: CategoryKind.EXPENSE,
    color: '#DB2777',
    icon: 'heart',
  },
  {
    name: 'Subscriptions',
    kind: CategoryKind.EXPENSE,
    color: '#9333EA',
    icon: 'film',
  },
] as const;

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function mapUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: {
      userId,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + sessionDurationMilliseconds),
    },
  });
  return token;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(
      'An account with this email already exists',
      409,
      'EMAIL_ALREADY_REGISTERED',
    );
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.$transaction(async (transaction) => {
    const created = await transaction.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });

    await transaction.account.createMany({
      data: [
        {
          userId: created.id,
          name: 'Everyday',
          type: AccountType.CHECKING,
          currency: 'AUD',
        },
        {
          userId: created.id,
          name: 'Savings',
          type: AccountType.SAVINGS,
          currency: 'AUD',
        },
      ],
    });
    await transaction.category.createMany({
      data: starterCategories.map((category) => ({
        userId: created.id,
        ...category,
        isSystem: true,
      })),
    });

    return created;
  });

  return {
    body: authResponseSchema.parse({ data: { user: mapUser(user) } }),
    token: await createSession(user.id),
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid =
    user?.passwordHash &&
    (await verifyPassword(input.password, user.passwordHash));

  if (!user || !valid) {
    throw new AppError(
      'Email or password is incorrect',
      401,
      'INVALID_CREDENTIALS',
    );
  }

  return {
    body: authResponseSchema.parse({ data: { user: mapUser(user) } }),
    token: await createSession(user.id),
  };
}

export async function getSessionUser(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return mapUser(session.user);
}

export async function deleteSession(token: string | undefined) {
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  }
  return logoutResponseSchema.parse({ data: { success: true } });
}
