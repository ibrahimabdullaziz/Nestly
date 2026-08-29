import express from "express";
import { createCountry, getAllCountries } from "./countries.controller";
import { countrySchema } from "./country.validation";
import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";

const countriesRouter = express.Router();

countriesRouter.get("/", validate(countrySchema), getAllCountries);
countriesRouter.post(
  "/",
  validate(countrySchema),
  roleGuard("ADMIN"),
  createCountry,
);

export default countriesRouter;
