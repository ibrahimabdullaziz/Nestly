import express from "express";
import { authGuard } from "../../common/middleware/authGuard";
import { roleGuard } from "../../common/middleware/roleGuard";
import upload from "../../common/middleware/upload";
import { deleteUnitPhoto, uploadUnitPhoto } from "./unit-photos.controller";

const photoUnitsRoutes = express.Router();

photoUnitsRoutes.post(
  "/:unitId/photos",
  authGuard,
  roleGuard("HOST"),
  upload.single("photo"),
  uploadUnitPhoto,
);

photoUnitsRoutes.delete(
  "/photos/:photoId",
  authGuard,
  roleGuard("HOST"),
  deleteUnitPhoto,
);

export default photoUnitsRoutes;
