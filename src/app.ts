import express = require("express");
import morgan = require("morgan");
import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Server is running");
});

export default app;
