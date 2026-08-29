import express from "express";
import { validate } from "../../common/middleware/validate";
import { roleGuard } from "../../common/middleware/roleGuard";
import { authGuard } from "../../common/middleware/authGuard";
import { createCategory, getAllCategories } from "./category.controller";
import { categorySchema } from "./category.validation";

const categoriesRouter = express.Router();

categoriesRouter.get("/", getAllCategories);
categoriesRouter.post(
  "/",
  validate(categorySchema),
  authGuard,
  roleGuard("ADMIN"),
  createCategory,
);

export default categoriesRouter;
