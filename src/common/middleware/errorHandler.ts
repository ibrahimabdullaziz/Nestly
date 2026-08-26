import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import ApiError from "../utils/ApiError";

function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let statusCode = 500;
  let message = "Internal Server Error";
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  return res.status(statusCode).json({ success: false, message });
}
export default errorHandler;
