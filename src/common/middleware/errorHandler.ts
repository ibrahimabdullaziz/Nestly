import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
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
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Max size is 5MB"
        : err.message;
  }

  return res.status(statusCode).json({ success: false, message });
}
export default errorHandler;
