import ApiError from "../../common/utils/ApiError";
import { RegisterDto } from "./auth.validation";
import { authServiceDependencies } from "./dependencies/auth.dependencies";

export { authServiceDependencies } from "./dependencies/auth.dependencies";

export async function registerService(data: RegisterDto) {
  const user = await authServiceDependencies.createUser(data);
  if (!user) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }

  const accessToken = authServiceDependencies.signAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = authServiceDependencies.signRefreshToken({
    id: user.id,
    role: user.role,
  });
  const otp = await authServiceDependencies.generateOtp(
    user.email,
    "VERIFY_EMAIL",
  );

  const html = `
 <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #333;">Nestly</h2>
  <p style="color: #555;">Your email verification code is:</p>
  <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
  <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
 </div>
  `;

  authServiceDependencies.sendMail({
    to: user.email,
    subject: "Verify your email",
    html: html,
  });

  return { accessToken, refreshToken, user };
}

export async function loginService(email: string, password: string) {
  const user = await authServiceDependencies.findByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const rowPassword = await authServiceDependencies.bcrypt.compare(
    password,
    user.password,
  );

  if (!rowPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = authServiceDependencies.signAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = authServiceDependencies.signRefreshToken({
    id: user.id,
    role: user.role,
  });

  return { accessToken, refreshToken, user };
}

export async function refreshService(refreshToken: string) {
  const refreshedToken =
    await authServiceDependencies.verifyRefreshToken(refreshToken);

  if (!refreshedToken) {
    throw new ApiError(403, "Unotherized, failed in verifing the credentials");
  }

  const token = authServiceDependencies.signAccessToken({
    id: refreshedToken.id,
    role: refreshedToken.role,
  });
  return token;
}

export async function verifyEmailService(email: string, code: string) {
  await authServiceDependencies.verifyOtp(email, code, "VERIFY_EMAIL");

  const user = await authServiceDependencies.prisma.user.update({
    where: { email: email },
    data: { isVerified: true },
  });

  return user;
}

export async function forgotPasswordService(email: string) {
  const user = await authServiceDependencies.prisma.user.findFirst({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const otpCode = await authServiceDependencies.generateOtp(
    email,
    "RESET_PASSWORD",
  );

  const html = `
 <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #333;">Nestly</h2>
  <p style="color: #555;">Your email verification code is:</p>
  <h1 style="color: #4F46E5; letter-spacing: 5px;">${otpCode}</h1>
  <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
 </div>
  `;

  authServiceDependencies.sendMail({
    to: user.email,
    subject: "Reset Password",
    html: html,
  });
}

export async function resetPasswordService(
  email: string,
  code: string,
  newPassword: string,
) {
  await authServiceDependencies.verifyOtp(email, code, "RESET_PASSWORD");

  const hashedPassword = await authServiceDependencies.bcrypt.hash(
    newPassword,
    10,
  );

  const updatedUser = await authServiceDependencies.prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  if (!updatedUser) {
    throw new ApiError(500, "Failed on updated user password!");
  }

  // TODO: Invalidate existing refresh tokens (known simplification)

  return updatedUser;
}

export const authServices = {
  registerService,
  loginService,
  refreshService,
  verifyEmailService,
  forgotPasswordService,
  resetPasswordService,
};
