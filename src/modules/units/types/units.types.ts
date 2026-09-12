import type { Prisma } from "@prisma/client";

export type UnitPrisma = {
  unit: {
    findUnique: (
      args: Prisma.UnitFindUniqueArgs,
    ) => Promise<Prisma.UnitGetPayload<{}> | null>;
    create: (
      args: Prisma.UnitCreateArgs,
    ) => Promise<Prisma.UnitGetPayload<{}>>;
    update: (
      args: Prisma.UnitUpdateArgs,
    ) => Promise<Prisma.UnitGetPayload<{}> | null>;
    findMany: (
      args: Prisma.UnitFindManyArgs,
    ) => Promise<Prisma.UnitGetPayload<{}>[]>;
    findFirst: (
      args: Prisma.UnitFindFirstArgs,
    ) => Promise<Prisma.UnitGetPayload<{}> | null>;
  };
};
