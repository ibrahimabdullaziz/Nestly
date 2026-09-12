import ApiError from "../../common/utils/ApiError";
import { favoriteServiceDependencies } from "./dependencies/favorites.dependencies";
export { favoriteServiceDependencies } from "./dependencies/favorites.dependencies";

export async function addFavoriteService(userId: string, unitId: string) {
  const favoriteItem =
    await favoriteServiceDependencies.prisma.unitFavorite.create({
      data: { userId, unitId },
    });

  if (!favoriteItem) {
    throw new ApiError(500, "Error in adding this unit to favorites");
  }

  return favoriteItem;
}

export async function removeFavoriteService(userId: string, unitId: string) {
  const deletedItem =
    await favoriteServiceDependencies.prisma.unitFavorite.delete({
      where: {
        unitId_userId: { unitId, userId },
      },
    });

  if (!deletedItem) {
    throw new ApiError(500, "Error in removing this unit from favorites");
  }

  return deletedItem;
}

export async function listFavoritesService(userId: string) {
  const units = await favoriteServiceDependencies.prisma.unitFavorite.findMany({
    where: { userId: userId },
    include: { unit: true },
  });

  return units;
}

export const favoriteServices = {
  addFavoriteService,
  removeFavoriteService,
  listFavoritesService,
};
