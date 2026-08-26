import app from "./app";
import config from "./config/env";

app.listen(config.port, () => {
  console.log(`server is running on ${config.port}`);
});
