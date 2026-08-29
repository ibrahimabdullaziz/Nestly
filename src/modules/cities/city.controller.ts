import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import { createCityService, getAllCitiesService } from "./city.service";

export const getAllCities = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const cities = await getAllCitiesService();
    if (!cities) {
      throw new ApiError(500, "Error occurred while fetching Cities data.");
    }

    res.json({
      status: "200",
      message: "cities data fetched successfully",
      data: cities,
    });

    return cities;
  },
);

export const createCity = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const city = await createCityService(req.body);

    if (!city) {
      throw new ApiError(500, "Error occurred while creation process.");
    }

    res.json({
      status: "200",
      message: "city created successfully",
      data: city,
    });
    return city;
  },
);
