import { v2 as cloudinary } from "cloudinary";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";

export async function uploadUnitPhoto(
  unitId: string,
  ownerId: string,
  fileBuffer: Buffer,
) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });

  if (!unit) {
    throw new ApiError(404, "This unit is not found");
  }

  if (unit.ownerId !== ownerId) {
    throw new ApiError(403, "You not authorized to edit this unit");
  }

  const uploadBuffer = (buffer: Buffer) => {
    return new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "nestly/units",
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error) return reject(error);
            if (!result)
              return reject(new Error("Cloudinary upload returned no result"));
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );
        stream.end(buffer);
      },
    );
  };

  try {
    const data = await uploadBuffer(fileBuffer);

    const url = data.secure_url;
    const publicId = data.public_id;

    const unitPhoto = await prisma.unitPhoto.create({
      data: { url, publicId, unitId },
    });

    if (!unitPhoto) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err: unknown) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}
