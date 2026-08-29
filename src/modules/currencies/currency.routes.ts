import express from "express";

import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";
import { createCurrency, getAllCurrencies } from "./currency.controller";
import { currencySchema } from "./currency.validation";

const countriesRouter = express.Router();

countriesRouter.get("/", getAllCurrencies);
countriesRouter.post(
  "/",
  validate(currencySchema),
  authGuard,
  roleGuard("ADMIN"),
  createCurrency,
);

export default countriesRouter;
