import prisma from "../../../db/prisma";
import type {
  BookingPrisma,
  BookingTransaction,
} from "../types/bookings.types";

const bookingPrisma: BookingPrisma = {
  unit: {
    findUnique: (args) => prisma.unit.findUnique(args) as never,
  },
  booking: {
    findFirst: (args) => prisma.booking.findFirst(args) as never,
    create: (args) => prisma.booking.create(args) as never,
    update: (args) => prisma.booking.update(args) as never,
    findMany: (args) => prisma.booking.findMany(args) as never,
  },
  $transaction: (callback) =>
    prisma.$transaction((transaction) =>
      callback(transaction as unknown as BookingTransaction),
    ),
};

export const bookingServiceDependencies = { prisma: bookingPrisma };
