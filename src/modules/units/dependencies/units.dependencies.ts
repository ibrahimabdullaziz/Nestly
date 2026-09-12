import type { Prisma } from "@prisma/client";
import prisma from "../../../db/prisma";
import type { UnitPrisma } from "../types/units.types";

const unitPrisma: UnitPrisma = {
  unit: {
    findUnique: (args) => prisma.unit.findUnique(args),
    create: (args) => prisma.unit.create(args),
    update: (args) => prisma.unit.update(args),
    findMany: (args) => prisma.unit.findMany(args),
    findFirst: (args) => prisma.unit.findFirst(args),
  },
};

export const unitServiceDependencies = {
  prisma: unitPrisma,
};
