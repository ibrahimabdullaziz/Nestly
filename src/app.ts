import express = require("express");
import morgan = require("morgan");
import authRoutes from "./modules/auth/auth.routes";
import errorHandler from "./common/middleware/errorHandler";
import countriesRouter from "./modules/countries/countries.routes";
import citiesRouter from "./modules/cities/city.routes";
import currenciesRouter from "./modules/currencies/currency.routes";
import categoriesRouter from "./modules/categories/category.routes";
import unitsRoutes from "./modules/units/units.route";
import photoUnitsRoutes from "./modules/unit-photos/unit-photos.routes";

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/countries", countriesRouter);
app.use("/api/cities", citiesRouter);
app.use("/api/currencies", currenciesRouter);
app.use("/api/unit-categories", categoriesRouter);
app.use("/api/units", photoUnitsRoutes);
app.use("/api/units", unitsRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use(errorHandler);

export default app;
