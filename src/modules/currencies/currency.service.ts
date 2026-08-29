import ApiError from "../../common/utils/ApiError";
import PrismaClient from "../../db/prisma";
import { CurrencyDto } from "./currency.validation";

const prisma = PrismaClient;

export const getAllCurrencyService = async () => {
  const currencies = await prisma.currency.findMany({});
  if (!currencies) {
    throw new ApiError(500, "failed to fetch currencies data.");
  }

  return currencies;
};

export const createCurrencyService = async (data: CurrencyDto) => {
  const { ...currencyData } = data;
  const currency = await prisma.currency.create({
    data: {
      ...currencyData,
    },
  });

  if (!currency) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }
  return currency;
};
