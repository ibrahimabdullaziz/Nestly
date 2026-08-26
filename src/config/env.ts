import "dotenv/config";

if (!process.env.DATABASE_URL || !process.env.JWT_ACCESS_SECRET) {
  throw new Error("Missing Some Environment Variables. Check Your .env file");
}

interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT as string, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
};

export default config;
