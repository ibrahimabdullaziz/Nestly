import express = require("express");
import morgan = require("morgan");
import authRoutes from "./modules/auth/auth.routes";
import errorHandler from "./common/middleware/errorHandler";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use(errorHandler);

export default app;
