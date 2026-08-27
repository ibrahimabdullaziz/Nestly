import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new ApiError(401, "Access Denied: No Token Provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Access Denied: No Token Provided");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, role: payload.role };
  } catch (err) {
    console.log(err);
    throw new ApiError(401, "Access Denied: No Token Provided");
  }

  next();
};
