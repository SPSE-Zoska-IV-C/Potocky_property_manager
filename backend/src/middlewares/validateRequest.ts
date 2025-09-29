import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
import { createError, errorCodes } from "../utils/errors";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      return next(
        createError(errorCodes.VALIDATION_ERROR, "Invalid request data")
      );
    }
  };
};
