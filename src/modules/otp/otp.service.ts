import ApiError from "../../common/utils/ApiError";
import { otpServiceDependencies } from "./dependencies/otp.dependencies";
export { otpServiceDependencies } from "./dependencies/otp.dependencies";

export async function generateOtp(email: string, purpose: string) {
  const generatedCode = Math.floor(
    100000 + otpServiceDependencies.random() * 900000,
  ).toString();

  const expireDate = new Date(
    otpServiceDependencies.now().getTime() + 10 * 60 * 1000,
  );

  const otp = await otpServiceDependencies.prisma.otp.upsert({
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
  const otp = await otpServiceDependencies.prisma.otp.findFirst({
    where: {
      email: email,
      code: code,
      purpose: purpose,
      usedAt: null,
      expiresAt: { gt: otpServiceDependencies.now() },
    },
  });

  if (!otp) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  await otpServiceDependencies.prisma.otp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return true;
}
