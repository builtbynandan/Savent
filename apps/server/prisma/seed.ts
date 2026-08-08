import 'dotenv/config';

import {
  AccountType,
  CategoryKind,
  TransactionType,
} from '../src/generated/prisma/enums.js';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/modules/auth/password.js';

async function seed() {
  const passwordHash = await hashPassword('Demo1234!');
  const user = await prisma.user.upsert({
    where: {
      email: 'demo@savent.app',
    },
    update: {
      name: 'Ava Nguyen',
      passwordHash,
    },
    create: {
      email: 'demo@savent.app',
      name: 'Ava Nguyen',
      passwordHash,
    },
  });

  const everyday = await prisma.account.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: 'Everyday',
      },
    },
    update: {},
    create: {
      userId: user.id,
      name: 'Everyday',
      type: AccountType.CHECKING,
      currency: 'AUD',
      openingBalance: '2400.00',
    },
  });

  const savings = await prisma.account.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: 'Savings',
      },
    },
    update: {},
    create: {
      userId: user.id,
      name: 'Savings',
      type: AccountType.SAVINGS,
      currency: 'AUD',
      openingBalance: '10000.00',
    },
  });

  const categoryDefinitions = [
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
    {
      name: 'Rent',
      kind: CategoryKind.EXPENSE,
      color: '#7C3AED',
      icon: 'house',
    },
  ] as const;

  const categories = await Promise.all(
    categoryDefinitions.map((category) =>
      prisma.category.upsert({
        where: {
          userId_name_kind: {
            userId: user.id,
            name: category.name,
            kind: category.kind,
          },
        },
        update: {
          color: category.color,
          icon: category.icon,
        },
        create: {
          userId: user.id,
          ...category,
          isSystem: true,
        },
      }),
    ),
  );

  const categoryByName = new Map(
    categories.map((category) => [category.name, category]),
  );

  await prisma.transaction.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Salary')?.id,
        type: TransactionType.INCOME,
        description: 'May salary',
        amount: '3180.00',
        currency: 'AUD',
        transactionDate: new Date('2026-05-25T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Groceries')?.id,
        type: TransactionType.EXPENSE,
        description: 'May groceries',
        amount: '412.30',
        currency: 'AUD',
        transactionDate: new Date('2026-05-28T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Salary')?.id,
        type: TransactionType.INCOME,
        description: 'June salary',
        amount: '3214.00',
        currency: 'AUD',
        transactionDate: new Date('2026-06-25T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Rent')?.id,
        type: TransactionType.EXPENSE,
        description: 'June rent',
        amount: '1800.00',
        currency: 'AUD',
        transactionDate: new Date('2026-06-02T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Salary')?.id,
        type: TransactionType.INCOME,
        description: 'Salary',
        amount: '3214.00',
        currency: 'AUD',
        transactionDate: new Date('2026-07-25T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Groceries')?.id,
        type: TransactionType.EXPENSE,
        description: 'Woolworths',
        amount: '128.40',
        currency: 'AUD',
        transactionDate: new Date('2026-07-28T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        destinationAccountId: savings.id,
        type: TransactionType.TRANSFER,
        description: 'Monthly savings',
        amount: '800.00',
        currency: 'AUD',
        transactionDate: new Date('2026-07-29T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Salary')?.id,
        type: TransactionType.INCOME,
        description: 'August salary',
        amount: '3300.00',
        currency: 'AUD',
        transactionDate: new Date('2026-08-05T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Groceries')?.id,
        type: TransactionType.EXPENSE,
        description: 'Weekly groceries',
        amount: '145.60',
        currency: 'AUD',
        transactionDate: new Date('2026-08-03T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Dining')?.id,
        type: TransactionType.EXPENSE,
        description: 'Dinner with friends',
        amount: '62.50',
        currency: 'AUD',
        transactionDate: new Date('2026-08-06T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Rent')?.id,
        type: TransactionType.EXPENSE,
        description: 'August rent',
        amount: '1800.00',
        currency: 'AUD',
        transactionDate: new Date('2026-08-01T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Transport')?.id,
        type: TransactionType.EXPENSE,
        description: 'Opal top up',
        amount: '48.00',
        currency: 'AUD',
        transactionDate: new Date('2026-08-07T00:00:00.000Z'),
      },
    ],
  });

  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: categoryByName.get('Groceries')!.id,
        month: new Date('2026-08-01T00:00:00.000Z'),
        amount: '500.00',
      },
      {
        userId: user.id,
        categoryId: categoryByName.get('Dining')!.id,
        month: new Date('2026-08-01T00:00:00.000Z'),
        amount: '250.00',
      },
      {
        userId: user.id,
        categoryId: categoryByName.get('Transport')!.id,
        month: new Date('2026-08-01T00:00:00.000Z'),
        amount: '180.00',
      },
      {
        userId: user.id,
        categoryId: categoryByName.get('Rent')!.id,
        month: new Date('2026-08-01T00:00:00.000Z'),
        amount: '1800.00',
      },
    ],
  });

  console.log(`Seeded Savent demo data for ${user.email}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
