import ApiError from "../../common/utils/ApiError";
import PrismaClient from "../../db/prisma";
import { CountryDto } from "./country.validation";

const prisma = PrismaClient;

export const getAllCountriesService = async () => {
  const countries = await prisma.country.findMany({});
  if (!countries) {
    throw new ApiError(500, "failed to fetch countries data.");
  }

  return countries;
};

export const createCountryService = async (data: CountryDto) => {
  const { cities, ...countryData } = data;
  const country = await prisma.country.create({
    data: {
      ...countryData,
      cities: { create: cities.map((city) => ({ name: city })) || [] },
    },
  });

  if (!country) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return country;
};
