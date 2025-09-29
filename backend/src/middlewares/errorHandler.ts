import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, errorCodes } from "../utils/errors";
import { PostgresError } from "postgres";

export function errorHandler(
  err: Error | ZodError | AppError | PostgresError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // handle zod validation errors
  if (err instanceof ZodError) {
    return res.status(errorCodes.VALIDATION_ERROR).json({
      status: "error",
      message: "Validation error",
      errors: err.errors.map((error) => ({
        path: error.path,
        message: error.message,
      })),
    });
  }

  // handle Postgres errors
  if ((err as PostgresError).code) {
    const pgError = err as PostgresError;
    switch (pgError.code) {
      case "23505": // unique_violation
        return res.status(errorCodes.CONFLICT).json({
          status: "error",
          message: "A record with this value already exists",
        });
      case "23503": // foreign_key_violation
        return res.status(errorCodes.VALIDATION_ERROR).json({
          status: "error",
          message: "Referenced record does not exist",
        });
      default:
        console.error("Database error:", pgError);
    }
  }

  // Handle all other errors
  console.error("Unhandled error:", err);
  return res.status(errorCodes.INTERNAL_SERVER).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
