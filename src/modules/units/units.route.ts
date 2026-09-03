import express from "express";

import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";
import { unitsSchema } from "./units.validation";
import {
  activateUnit,
  createUnit,
  deactivateUnit,
  getUnitById,
  listMyUnits,
  listUnits,
  softDeleteUnit,
  updateUnit,
} from "./units.controller";

const unitsRoutes = express.Router();

unitsRoutes.post(
  "/",
  validate(unitsSchema),
  authGuard,
  roleGuard("HOST"),
  createUnit,
);

unitsRoutes.patch(
  "/:id",
  validate(unitsSchema.partial()),
  authGuard,
  roleGuard("HOST"),
  updateUnit,
);

unitsRoutes.get("/", listUnits);
unitsRoutes.get("/mine", authGuard, roleGuard("HOST"), listMyUnits);
unitsRoutes.get("/:id", getUnitById);
unitsRoutes.patch("/:id/activate", authGuard, roleGuard("HOST"), activateUnit);
unitsRoutes.patch(
  "/:id/deactivate",
  authGuard,
  roleGuard("HOST"),
  deactivateUnit,
);
unitsRoutes.delete("/:id", authGuard, roleGuard("HOST"), softDeleteUnit);

export default unitsRoutes;
