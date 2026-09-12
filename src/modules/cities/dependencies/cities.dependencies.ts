import prisma from "../../../db/prisma";

export const cityServiceDependencies: any = {
  prisma: {
    city: {
      findMany: (args: any) => prisma.city.findMany(args),
      create: (args: any) => prisma.city.create(args),
    },
  },
};
