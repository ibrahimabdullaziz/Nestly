import prisma from "../../../db/prisma";

export const currencyServiceDependencies: any = {
  prisma: {
    currency: {
      findMany: (args: any) => prisma.currency.findMany(args),
      create: (args: any) => prisma.currency.create(args),
    },
  },
};
