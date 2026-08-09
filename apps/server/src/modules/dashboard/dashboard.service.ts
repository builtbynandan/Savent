import {
  budgetResponseSchema,
  dashboardResponseSchema,
  deleteBudgetResponseSchema,
  type BudgetInput,
  type BudgetProgress,
  type DashboardQuery,
} from '@savent/contracts';

import { CategoryKind, TransactionType } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';

const zero = () => new Prisma.Decimal(0);

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthDate(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`);
}

function monthBounds(month: string) {
  const start = monthDate(month);
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  return { start, end };
}

function money(value: Prisma.Decimal) {
  return value.toFixed(2);
}

function progressStatus(percentage: number): BudgetProgress['status'] {
  if (percentage > 100) return 'over_budget';
  if (percentage >= 80) return 'near_limit';
  return 'on_track';
}

async function budgetProgress(userId: string, month: string) {
  const { start, end } = monthBounds(month);
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month: start },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: TransactionType.EXPENSE,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    }),
  ]);

  const spentByCategory = new Map(
    expenses.map((expense) => [
      expense.categoryId,
      expense._sum.amount ?? zero(),
    ]),
  );

  return budgets.map((budget) => {
    const amount = budget.amount;
    const spent = spentByCategory.get(budget.categoryId) ?? zero();
    const percentage = amount.gt(0) ? spent.div(amount).mul(100).toNumber() : 0;
    return {
      id: budget.id,
      category: {
        id: budget.category.id,
        name: budget.category.name,
        color: budget.category.color,
        isArchived: budget.category.isArchived,
      },
      month,
      amount: money(amount),
      spent: money(spent),
      remaining: money(amount.sub(spent)),
      percentage: Math.round(percentage * 10) / 10,
      status: progressStatus(percentage),
    } satisfies BudgetProgress;
  });
}

export async function getDashboard(userId: string, query: DashboardQuery) {
  const month = query.month ?? currentMonth();
  const { start, end } = monthBounds(month);
  const reportStart = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 5, 1),
  );

  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    select: { id: true, openingBalance: true },
  });
  const activeAccountIds = accounts.map((account) => account.id);

  const [sourceBalances, destinationBalances, reportTransactions, budgets] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ['accountId', 'type'],
        where: {
          userId,
          accountId: { in: activeAccountIds },
          transactionDate: { lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['destinationAccountId'],
        where: {
          userId,
          type: TransactionType.TRANSFER,
          destinationAccountId: { in: activeAccountIds },
          transactionDate: { lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: { gte: reportStart, lt: end },
        },
        select: {
          type: true,
          amount: true,
          transactionDate: true,
          categoryId: true,
          category: { select: { name: true, color: true } },
        },
      }),
      budgetProgress(userId, month),
    ]);

  const openingBalance = accounts.reduce(
    (total, account) => total.add(account.openingBalance),
    zero(),
  );
  const sourceBalance = sourceBalances.reduce((total, group) => {
    const amount = group._sum.amount ?? zero();
    return group.type === TransactionType.INCOME
      ? total.add(amount)
      : total.sub(amount);
  }, openingBalance);
  const balance = destinationBalances.reduce(
    (total, group) => total.add(group._sum.amount ?? zero()),
    sourceBalance,
  );

  const selectedTransactions = reportTransactions.filter(
    (transaction) =>
      transaction.transactionDate >= start && transaction.transactionDate < end,
  );
  const income = selectedTransactions
    .filter((transaction) => transaction.type === TransactionType.INCOME)
    .reduce((total, transaction) => total.add(transaction.amount), zero());
  const expenses = selectedTransactions
    .filter((transaction) => transaction.type === TransactionType.EXPENSE)
    .reduce((total, transaction) => total.add(transaction.amount), zero());
  const savings = income.sub(expenses);

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(
        reportStart.getUTCFullYear(),
        reportStart.getUTCMonth() + index,
        1,
      ),
    );
    const key = date.toISOString().slice(0, 7);
    const values = reportTransactions.filter(
      (transaction) =>
        transaction.transactionDate.toISOString().slice(0, 7) === key,
    );
    const totalFor = (type: TransactionType) =>
      values
        .filter((transaction) => transaction.type === type)
        .reduce((total, transaction) => total.add(transaction.amount), zero());
    return {
      month: key,
      label: new Intl.DateTimeFormat('en-AU', {
        month: 'short',
        timeZone: 'UTC',
      }).format(date),
      income: money(totalFor(TransactionType.INCOME)),
      expenses: money(totalFor(TransactionType.EXPENSE)),
    };
  });

  const categoryMap = new Map<
    string,
    {
      categoryId: string | null;
      name: string;
      color: string;
      amount: Prisma.Decimal;
    }
  >();
  selectedTransactions
    .filter((transaction) => transaction.type === TransactionType.EXPENSE)
    .forEach((transaction) => {
      const key = transaction.categoryId ?? 'uncategorised';
      const current = categoryMap.get(key) ?? {
        categoryId: transaction.categoryId,
        name: transaction.category?.name ?? 'Uncategorised',
        color: transaction.category?.color ?? '#94A3B8',
        amount: zero(),
      };
      current.amount = current.amount.add(transaction.amount);
      categoryMap.set(key, current);
    });
  const categories = [...categoryMap.values()]
    .sort((left, right) => right.amount.comparedTo(left.amount))
    .map((category) => ({
      ...category,
      amount: money(category.amount),
      percentage: expenses.gt(0)
        ? Math.round(category.amount.div(expenses).mul(1000).toNumber()) / 10
        : 0,
    }));

  const allocated = budgets.reduce(
    (total, budget) => total.add(budget.amount),
    zero(),
  );
  const budgetSpent = budgets.reduce(
    (total, budget) => total.add(budget.spent),
    zero(),
  );

  return dashboardResponseSchema.parse({
    data: {
      month,
      summary: {
        balance: money(balance),
        income: money(income),
        expenses: money(expenses),
        savings: money(savings),
        savingsRate: income.gt(0)
          ? Math.round(savings.div(income).mul(1000).toNumber()) / 10
          : 0,
        transactionCount: selectedTransactions.length,
      },
      budgets: {
        allocated: money(allocated),
        spent: money(budgetSpent),
        remaining: money(allocated.sub(budgetSpent)),
        items: budgets,
      },
      report: { monthly, categories },
    },
  });
}

async function validateExpenseCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
      kind: CategoryKind.EXPENSE,
      isArchived: false,
    },
    select: { id: true },
  });
  if (!category) {
    throw new AppError(
      'Select an available expense category',
      400,
      'INVALID_BUDGET_CATEGORY',
    );
  }
}

async function findBudgetProgress(userId: string, id: string, month: string) {
  const item = (await budgetProgress(userId, month)).find(
    (budget) => budget.id === id,
  );
  if (!item) throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
  return budgetResponseSchema.parse({ data: item });
}

export async function createBudget(userId: string, input: BudgetInput) {
  await validateExpenseCategory(userId, input.categoryId);
  const existing = await prisma.budget.findUnique({
    where: {
      userId_categoryId_month: {
        userId,
        categoryId: input.categoryId,
        month: monthDate(input.month),
      },
    },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(
      'This category already has a budget for the selected month',
      409,
      'BUDGET_ALREADY_EXISTS',
    );
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      categoryId: input.categoryId,
      month: monthDate(input.month),
      amount: input.amount,
    },
  });
  return findBudgetProgress(userId, budget.id, input.month);
}

export async function updateBudget(
  userId: string,
  id: string,
  input: BudgetInput,
) {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing)
    throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
  await validateExpenseCategory(userId, input.categoryId);
  const conflicting = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: input.categoryId,
      month: monthDate(input.month),
      id: { not: id },
    },
    select: { id: true },
  });
  if (conflicting) {
    throw new AppError(
      'This category already has a budget for the selected month',
      409,
      'BUDGET_ALREADY_EXISTS',
    );
  }

  await prisma.budget.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      month: monthDate(input.month),
      amount: input.amount,
    },
  });
  return findBudgetProgress(userId, id, input.month);
}

export async function deleteBudget(userId: string, id: string) {
  const existing = await prisma.budget.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing)
    throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
  await prisma.budget.delete({ where: { id } });
  return deleteBudgetResponseSchema.parse({ data: { id } });
}
