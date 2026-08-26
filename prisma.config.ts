import { defineConfig } from "@prisma/config";
import config from "./src/config/env";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: config.databaseUrl
    }
});