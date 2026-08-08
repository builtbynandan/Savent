import {
  deleteTransactionResponseSchema,
  transactionOptionsResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  type CreateTransactionInput,
  type TransactionQuery,
  type TransactionType as ContractTransactionType,
  type UpdateTransactionInput,
} from '@savent/contracts';

import type { Prisma } from '../../generated/prisma/client.js';
import { CategoryKind, TransactionType } from '../../generated/prisma/enums.js';
import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';
import { mapTransaction, transactionRelations } from './transaction.mapper.js';

const demoUserEmail = 'demo@savent.app';
const transactionTypeByContract: Record<
  ContractTransactionType,
  TransactionType
> = {
  income: TransactionType.INCOME,
  expense: TransactionType.EXPENSE,
  transfer: TransactionType.TRANSFER,
};

async function getDemoUserId() {
  const user = await prisma.user.findUnique({
    where: { email: demoUserEmail },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(
      'Run npm run db:seed to create the development user',
      503,
      'DEMO_USER_UNAVAILABLE',
    );
  }

  return user.id;
}

function buildTransactionWhere(userId: string, query: TransactionQuery) {
  const conditions: Prisma.TransactionWhereInput[] = [];

  if (query.search) {
    conditions.push({
      OR: [
        { description: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (query.accountId) {
    conditions.push({
      OR: [
        { accountId: query.accountId },
        { destinationAccountId: query.accountId },
      ],
    });
  }

  const transactionDate =
    query.dateFrom || query.dateTo
      ? {
          ...(query.dateFrom
            ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }
            : {}),
          ...(query.dateTo
            ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }
            : {}),
        }
      : undefined;

  return {
    userId,
    ...(query.type ? { type: transactionTypeByContract[query.type] } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(transactionDate ? { transactionDate } : {}),
    ...(conditions.length > 0 ? { AND: conditions } : {}),
  } satisfies Prisma.TransactionWhereInput;
}

function getTransactionOrderBy(query: TransactionQuery) {
  const orderBy: Record<
    TransactionQuery['sort'],
    Prisma.TransactionOrderByWithRelationInput[]
  > = {
    date_desc: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    date_asc: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
    amount_desc: [{ amount: 'desc' }, { transactionDate: 'desc' }],
    amount_asc: [{ amount: 'asc' }, { transactionDate: 'desc' }],
  };

  return orderBy[query.sort];
}

export async function listTransactions(query: TransactionQuery) {
  const userId = await getDemoUserId();
  const where = buildTransactionWhere(userId, query);
  const transactions = await prisma.transaction.findMany({
    where,
    include: transactionRelations,
    orderBy: getTransactionOrderBy(query),
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
  const totalItems = await prisma.transaction.count({ where });
  const totals = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      AND: [
        where,
        { type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] } },
      ],
    },
    _sum: { amount: true },
  });

  const totalFor = (type: TransactionType) =>
    totals.find((total) => total.type === type)?._sum.amount?.toFixed(2) ??
    '0.00';

  return transactionsResponseSchema.parse({
    data: transactions.map(mapTransaction),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / query.pageSize),
    },
    summary: {
      income: totalFor(TransactionType.INCOME),
      expenses: totalFor(TransactionType.EXPENSE),
    },
  });
}

export async function getTransaction(id: string) {
  const userId = await getDemoUserId();
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: transactionRelations,
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  return transactionResponseSchema.parse({ data: mapTransaction(transaction) });
}

export async function getTransactionOptions() {
  const userId = await getDemoUserId();
  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: { name: 'asc' },
  });
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
  });

  return transactionOptionsResponseSchema.parse({
    data: {
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type.toLowerCase(),
        currency: account.currency,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        kind: category.kind.toLowerCase(),
        color: category.color,
        icon: category.icon,
      })),
    },
  });
}

async function validateTransactionReferences(
  userId: string,
  input: CreateTransactionInput | UpdateTransactionInput,
) {
  const accountIds = [
    input.accountId,
    ...(input.destinationAccountId ? [input.destinationAccountId] : []),
  ];

  const accounts = await prisma.account.findMany({
    where: {
      id: { in: accountIds },
      userId,
      isArchived: false,
    },
  });
  const category = input.categoryId
    ? await prisma.category.findFirst({
        where: { id: input.categoryId, userId },
      })
    : null;

  if (accounts.length !== new Set(accountIds).size) {
    throw new AppError(
      'One or more selected accounts are unavailable',
      400,
      'INVALID_ACCOUNT',
    );
  }

  const sourceAccount = accounts.find(
    (account) => account.id === input.accountId,
  );

  if (!sourceAccount) {
    throw new AppError(
      'The selected account is unavailable',
      400,
      'INVALID_ACCOUNT',
    );
  }

  if (sourceAccount.currency !== input.currency) {
    throw new AppError(
      'The transaction currency must match the source account',
      400,
      'CURRENCY_MISMATCH',
    );
  }

  const destinationAccount = input.destinationAccountId
    ? accounts.find((account) => account.id === input.destinationAccountId)
    : null;

  if (
    destinationAccount &&
    destinationAccount.currency !== sourceAccount.currency
  ) {
    throw new AppError(
      'Transfers between different currencies are not supported yet',
      400,
      'TRANSFER_CURRENCY_MISMATCH',
    );
  }

  if (input.categoryId && !category) {
    throw new AppError(
      'The selected category is unavailable',
      400,
      'INVALID_CATEGORY',
    );
  }

  const expectedCategoryKind =
    input.type === 'income' ? CategoryKind.INCOME : CategoryKind.EXPENSE;

  if (
    input.type !== 'transfer' &&
    category &&
    category.kind !== expectedCategoryKind
  ) {
    throw new AppError(
      `Select an ${input.type} category for this transaction`,
      400,
      'CATEGORY_TYPE_MISMATCH',
    );
  }

  if (input.type === 'transfer' && category) {
    throw new AppError(
      'Transfers cannot have a category',
      400,
      'TRANSFER_CATEGORY_NOT_ALLOWED',
    );
  }
}

function transactionData(
  userId: string,
  input: CreateTransactionInput | UpdateTransactionInput,
) {
  return {
    userId,
    accountId: input.accountId,
    destinationAccountId: input.destinationAccountId ?? null,
    categoryId: input.categoryId,
    type: transactionTypeByContract[input.type],
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    transactionDate: new Date(input.transactionDate),
    notes: input.notes ?? null,
  };
}

export async function createTransaction(input: CreateTransactionInput) {
  const userId = await getDemoUserId();
  await validateTransactionReferences(userId, input);

  const createdTransaction = await prisma.transaction.create({
    data: transactionData(userId, input),
  });
  const transaction = await prisma.transaction.findUniqueOrThrow({
    where: { id: createdTransaction.id },
    include: transactionRelations,
  });

  return transactionResponseSchema.parse({
    data: mapTransaction(transaction),
  });
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
) {
  const userId = await getDemoUserId();
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  await validateTransactionReferences(userId, input);
  await prisma.transaction.update({
    where: { id },
    data: transactionData(userId, input),
  });

  return getTransaction(id);
}

export async function deleteTransaction(id: string) {
  const userId = await getDemoUserId();
  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
  }

  await prisma.transaction.delete({ where: { id } });
  return deleteTransactionResponseSchema.parse({ data: { id } });
}
