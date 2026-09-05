import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";

export async function createReviewService(
  guestId: string,
  unitId: string,
  rating: number,
  comment: string,
) {
  const booking = await prisma.booking.findFirst({
    where: {
      guestId: guestId,
      unitId: unitId,
      status: "COMPLETED",
    },
  });

  if (!booking) {
    throw new ApiError(403, "You can`t access this booking");
  }

  const review = await prisma.unitReview.create({
    data: {
      unitId,
      guestId,
      rating,
      comment,
    },
  });

  if (!review) {
    throw new ApiError(500, "Server Error while creation process");
  }

  return review;
}

export async function getUnitReviewsService(unitId: string) {
  const reviews = await prisma.unitReview.findMany({
    where: { unitId: unitId },
    include: { unit: true },
  });

  const avgRating = await prisma.unitReview.aggregate({
    _avg: { rating: true },
    where: { unitId: unitId },
  });

  return { reviews, avgRating };
}
