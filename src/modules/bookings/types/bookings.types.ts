import type { Prisma } from "@prisma/client";

export type BookingPrisma = {
  unit: {
    findUnique: (
      args: Prisma.UnitFindUniqueArgs,
    ) => Promise<{ pricePerNight: number | string } | null>;
  };
  booking: {
    findFirst: (
      args: Prisma.BookingFindFirstArgs,
    ) => Promise<Record<string, any> | null>;
    create: (args: Prisma.BookingCreateArgs) => Promise<Record<string, any>>;
    update: (args: Prisma.BookingUpdateArgs) => Promise<Record<string, any>>;
    findMany: (
      args: Prisma.BookingFindManyArgs,
    ) => Promise<Record<string, any>[]>;
  };
  $transaction: <T>(
    callback: (transaction: BookingTransaction) => Promise<T>,
  ) => Promise<T>;
};

export type BookingTransaction = {
  $queryRaw: <T>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
  booking: {
    findFirst: (
      args: Prisma.BookingFindFirstArgs,
    ) => Promise<Record<string, any> | null>;
    create: (args: Prisma.BookingCreateArgs) => Promise<Record<string, any>>;
    update: (args: Prisma.BookingUpdateArgs) => Promise<Record<string, any>>;
  };
};
