import express from "express";
import { createCountry, getAllCountries } from "./countries.controller";
import { countrySchema } from "./country.validation";
import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";

const countriesRouter = express.Router();

countriesRouter.get("/", getAllCountries);
countriesRouter.post(
  "/",
  validate(countrySchema),
  authGuard,
  roleGuard("ADMIN"),
  createCountry,
);

export default countriesRouter;
