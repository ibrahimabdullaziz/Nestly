import prisma from "../../../db/prisma";

export const countryServiceDependencies: any = {
  prisma: {
    country: {
      findMany: (args: any) => prisma.country.findMany(args),
      create: (args: any) => prisma.country.create(args),
    },
  },
};
