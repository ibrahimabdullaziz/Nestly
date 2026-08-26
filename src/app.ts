import express = require("express");
import morgan = require("morgan");

const app = express();

app.use(express.json());

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Server is running");
});

export default app;
