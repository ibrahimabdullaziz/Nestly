import prisma from "../../../src/db/prisma";

export type TestUserOptions = {
  emailPrefix: string;
  firstName: string;
  lastName: string;
  role?: "ADMIN" | "HOST" | "GUEST";
};

export async function createTestUser(options: TestUserOptions) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return prisma.user.create({
    data: {
      email: `${options.emailPrefix}-${suffix}@example.com`,
      password: "hashed-password",
      firstName: options.firstName,
      lastName: options.lastName,
      role: options.role ?? "GUEST",
    },
  });
}

export async function createTestCountry(prefix: string) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return prisma.country.create({
    data: {
      name: `${prefix} Country ${suffix}`,
      code: `${prefix.slice(0, 3).toUpperCase()}${suffix}`,
    },
  });
}

export function createTestCity(name: string, countryId: string) {
  return prisma.city.create({
    data: { name, countryId },
  });
}

export function createTestCurrency(code: string) {
  return prisma.currency.create({
    data: { code, symbol: "$" },
  });
}

export function createTestCategory(name: string) {
  return prisma.unitCategory.create({
    data: { name },
  });
}

export type TestUnitOptions = {
  ownerId: string;
  cityId: string;
  currencyId: string;
  categoryId: string;
  title: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  isActive?: boolean;
};

export function createTestUnit(options: TestUnitOptions) {
  return prisma.unit.create({
    data: {
      ...options,
      isActive: options.isActive ?? false,
    },
  });
}

export async function cleanupUnitFixture(ids: {
  unitId: string;
  additionalUnitIds?: string[];
  cityId: string;
  countryId: string;
  currencyId: string;
  categoryId: string;
  userIds: string[];
}) {
  const unitIds = [ids.unitId, ...(ids.additionalUnitIds ?? [])];

  await prisma.unitReview.deleteMany({ where: { unitId: { in: unitIds } } });
  await prisma.unitFavorite.deleteMany({ where: { unitId: { in: unitIds } } });
  await prisma.booking.deleteMany({ where: { unitId: { in: unitIds } } });
  await prisma.unit.deleteMany({ where: { id: { in: unitIds } } });
  await prisma.city.delete({ where: { id: ids.cityId } });
  await prisma.country.delete({ where: { id: ids.countryId } });
  await prisma.currency.delete({ where: { id: ids.currencyId } });
  await prisma.unitCategory.delete({ where: { id: ids.categoryId } });

  for (const userId of ids.userIds) {
    await prisma.user.delete({ where: { id: userId } });
  }
}
