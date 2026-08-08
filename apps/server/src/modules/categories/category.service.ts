import {
  categoriesResponseSchema,
  categoryResponseSchema,
  type Category,
  type CategoryKind as ContractCategoryKind,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@savent/contracts';

import { CategoryKind } from '../../generated/prisma/enums.js';
import { AppError } from '../../errors/app-error.js';
import { prisma } from '../../lib/prisma.js';

const categoryKindByContract: Record<ContractCategoryKind, CategoryKind> = {
  income: CategoryKind.INCOME,
  expense: CategoryKind.EXPENSE,
};

const relations = {
  _count: { select: { transactions: true, budgets: true } },
} as const;

async function findCategory(userId: string, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, userId },
    include: relations,
  });
  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }
  return category;
}

type CategoryRecord = Awaited<ReturnType<typeof findCategory>>;

function mapCategory(category: CategoryRecord): Category {
  return {
    id: category.id,
    name: category.name,
    kind: category.kind.toLowerCase() as Category['kind'],
    color: category.color ?? '#64748B',
    icon: (category.icon ?? 'tag') as Category['icon'],
    isSystem: category.isSystem,
    isArchived: category.isArchived,
    transactionCount: category._count.transactions,
    budgetCount: category._count.budgets,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

async function ensureUniqueName(
  userId: string,
  name: string,
  kind: CategoryKind,
  id?: string,
) {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      kind,
      name: { equals: name, mode: 'insensitive' },
      ...(id ? { id: { not: id } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError(
      `An ${kind.toLowerCase()} category with this name already exists`,
      409,
      'CATEGORY_NAME_EXISTS',
    );
  }
}

export async function listCategories(userId: string, includeArchived: boolean) {
  const categories = await prisma.category.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    include: relations,
    orderBy: [{ isArchived: 'asc' }, { kind: 'asc' }, { name: 'asc' }],
  });
  return categoriesResponseSchema.parse({
    data: categories.map(mapCategory),
  });
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
) {
  const kind = categoryKindByContract[input.kind];
  await ensureUniqueName(userId, input.name, kind);
  const category = await prisma.category.create({
    data: {
      userId,
      name: input.name,
      kind,
      color: input.color.toUpperCase(),
      icon: input.icon,
    },
    include: relations,
  });
  return categoryResponseSchema.parse({ data: mapCategory(category) });
}

export async function updateCategory(
  userId: string,
  id: string,
  input: UpdateCategoryInput,
) {
  const existing = await findCategory(userId, id);
  if (existing.isSystem) {
    throw new AppError(
      'Starter categories cannot be renamed or redesigned',
      403,
      'SYSTEM_CATEGORY_READ_ONLY',
    );
  }
  await ensureUniqueName(userId, input.name, existing.kind, id);
  const category = await prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      color: input.color.toUpperCase(),
      icon: input.icon,
    },
    include: relations,
  });
  return categoryResponseSchema.parse({ data: mapCategory(category) });
}

export async function setCategoryArchived(
  userId: string,
  id: string,
  isArchived: boolean,
) {
  await findCategory(userId, id);
  const category = await prisma.category.update({
    where: { id },
    data: { isArchived },
    include: relations,
  });
  return categoryResponseSchema.parse({ data: mapCategory(category) });
}
