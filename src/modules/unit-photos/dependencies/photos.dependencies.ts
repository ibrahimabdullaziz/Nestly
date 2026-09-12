import cloudinary from "../../../config/cloudinary";
import prisma from "../../../db/prisma";

export const unitPhotoServiceDependencies: any = {
  prisma: {
    unit: { findUnique: (args: any) => prisma.unit.findUnique(args) },
    unitPhoto: {
      create: (args: any) => prisma.unitPhoto.create(args),
      findUnique: (args: any) => prisma.unitPhoto.findUnique(args),
      delete: (args: any) => prisma.unitPhoto.delete(args),
    },
  },
  cloudinary: {
    uploader: {
      upload_stream: (...args: any[]) =>
        cloudinary.uploader.upload_stream(...args),
      destroy: (publicId: string) => cloudinary.uploader.destroy(publicId),
    },
  },
};
