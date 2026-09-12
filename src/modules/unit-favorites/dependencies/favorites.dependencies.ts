import prisma from "../../../db/prisma";

export const favoriteServiceDependencies: any = {
  prisma: {
    unitFavorite: {
      create: (args: any) => prisma.unitFavorite.create(args),
      delete: (args: any) => prisma.unitFavorite.delete(args),
      findMany: (args: any) => prisma.unitFavorite.findMany(args),
    },
  },
};
