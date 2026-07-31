import {
  transactionOptionsResponseSchema,
  transactionResponseSchema,
  transactionsResponseSchema,
  type CreateTransactionInput,
  type TransactionType as ContractTransactionType,
} from '@savent/contracts';

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

export async function listTransactions() {
  const userId = await getDemoUserId();
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: transactionRelations,
    orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
  });

  return transactionsResponseSchema.parse({
    data: transactions.map(mapTransaction),
  });
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

export async function createTransaction(input: CreateTransactionInput) {
  const userId = await getDemoUserId();
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

  const createdTransaction = await prisma.transaction.create({
    data: {
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
    },
  });
  const transaction = await prisma.transaction.findUniqueOrThrow({
    where: { id: createdTransaction.id },
    include: transactionRelations,
  });

  return transactionResponseSchema.parse({
    data: mapTransaction(transaction),
  });
}
