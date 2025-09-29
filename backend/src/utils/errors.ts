export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorCodes = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
} as const;

export const createError = (
  statusCode: number,
  message: string,
  isOperational = true
) => {
  return new AppError(statusCode, message, isOperational);
};
