import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import {
  addFavoriteService,
  listFavoritesService,
  removeFavoriteService,
} from "./unit-favorites.service";

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

export const addFavorite = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const unitId = extractUnitId(req);
    const favorite = await addFavoriteService(guestId, unitId);

    if (!favorite) {
      throw new ApiError(500, "Server Error while creation process");
    }

    res.status(200).json({
      status: 201,
      message: "favorite created successfully",
      data: favorite,
    });
  },
);

export const removeFavorite = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);
    const unitId = extractUnitId(req);
    const favorite = await removeFavoriteService(guestId, unitId);

    if (!favorite) {
      throw new ApiError(500, "Server Error while removing process");
    }

    res.status(200).json({
      status: 200,
      message: "favorite removed successfully",
      data: favorite,
    });
  },
);

export const listFavorites = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guestId = extractUserId(req);

    const favorites = await listFavoritesService(guestId);

    if (!favorites) {
      throw new ApiError(500, "Server Error while listing process");
    }

    res.status(200).json({
      status: 200,
      message: "favorite fetched successfully",
      data: favorites,
    });
  },
);
