import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "Something went wrong";

  // -------------------------
  // 1. AppError
  // -------------------------
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  // -------------------------
  // 2. Zod
  // -------------------------
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid request data";
  }

  // -------------------------
  // 3. Prisma - duplicate
  // -------------------------
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "A resource with this value already exists";
  }

  // -------------------------
  // 4. Prisma - not found
  // -------------------------
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    statusCode = 404;
    code = "RESOURCE_NOT_FOUND";
    message = "Resource not found";
  }

  // -------------------------
  // 5. JWT invalid
  // -------------------------
  else if (err?.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid authentication token";
  }

  // -------------------------
  // 6. JWT expired
  // -------------------------
  else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Authentication token has expired";
  }

  // -------------------------
  // Observability
  // -------------------------
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    error: err.name,
    message: err.message,
    
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });

  // -------------------------
  // Safe response
  // -------------------------
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    },
  });
};
