import ApiError from "../../common/utils/ApiError";
import PrismaClient from "../../db/prisma";
import { CityDto } from "./city.validation";

const prisma = PrismaClient;

export const getAllCitiesService = async () => {
  const cities = await prisma.country.findMany({});
  if (!cities) {
    throw new ApiError(500, "failed to fetch cities data.");
  }

  return cities;
};

export const createCityService = async (data: CityDto) => {
  const { ...cityData } = data;
  const city = await prisma.city.create({
    data: {
      ...cityData,
    },
  });

  if (!city) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return city;
};
