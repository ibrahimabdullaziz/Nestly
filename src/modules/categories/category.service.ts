import ApiError from "../../common/utils/ApiError";
import PrismaClient from "../../db/prisma";
import { CategoryDto } from "./category.validation";

const prisma = PrismaClient;

export const getAllCategoriesService = async () => {
  const categories = await prisma.country.findMany({});
  if (!categories) {
    throw new ApiError(500, "failed to fetch categories data.");
  }

  return categories;
};

export const createCategoryService = async (data: CategoryDto) => {
  const { ...categoryData } = data;
  const category = await prisma.unitCategory.create({
    data: {
      ...categoryData,
    },
  });

  if (!category) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return category;
};
