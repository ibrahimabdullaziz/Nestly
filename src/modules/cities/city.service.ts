import ApiError from "../../common/utils/ApiError";
import { CityDto } from "./city.validation";
import { cityServiceDependencies } from "./dependencies/cities.dependencies";
export { cityServiceDependencies } from "./dependencies/cities.dependencies";

export const getAllCitiesService = async () => {
  const cities = await cityServiceDependencies.prisma.city.findMany({});
  if (!cities) {
    throw new ApiError(500, "failed to fetch cities data.");
  }

  return cities;
};

export const createCityService = async (data: CityDto) => {
  const { ...cityData } = data;
  const city = await cityServiceDependencies.prisma.city.create({
    data: {
      ...cityData,
    },
  });

  if (!city) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return city;
};

export const cityServices = { getAllCitiesService, createCityService };
