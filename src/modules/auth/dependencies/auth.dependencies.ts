import bcrypt from "bcryptjs";
import prisma from "../../../db/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../common/utils/jwt";
import { createUser, findByEmail } from "../../users/users.service";
import { generateOtp, verifyOtp } from "../../otp/otp.service";
import { sendMail } from "../../mail/mail.service";
import type { AuthPrisma, AuthUserRecord } from "../types/auth.types";

const authPrisma: AuthPrisma = {
  user: {
    findFirst: (args) =>
      prisma.user.findFirst(
        args as Parameters<typeof prisma.user.findFirst>[0],
      ) as Promise<AuthUserRecord | null>,
    update: (args) =>
      prisma.user.update(
        args as Parameters<typeof prisma.user.update>[0],
      ) as Promise<AuthUserRecord | null>,
  },
};

export const authServiceDependencies = {
  createUser,
  findByEmail,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateOtp,
  verifyOtp,
  sendMail,
  bcrypt,
  prisma: authPrisma,
};
