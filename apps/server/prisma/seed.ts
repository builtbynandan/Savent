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
