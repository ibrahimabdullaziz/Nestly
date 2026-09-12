import ApiError from "../../common/utils/ApiError";
import { CategoryDto } from "./category.validation";
import { categoryServiceDependencies } from "./dependencies/categories.dependencies";
export { categoryServiceDependencies } from "./dependencies/categories.dependencies";

export const getAllCategoriesService = async () => {
  const categories =
    await categoryServiceDependencies.prisma.unitCategory.findMany({});
  if (!categories) {
    throw new ApiError(500, "failed to fetch categories data.");
  }

  return categories;
};

export const createCategoryService = async (data: CategoryDto) => {
  const { ...categoryData } = data;
  const category = await categoryServiceDependencies.prisma.unitCategory.create(
    {
      data: {
        ...categoryData,
      },
    },
  );

  if (!category) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return category;
};

export const categoryServices = {
  getAllCategoriesService,
  createCategoryService,
};
