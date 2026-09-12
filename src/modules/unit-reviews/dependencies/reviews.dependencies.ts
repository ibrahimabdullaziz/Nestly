import prisma from "../../../db/prisma";

export const reviewServiceDependencies: any = {
  prisma: {
    booking: { findFirst: (args: any) => prisma.booking.findFirst(args) },
    unitReview: {
      create: (args: any) => prisma.unitReview.create(args),
      findMany: (args: any) => prisma.unitReview.findMany(args),
      aggregate: (args: any) => prisma.unitReview.aggregate(args),
    },
  },
};
