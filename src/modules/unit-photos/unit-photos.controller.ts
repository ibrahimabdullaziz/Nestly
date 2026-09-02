import { NextFunction, Request, Response } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import {
  deleteUnitPhotoService,
  uploadUnitPhotoService,
} from "./unit-photos.service";
import ApiError from "../../common/utils/ApiError";

export const uploadUnitPhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const unitId = req.params.unitId;
    const file = req.file;

    if (typeof unitId !== "string" || !file) {
      throw new ApiError(400, "Unit ID and photo file are required");
    }

    const photo = await uploadUnitPhotoService(
      unitId,
      req.user.id,
      file.buffer,
    );

    return res.status(201).json({
      status: 201,
      message: "photo uploaded successfully",
      data: photo,
    });
  },
);

export const deleteUnitPhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const photoId = req.params.photoId;
    if (typeof photoId !== "string") {
      throw new ApiError(400, "Photo ID is required");
    }

    await deleteUnitPhotoService(photoId, req.user.id);

    return res.status(200).json({
      status: 200,
      message: "photo deleted successfully",
    });
  },
);
