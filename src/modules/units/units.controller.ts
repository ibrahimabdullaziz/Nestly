import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import {
  createUnitService,
  getUnitByIdService,
  listMyUnitsService,
  listUnitsService,
  updateUnitService,
} from "./units.service";
import { listUnitsQuerySchema } from "./units.validation";

export const createUnit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const unit = await createUnitService(req.user.id, req.body);

    return res.status(201).json({
      status: 201,
      message: "unit created successfully",
      data: unit,
    });
  },
);

export const updateUnit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const unitId = req.params?.id;

    if (!unitId || Array.isArray(unitId)) {
      throw new ApiError(400, "Unit ID is required");
    }

    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const unit = await updateUnitService(unitId, req.user.id, req.body);

    return res.status(200).json({
      status: 200,
      message: "unit updated successfully",
      data: unit,
    });
  },
);

export const listUnits = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = listUnitsQuerySchema.safeParse(req.query);
    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message || "Invalid query parameters";
      throw new ApiError(400, errorMessage);
    }

    const filters = result.data;

    const units = await listUnitsService(filters);

    return res.status(200).json({
      status: 200,
      message: "units listed successfully",
      data: units,
    });
  },
);

export const getUnitById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params?.id;
    if (!id || Array.isArray(id)) {
      throw new ApiError(400, "unit ID is required");
    }

    const unit = await getUnitByIdService(id);

    return res.status(200).json({
      status: 200,
      message: "units fetched successfully",
      data: unit,
    });
  },
);

export const listMyUnits = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      throw new ApiError(401, "User ID is required");
    }

    const listedUnits = await listMyUnitsService(req.user.id);

    return res.status(200).json({
      status: 200,
      message: "units listed successfully",
      data: listedUnits,
    });
  },
);
