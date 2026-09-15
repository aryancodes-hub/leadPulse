class AppError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    ((this.statusCode = statusCode), (this.code = code), (this.details = details));
  }
}

class BadRequestError extends AppError {
  constructor(message = "Invalid request", details = []) {
    super(400, "INVALID_REQUEST", message, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authenticaton Required.") {
    super(401, "UNAUTHORIZED", message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Access denied.") {
    super(403, "FORBIDDEN", message);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(404, "NOT_FOUND", message);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict.") {
    super(409, "CONFLICT", message);
  }
}

class GoneError extends AppError {
  constructor(message = "Resource is no longer available.") {
    super(410, "GONE", message);
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message = "Validation failed", details = []) {
    super(422, "UNPROCESSABLE_ENTITY", message, details);
  }
}

module.exports = {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  GoneError,
  UnprocessableEntityError
};
