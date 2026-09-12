import ApiError from "../../common/utils/ApiError";
import { CountryDto } from "./country.validation";
import { countryServiceDependencies } from "./dependencies/countries.dependencies";
export { countryServiceDependencies } from "./dependencies/countries.dependencies";

export const getAllCountriesService = async () => {
  const countries = await countryServiceDependencies.prisma.country.findMany(
    {},
  );
  if (!countries) {
    throw new ApiError(500, "failed to fetch countries data.");
  }

  return countries;
};

export const createCountryService = async (data: CountryDto) => {
  const { ...countryData } = data;
  const country = await countryServiceDependencies.prisma.country.create({
    data: {
      ...countryData,
    },
  });

  if (!country) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return country;
};

export const countryServices = { getAllCountriesService, createCountryService };
