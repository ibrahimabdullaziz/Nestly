import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import {
  createReviewService,
  getUnitReviewsService,
} from "./unit-reviews.service";

const extractUserId = (req: Request) => {
  if (!req.user?.id) throw new ApiError(401, "User ID is required");
  return req.user.id;
};

const extractUnitId = (req: Request) => {
  const id = req.params.unitId;
  if (!id || typeof id !== "string")
    throw new ApiError(400, "Unit ID is required");
  return id;
};

export const createReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const unitId = extractUnitId(req);
    const review = await createReviewService(
      guestId,
      unitId,
      req.body.rating,
      req.body.comment,
    );

    if (!review) {
      throw new ApiError(500, "Server Error while creation process");
    }

    res.status(200).json({
      status: 200,
      message: "booking canceled successfully",
      data: review,
    });
  },
);

export const getUnitReviews = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const unitId = extractUnitId(req);

    const reviews = await getUnitReviewsService(unitId);

    if (reviews) {
      res.status(200).json({
        status: 200,
        message: "reviews fetched successfully",
        data: reviews,
      });
    }
  },
);
