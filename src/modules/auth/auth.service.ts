import bcrypt from "bcryptjs";
import ApiError from "../../common/utils/ApiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import { createUser, findByEmail } from "../users/users.service";
import { RegisterDto } from "./auth.validation";

export async function register(data: RegisterDto) {
  const user = await createUser(data);
  if (!user) {
    throw new ApiError(500, "Server Error While Creation Operation");
  }

  const signToken = signAccessToken({ id: user.id, role: user.role });
  const accessToken = signRefreshToken({ id: user.id, role: user.role });

  return { signToken, accessToken };
}

export async function login(email: string, password: string) {
  const user = await findByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const rowPassword = await bcrypt.compare(password, user.password);

  if (!rowPassword) {
    throw new ApiError(401, "Invalid credentials");
  }
}

export async function refresh(refreshToken: string) {
  const refreshedToken = await verifyRefreshToken(refreshToken);

  if (!refreshedToken) {
    throw new ApiError(403, "Unotherized, failed in verifing the credentials");
  }

  const token = await signAccessToken(refreshedToken);
  return token;
}
