import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import ApiError from "../utils/ApiError";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError && err.issues.length > 0) {
        throw new ApiError(400, err.issues[0]!.message);
      }
    }
  };
};
