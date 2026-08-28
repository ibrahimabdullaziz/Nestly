import bcrypt from "bcryptjs";
import ApiError from "../../common/utils/ApiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import { createUser, findByEmail } from "../users/users.service";
import { RegisterDto } from "./auth.validation";

export async function registerService(data: RegisterDto) {
  const user = await createUser(data);
  if (!user) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, role: user.role });

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

  const token = await signAccessToken(refreshedToken);
  return token;
}
