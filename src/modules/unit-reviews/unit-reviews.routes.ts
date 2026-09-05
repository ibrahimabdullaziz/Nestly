import express from "express";
import { authGuard } from "../../common/middleware/authGuard";
import { roleGuard } from "../../common/middleware/roleGuard";
import { createReview, getUnitReviews } from "./unit-reviews.controller";

const router = express.Router;

const unitReviewsRoutes = router();

unitReviewsRoutes.get("/", getUnitReviews);
unitReviewsRoutes.post("/", authGuard, roleGuard("GUEST"), createReview);

express.Router({ mergeParams: true });
export default unitReviewsRoutes;
