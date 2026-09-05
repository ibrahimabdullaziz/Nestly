import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";
import { Prisma } from "@prisma/client";

async function isUnitAvailable(
  tx: Prisma.TransactionClient,
  unitId: string,
  checkIn: Date,
  checkOut: Date,
) {
  const bookedUnit = await tx.booking.findFirst({
    where: {
      id: unitId,
      status: { in: ["PENDING", "CONFIRMED"] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });

  return !bookedUnit;
}

async function calculatePrice(unitId: string, checkIn: Date, checkOut: Date) {
  const unit = await prisma.booking.findUnique({ where: { id: unitId } });

  if (!unit) {
    throw new ApiError(404, "Unit is not found!");
  }

  const numberOfNights: number =
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);

  return numberOfNights * Number(unit.totalPrice);
}
export async function createBooking(
  guestId: string,
  unitId: string,
  checkIn: Date,
  checkOut: Date,
) {
  const totalPrice = await calculatePrice(unitId, checkIn, checkOut);
  if (isNaN(totalPrice) || totalPrice <= 0) {
    throw new ApiError(400, "Invalid pricing for the selected dates");
  }

  return await prisma.$transaction(async (tx) => {
    const units = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "Unit" WHERE id = ${unitId} FOR UPDATE`;

    if (!units.length) {
      throw new ApiError(404, "Unit not found");
    }

    const isAvailable = await isUnitAvailable(tx, unitId, checkIn, checkOut);
    if (!isAvailable) {
      throw new ApiError(409, "Unit not available for these dates");
    }

    const booking = await tx.booking.create({
      data: {
        unitId,
        guestId,
        checkIn,
        checkOut,
        totalPrice,
        status: "PENDING",
      },
    });

    return booking;
  });
}
