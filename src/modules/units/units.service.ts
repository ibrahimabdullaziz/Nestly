import { Prisma } from "@prisma/client";
import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";
import { listUnitsQueryDto, updateUnitsDto, unitsDto } from "./units.validation";

export async function createUnitService(ownerId: string, data: unitsDto) {
  const unit = await prisma.unit.create({
    data: { ...data, ownerId },
  });

  return unit;
}

export async function updateUnitService(
  unitId: string,
  ownerId: string,
  data: updateUnitsDto,
) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });

  if (!unit) {
    throw new ApiError(404, "this unit is not found");
  }

  if (unit.ownerId !== ownerId) {
    throw new ApiError(403, "Not your unit");
  }

  const updatedUnit = await prisma.unit.update({
    where: { id: unitId },
    data: { ...data },
  });

  return updatedUnit;
}

export async function listUnitsService(filters: listUnitsQueryDto) {
  const { cityId, categoryId, minPrice, maxPrice, page, limit } = filters;

  const where: Prisma.UnitWhereInput = {
    isActive: true,
    deletedAt: null,
  };

  if (cityId) where.cityId = cityId;
  if (categoryId) where.categoryId = categoryId;

  const priceFilter: Prisma.IntFilter = {};
  if (minPrice !== undefined) priceFilter.gte = minPrice;
  if (maxPrice !== undefined) priceFilter.lte = maxPrice;
  if (Object.keys(priceFilter).length > 0) {
    where.pricePerNight = priceFilter;
  }

  const listedUnits = await prisma.unit.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
  });

  return listedUnits;
}

export async function getUnitByIdService(id: string) {
  const unit = await prisma.unit.findFirst({
    where: { id, deletedAt: null, isActive: true },
    include: {
      photos: true,
      city: true,
      currency: true,
      category: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!unit) {
    throw new ApiError(404, "this unit is not found");
  }

  return unit;
}

export async function listMyUnitsService(ownerId: string) {
  const units = await prisma.unit.findMany({
    where: { ownerId, deletedAt: null },
  });

  return units;
}
