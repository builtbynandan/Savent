import { transactionSchema, type Transaction } from '@savent/contracts';

import type { Prisma } from '../../generated/prisma/client.js';

export const transactionRelations = {
  account: true,
  destinationAccount: true,
  category: true,
} satisfies Prisma.TransactionInclude;

type TransactionRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionRelations;
}>;

export function mapTransaction(record: TransactionRecord): Transaction {
  return transactionSchema.parse({
    id: record.id,
    userId: record.userId,
    accountId: record.accountId,
    destinationAccountId: record.destinationAccountId,
    categoryId: record.categoryId,
    type: record.type.toLowerCase(),
    description: record.description,
    amount: record.amount.toFixed(2),
    currency: record.currency,
    transactionDate: record.transactionDate.toISOString(),
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    account: {
      ...record.account,
      type: record.account.type.toLowerCase(),
    },
    destinationAccount: record.destinationAccount
      ? {
          ...record.destinationAccount,
          type: record.destinationAccount.type.toLowerCase(),
        }
      : null,
    category: record.category
      ? {
          ...record.category,
          kind: record.category.kind.toLowerCase(),
        }
      : null,
  });
}
