import {
  createCountryService,
  getAllCountriesService,
} from "./countries.service";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";

export const getAllCountries = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const countries = await getAllCountriesService();
    if (!countries) {
      throw new ApiError(500, "Error occurred while fetching countries data.");
    }

    res.json({
      status: "200",
      message: "countries data fetched successfully",
      data: countries,
    });

    return countries;
  },
);

export const createCountry = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const country = await createCountryService(req.body);

    if (!country) {
      throw new ApiError(500, "Error occurred while creation process.");
    }

    res.json({
      status: "200",
      message: "country created successfully",
      data: country,
    });
    return country;
  },
);
