import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import ApiError from "../../common/utils/ApiError";
import {
  createCategoryService,
  getAllCategoriesService,
} from "./category.service";

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const categories = await getAllCategoriesService();
    if (!categories) {
      throw new ApiError(500, "Error occurred while fetching categories data.");
    }

    res.json({
      status: "200",
      message: "categories data fetched successfully",
      data: categories,
    });

    return categories;
  },
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const category = await createCategoryService(req.body);

    if (!category) {
      throw new ApiError(500, "Error occurred while creation process.");
    }

    res.json({
      status: "200",
      message: "category created successfully",
      data: category,
    });
    return category;
  },
);
