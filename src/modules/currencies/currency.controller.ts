import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import {
  createCurrencyService,
  getAllCurrencyService,
} from "./currency.service";

export const getAllCurrencies = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const currencies = await getAllCurrencyService();
    if (!currencies) {
      throw new ApiError(500, "Error occurred while fetching currencies data.");
    }

    res.json({
      status: "200",
      message: "currencies data fetched successfully",
      data: currencies,
    });

    return currencies;
  },
);

export const createCurrency = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const currency = await createCurrencyService(req.body);

    if (!currency) {
      throw new ApiError(500, "Error occurred while creation process.");
    }

    res.json({
      status: "200",
      message: "currency created successfully",
      data: currency,
    });
    return currency;
  },
);
