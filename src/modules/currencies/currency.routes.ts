import express from "express";

import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";
import { createCurrency, getAllCurrencies } from "./currency.controller";
import { currencySchema } from "./currency.validation";

const currenciesRouter = express.Router();

currenciesRouter.get("/", getAllCurrencies);
currenciesRouter.post(
  "/",
  validate(currencySchema),
  authGuard,
  roleGuard("ADMIN"),
  createCurrency,
);

export default currenciesRouter;
