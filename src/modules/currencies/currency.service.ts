import ApiError from "../../common/utils/ApiError";
import { CurrencyDto } from "./currency.validation";
import { currencyServiceDependencies } from "./dependencies/currencies.dependencies";
export { currencyServiceDependencies } from "./dependencies/currencies.dependencies";

export const getAllCurrencyService = async () => {
  const currencies = await currencyServiceDependencies.prisma.currency.findMany(
    {},
  );
  if (!currencies) {
    throw new ApiError(500, "failed to fetch currencies data.");
  }

  return currencies;
};

export const createCurrencyService = async (data: CurrencyDto) => {
  const { ...currencyData } = data;
  const currency = await currencyServiceDependencies.prisma.currency.create({
    data: {
      ...currencyData,
    },
  });

  if (!currency) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return currency;
};

export const currencyServices = {
  getAllCurrencyService,
  createCurrencyService,
};
