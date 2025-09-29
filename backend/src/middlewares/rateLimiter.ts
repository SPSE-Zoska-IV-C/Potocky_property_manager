import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { createError, errorCodes } from "../utils/errors";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: "Too many requests from this IP, please try again later",
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(createError(errorCodes.FORBIDDEN, "Rate limit exceeded"));
  },
  keyGenerator: (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    return typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip || "unknown";
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, // limit 5 login attempts per hour
  message: "Too many login attempts, please try again later",
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(createError(errorCodes.FORBIDDEN, "Too many login attempts"));
  },
  keyGenerator: (req: Request): string => {
    const forwarded = req.headers["x-forwarded-for"];
    return typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip || "unknown";
  },
  standardHeaders: true,
  legacyHeaders: false,
});
