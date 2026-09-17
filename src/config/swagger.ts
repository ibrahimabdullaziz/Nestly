import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";

const swaggerPath = path.join(process.cwd(), "docs", "openapi.yaml");

const swaggerFile = fs.readFileSync(swaggerPath, "utf8");

export const swaggerDocument = YAML.parse(swaggerFile);

export { swaggerUi };
