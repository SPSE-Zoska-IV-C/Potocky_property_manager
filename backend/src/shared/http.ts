import { Response } from "express";

// simple centralized error handling helper
// use this to keep controllers lean and consistent
export const handleError = (
  res: Response,
  error: unknown,
  statusCode: number,
  message: string
) => {
  // log raw error for server visibility
  console.error(message, error);
  return res.status(statusCode).json({ error: message });
};
