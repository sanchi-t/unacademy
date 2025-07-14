const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (error, req, res, next) => {
  let { statusCode = 500, message } = error;

  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  if (error.code === "23505") {
    statusCode = 409;
    message = "Duplicate entry found";
  } else if (error.code === "23502") {
    statusCode = 400;
    message = "Required field missing";
  } else if (error.code === "23503") {
    statusCode = 400;
    message = "Invalid reference";
  } else if (error.code === "ECONNREFUSED") {
    statusCode = 503;
    message = "Service temporarily unavailable";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = error.message;
  }

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      details: error,
    }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
};
