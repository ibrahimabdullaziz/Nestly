import bcrypt from "bcryptjs";
import ApiError from "../../common/utils/ApiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import { createUser, findByEmail } from "../users/users.service";
import { RegisterDto } from "./auth.validation";
import { generateOtp, verifyOtp } from "../otp/otp.service";
import { sendMail } from "../mail/mail.service";
import prisma from "../../db/prisma";

export async function registerService(data: RegisterDto) {
  const user = await createUser(data);
  if (!user) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });
  const otp = generateOtp(user.email, "VERIFY_EMAIL");

  const html = `
 <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #333;">Nestly</h2>
  <p style="color: #555;">Your email verification code is:</p>
  <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
  <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
 </div>
  `;

  sendMail({ to: user.email, subject: "Verify your email", html: html });

  return { accessToken, refreshToken, user };
}

export async function loginService(email: string, password: string) {
  const user = await findByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const rowPassword = await bcrypt.compare(password, user.password);

  if (!rowPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

  return { accessToken, refreshToken, user };
}

export async function refreshService(refreshToken: string) {
  const refreshedToken = await verifyRefreshToken(refreshToken);

  if (!refreshedToken) {
    throw new ApiError(403, "Unotherized, failed in verifing the credentials");
  }

  const token = signAccessToken({
    id: refreshedToken.id,
    role: refreshedToken.role,
  });
  return token;
}

export async function verifyEmailService(email: string, code: string) {
  verifyOtp(email, code, "VERIFY_EMAIL");

  const user = await prisma.user.update({
    where: { email: email },
    data: { isVerified: true },
  });
}
