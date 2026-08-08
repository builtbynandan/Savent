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

  // Keep repeated local/CI seeds deterministic even after the demo workspace
  // has been edited through the UI. Sessions intentionally remain valid.
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  const everyday = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Everyday',
      type: AccountType.CHECKING,
      currency: 'AUD',
      openingBalance: '2400.00',
    },
  });

  const savings = await prisma.account.create({
    data: {
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

  const categories = await Promise.all(
    categoryDefinitions.map((category) =>
      prisma.category.create({
        data: {
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

  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Salary')?.id,
        type: TransactionType.INCOME,
        description: 'March salary',
        amount: '3100.00',
        currency: 'AUD',
        transactionDate: new Date('2026-03-25T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Rent')?.id,
        type: TransactionType.EXPENSE,
        description: 'March rent',
        amount: '1750.00',
        currency: 'AUD',
        transactionDate: new Date('2026-03-02T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Groceries')?.id,
        type: TransactionType.EXPENSE,
        description: 'Coles and market shops',
        amount: '268.45',
        currency: 'AUD',
        transactionDate: new Date('2026-03-18T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Utilities')?.id,
        type: TransactionType.EXPENSE,
        description: 'Electricity and internet',
        amount: '138.20',
        currency: 'AUD',
        transactionDate: new Date('2026-03-12T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Health')?.id,
        type: TransactionType.EXPENSE,
        description: 'Pharmacy',
        amount: '62.00',
        currency: 'AUD',
        transactionDate: new Date('2026-03-09T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Salary')?.id,
        type: TransactionType.INCOME,
        description: 'April salary',
        amount: '3120.00',
        currency: 'AUD',
        transactionDate: new Date('2026-04-24T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Rent')?.id,
        type: TransactionType.EXPENSE,
        description: 'April rent',
        amount: '1750.00',
        currency: 'AUD',
        transactionDate: new Date('2026-04-02T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Groceries')?.id,
        type: TransactionType.EXPENSE,
        description: 'Weekly groceries',
        amount: '302.18',
        currency: 'AUD',
        transactionDate: new Date('2026-04-19T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Subscriptions')?.id,
        type: TransactionType.EXPENSE,
        description: 'Streaming subscription',
        amount: '24.99',
        currency: 'AUD',
        transactionDate: new Date('2026-04-11T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Transport')?.id,
        type: TransactionType.EXPENSE,
        description: 'Opal top up',
        amount: '42.00',
        currency: 'AUD',
        transactionDate: new Date('2026-04-07T00:00:00.000Z'),
      },
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
        categoryId: categoryByName.get('Rent')?.id,
        type: TransactionType.EXPENSE,
        description: 'May rent',
        amount: '1750.00',
        currency: 'AUD',
        transactionDate: new Date('2026-05-02T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Utilities')?.id,
        type: TransactionType.EXPENSE,
        description: 'Internet and electricity',
        amount: '149.30',
        currency: 'AUD',
        transactionDate: new Date('2026-05-13T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Dining')?.id,
        type: TransactionType.EXPENSE,
        description: 'Birthday dinner',
        amount: '84.20',
        currency: 'AUD',
        transactionDate: new Date('2026-05-17T00:00:00.000Z'),
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
        categoryId: categoryByName.get('Groceries')?.id,
        type: TransactionType.EXPENSE,
        description: 'June groceries',
        amount: '278.66',
        currency: 'AUD',
        transactionDate: new Date('2026-06-18T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Utilities')?.id,
        type: TransactionType.EXPENSE,
        description: 'Household utilities',
        amount: '142.00',
        currency: 'AUD',
        transactionDate: new Date('2026-06-12T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Health')?.id,
        type: TransactionType.EXPENSE,
        description: 'Dental check-up',
        amount: '55.90',
        currency: 'AUD',
        transactionDate: new Date('2026-06-09T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Transport')?.id,
        type: TransactionType.EXPENSE,
        description: 'Opal top up',
        amount: '45.00',
        currency: 'AUD',
        transactionDate: new Date('2026-06-06T00:00:00.000Z'),
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
        categoryId: categoryByName.get('Rent')?.id,
        type: TransactionType.EXPENSE,
        description: 'July rent',
        amount: '1800.00',
        currency: 'AUD',
        transactionDate: new Date('2026-07-02T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Dining')?.id,
        type: TransactionType.EXPENSE,
        description: 'Lunch with colleagues',
        amount: '71.80',
        currency: 'AUD',
        transactionDate: new Date('2026-07-16T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Subscriptions')?.id,
        type: TransactionType.EXPENSE,
        description: 'Streaming subscription',
        amount: '24.99',
        currency: 'AUD',
        transactionDate: new Date('2026-07-11T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Utilities')?.id,
        type: TransactionType.EXPENSE,
        description: 'Quarterly water bill',
        amount: '150.12',
        currency: 'AUD',
        transactionDate: new Date('2026-07-08T00:00:00.000Z'),
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
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Utilities')?.id,
        type: TransactionType.EXPENSE,
        description: 'Electricity and internet',
        amount: '151.75',
        currency: 'AUD',
        transactionDate: new Date('2026-08-08T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Subscriptions')?.id,
        type: TransactionType.EXPENSE,
        description: 'Streaming subscription',
        amount: '24.99',
        currency: 'AUD',
        transactionDate: new Date('2026-08-04T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Health')?.id,
        type: TransactionType.EXPENSE,
        description: 'Physio appointment',
        amount: '89.50',
        currency: 'AUD',
        transactionDate: new Date('2026-08-08T00:00:00.000Z'),
      },
      {
        userId: user.id,
        accountId: everyday.id,
        categoryId: categoryByName.get('Dining')?.id,
        type: TransactionType.EXPENSE,
        description: 'Coffee and breakfast',
        amount: '18.50',
        currency: 'AUD',
        transactionDate: new Date('2026-08-08T00:00:00.000Z'),
      },
    ],
  });

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
      {
        userId: user.id,
        categoryId: categoryByName.get('Utilities')!.id,
        month: new Date('2026-08-01T00:00:00.000Z'),
        amount: '300.00',
      },
      {
        userId: user.id,
        categoryId: categoryByName.get('Health')!.id,
        month: new Date('2026-08-01T00:00:00.000Z'),
        amount: '200.00',
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
