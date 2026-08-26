import { PrismaClient } from "@prisma/client";
import config from "../config/env";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaAdapter = new PrismaPg({ connectionString: config.databaseUrl });

const prisma = new PrismaClient({ adapter: prismaAdapter });

export default prisma;
