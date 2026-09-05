import ApiError from "../../common/utils/ApiError";
import prisma from "../../db/prisma";

export async function generateOtp(email: string, purpose: string) {
  const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

  const expireDate = new Date(Date.now() + 10 * 60 * 1000);

  const otp = await prisma.otp.upsert({
    create: {
      email: email,
      code: generatedCode,
      purpose: purpose,
      expiresAt: expireDate,
    },
    update: {
      code: generatedCode,
      expiresAt: expireDate,
    },
    where: {
      email: email,
    },
  });

  if (!otp) {
    throw new ApiError(500, "Server Error");
  }
  return otp.code;
}

export async function verifyOtp(email: string, code: string, purpose: string) {
  const otp = await prisma.otp.findFirst({
    where: {
      email: email,
      code: code,
      purpose: purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return true;
}
