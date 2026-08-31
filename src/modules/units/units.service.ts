import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";
import { unitsDto } from "./units.validation";

export async function createUnitService(ownerId: string, data: unitsDto) {
  const unit = await prisma.unit.create({
    data: { ...data, ownerId },
  });

  if (!unit) {
    throw new ApiError(400, "failed in creating this unit, try again later");
  }

  return unit;
}

export async function updateUnitService(
  unitId: string,
  ownerId: string,
  data: unitsDto,
) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });

  if (!unit) {
    throw new ApiError(404, "this unit is not found");
  }

  if (unit.ownerId !== ownerId) {
    throw new ApiError(403, "You are not authorized to access this unit");
  }

  const updatedUnit = await prisma.unit.update({
    where: { id: unitId },
    data: { ...data },
  });

  if (!updatedUnit) {
    throw new ApiError(
      500,
      "some error happened while updating process, try again later.",
    );
  }

  return updatedUnit;
}
