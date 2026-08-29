import express = require("express");
import morgan = require("morgan");
import authRoutes from "./modules/auth/auth.routes";
import errorHandler from "./common/middleware/errorHandler";
import countriesRouter from "./modules/countries/countries.routes";
import citiesRouter from "./modules/cities/city.routes";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/countries", countriesRouter);
app.use("/api/cities", citiesRouter);

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use(errorHandler);

export default app;
