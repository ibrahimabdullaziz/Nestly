import prisma from "../../../db/prisma";

export const categoryServiceDependencies: any = {
  prisma: {
    unitCategory: {
      findMany: (args: any) => prisma.unitCategory.findMany(args),
      create: (args: any) => prisma.unitCategory.create(args),
    },
  },
};
