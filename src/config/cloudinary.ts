import { v2 as cloudinary } from "cloudinary";
import appConfig from "./env";

export const cloudConfig = cloudinary.config({
  cloud_name: appConfig.cloudinaryName,
  api_key: appConfig.cloudinaryApiKey,
  api_secret: appConfig.cloudinaryApiSecret,
});
