import "dotenv/config";

if (!process.env.DATABASE_URL || !process.env.JWT_ACCESS_SECRET) {
  throw new Error("Missing Some Environment Variables. Check Your .env file");
}

interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  adminEmail: string;
  adminPassword: string;
  cloudinaryName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
}

const config: AppConfig = {
  port: parseInt(process.env.PORT as string, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  adminEmail: process.env.SYSTEM_ADMIN_EMAIL as string,
  adminPassword: process.env.SYSTEM_ADMIN_PASSWORD as string,
  cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME as string,
  cloudinaryApiKey: process.env.CLOUDINARY_API_SECRET as string,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET as string,
};

export default config;
