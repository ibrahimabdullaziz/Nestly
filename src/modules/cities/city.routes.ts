import express from "express";
import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";
import { createCity, getAllCities } from "./city.controller";
import { citySchema } from "./city.validation";

const citiesRouter = express.Router();

citiesRouter.get("/", getAllCities);
citiesRouter.post(
  "/",
  validate(citySchema),
  authGuard,
  roleGuard("ADMIN"),
  createCity,
);

export default citiesRouter;
