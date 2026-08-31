import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import { createUnitService, updateUnitService } from "./units.service";

export const createUnit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const unit = await createUnitService(req.user.id, req.body);

    res.json({
      status: "201",
      message: "unit created successfully",
      data: unit,
    });

    return unit;
  },
);

export const updateUnit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const unitId = req.params?.unitId;

    if (!unitId || Array.isArray(unitId)) {
      throw new ApiError(400, "Unit ID is required");
    }

    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const unit = await updateUnitService(unitId, req.user.id, req.body);

    res.json({
      status: "201",
      message: "unit updated successfully",
      data: unit,
    });
    return unit;
  },
);
