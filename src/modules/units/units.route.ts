import express from "express";

import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";
import { unitsSchema } from "./units.validation";
import { createUnit, updateUnit } from "./units.controller";

const unitsRoutes = express.Router();

unitsRoutes.post(
  "/:listId",
  validate(unitsSchema),
  authGuard,
  roleGuard("HOST"),
  createUnit,
);

unitsRoutes.patch(
  "/:listId",
  validate(unitsSchema),
  authGuard,
  roleGuard("HOST"),
  updateUnit,
);

export default unitsRoutes;
