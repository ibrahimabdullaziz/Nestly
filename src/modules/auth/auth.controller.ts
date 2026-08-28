import { Request, Response } from "express";
import asyncHandler from "../../common/utils/asyncHandler";
import { loginService, registerService, refreshService } from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  const data = await registerService({ email, password, firstName, lastName });

  return res.status(201).json({ status: 201, message: "User created successfully", data });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const data = await loginService(email, password);

  return res.status(200).json({ status: 200, message: "User logged successfully", data });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  const accessToken = await refreshService(token);

  return res.status(200).json({ status: 200, message: "Token refreshed successfully", accessToken });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  return res.status(200).json({ status: 200, message: "User retrieved successfully", data: user });
});
