import express = require("express");
import pinoHttp from "pino-http";
import logger from "./config/logger";
import metrics from "./config/metrics";
import authRoutes from "./modules/auth/auth.routes";
import errorHandler from "./common/middleware/errorHandler";
import countriesRouter from "./modules/countries/countries.routes";
import citiesRouter from "./modules/cities/city.routes";
import currenciesRouter from "./modules/currencies/currency.routes";
import categoriesRouter from "./modules/categories/category.routes";
import unitsRoutes from "./modules/units/units.route";
import photoUnitsRoutes from "./modules/unit-photos/unit-photos.routes";
import bookingRoutes from "./modules/bookings/bookings.routes";
import unitReviewsRoutes from "./modules/unit-reviews/unit-reviews.routes";
import {
  unitFavoriteGetRoutes,
  unitFavoriteRoutes,
} from "./modules/unit-favorites/unit-favorites.routes";
import { swaggerDocument, swaggerUi } from "./config/swagger";
import metricsMiddleware from "./common/middleware/metrics";

const app = express();

app.use(
  pinoHttp({
    logger,

    genReqId: (req) => {
      return req.headers["x-request-id"] || crypto.randomUUID();
    },
  }),
);

app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metrics.register.contentType);
  res.end(await metrics.register.metrics());
});

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/test", (req, res) => {
  console.log("CONSOLE TEST");

  req.log.info("PINO TEST");

  res.json({
    message: "test",
  });
});

app.get("/test-error", (req, res) => {
  throw new Error("Something went wrong");
});

app.use("/api/auth", authRoutes);
app.use("/api/countries", countriesRouter);
app.use("/api/cities", citiesRouter);
app.use("/api/currencies", currenciesRouter);
app.use("/api/unit-categories", categoriesRouter);
app.use("/api/units", photoUnitsRoutes);
app.use("/api/units", unitsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/units/:unitId/reviews", unitReviewsRoutes);
app.use("/api/units/:unitId/favorite", unitFavoriteRoutes);
app.use("/api/favorites", unitFavoriteGetRoutes);

app.get("/", (req, res) => {
  res.send("Server is running new version");
});

app.use(errorHandler);

export default app;
