import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";

export async function addFavorite(userId: string, unitId: string) {
  const favoriteItem = await prisma.unitFavorite.create({
    data: { userId, unitId },
  });

  if (favoriteItem) {
    throw new ApiError(500, "Error in adding this unit to favorites");
  }

  return favoriteItem;
}

export async function removeFavorite(userId: string, unitId: string) {
  const deletedItem = await prisma.unitFavorite.delete({
    where: {
      unitId_userId: { unitId, userId },
    },
  });

  if (deletedItem) {
    throw new ApiError(500, "Error in removing this unit from favorites");
  }

  return deletedItem;
}
