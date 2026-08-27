import jwt from "jsonwebtoken";
import config from "../../config/env";

type Role = string;

interface JwtPayload {
  id: string;
  role: Role;
}

export function signAccessToken(payload: JwtPayload): string {
  const token = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: "15min",
  });
  return token;
}

export function signRefreshToken(payload: JwtPayload): string {
  const token = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: "7d",
  });
  return token;
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwtAccessSecret);
  return decoded as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwtRefreshSecret);
  return decoded as JwtPayload;
}
