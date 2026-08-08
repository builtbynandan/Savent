import {
  accountResponseSchema,
  accountsResponseSchema,
  type Account,
  type AccountType as ContractAccountType,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@savent/contracts';

import { AccountType, TransactionType } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';

const accountTypeByContract: Record<ContractAccountType, AccountType> = {
  cash: AccountType.CASH,
  checking: AccountType.CHECKING,
  savings: AccountType.SAVINGS,
  credit: AccountType.CREDIT,
  investment: AccountType.INVESTMENT,
  other: AccountType.OTHER,
};

type AccountRecord = Awaited<ReturnType<typeof findAccount>>;

function money(value: Prisma.Decimal) {
  return value.toFixed(2);
}

async function findAccount(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) {
    throw new AppError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
  }
  return account;
}

async function balances(userId: string, accountIds: string[]) {
  const values = new Map(accountIds.map((id) => [id, new Prisma.Decimal(0)]));
  if (accountIds.length === 0) return values;

  const [sourceTotals, destinationTotals] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['accountId', 'type'],
      where: { userId, accountId: { in: accountIds } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['destinationAccountId'],
      where: {
        userId,
        type: TransactionType.TRANSFER,
        destinationAccountId: { in: accountIds },
      },
      _sum: { amount: true },
    }),
  ]);

  for (const total of sourceTotals) {
    const amount = total._sum.amount ?? new Prisma.Decimal(0);
    if (total.type === TransactionType.INCOME) {
      values.set(
        total.accountId,
        (values.get(total.accountId) ?? new Prisma.Decimal(0)).add(amount),
      );
    } else {
      values.set(
        total.accountId,
        (values.get(total.accountId) ?? new Prisma.Decimal(0)).sub(amount),
      );
    }
  }

  for (const total of destinationTotals) {
    if (!total.destinationAccountId) continue;
    const amount = total._sum.amount ?? new Prisma.Decimal(0);
    values.set(
      total.destinationAccountId,
      (values.get(total.destinationAccountId) ?? new Prisma.Decimal(0)).add(
        amount,
      ),
    );
  }
  return values;
}

function mapAccount(
  account: AccountRecord,
  activityBalance: Prisma.Decimal,
): Account {
  return {
    id: account.id,
    name: account.name,
    type: account.type.toLowerCase() as Account['type'],
    currency: account.currency,
    openingBalance: money(account.openingBalance),
    balance: money(account.openingBalance.add(activityBalance)),
    isArchived: account.isArchived,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

async function ensureUniqueName(userId: string, name: string, id?: string) {
  const duplicate = await prisma.account.findFirst({
    where: {
      userId,
      name: { equals: name, mode: 'insensitive' },
      ...(id ? { id: { not: id } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError(
      'An account with this name already exists',
      409,
      'ACCOUNT_NAME_EXISTS',
    );
  }
}

async function responseFor(userId: string, account: AccountRecord) {
  const activity = await balances(userId, [account.id]);
  return accountResponseSchema.parse({
    data: mapAccount(
      account,
      activity.get(account.id) ?? new Prisma.Decimal(0),
    ),
  });
}

export async function listAccounts(userId: string, includeArchived: boolean) {
  const accounts = await prisma.account.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ isArchived: 'asc' }, { name: 'asc' }],
  });
  const activity = await balances(
    userId,
    accounts.map((account) => account.id),
  );
  return accountsResponseSchema.parse({
    data: accounts.map((account) =>
      mapAccount(account, activity.get(account.id) ?? new Prisma.Decimal(0)),
    ),
  });
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  await ensureUniqueName(userId, input.name);
  const account = await prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: accountTypeByContract[input.type],
      currency: input.currency,
      openingBalance: input.openingBalance,
    },
  });
  return responseFor(userId, account);
}

export async function updateAccount(
  userId: string,
  id: string,
  input: UpdateAccountInput,
) {
  await findAccount(userId, id);
  await ensureUniqueName(userId, input.name, id);
  const account = await prisma.account.update({
    where: { id },
    data: {
      name: input.name,
      type: accountTypeByContract[input.type],
      currency: input.currency,
      openingBalance: input.openingBalance,
    },
  });
  return responseFor(userId, account);
}

export async function setAccountArchived(
  userId: string,
  id: string,
  isArchived: boolean,
) {
  const existing = await findAccount(userId, id);
  if (!existing.isArchived && isArchived) {
    const activeAccounts = await prisma.account.count({
      where: { userId, isArchived: false },
    });
    if (activeAccounts <= 1) {
      throw new AppError(
        'Keep at least one active account',
        409,
        'LAST_ACTIVE_ACCOUNT',
      );
    }
  }
  const account = await prisma.account.update({
    where: { id },
    data: { isArchived },
  });
  return responseFor(userId, account);
}
