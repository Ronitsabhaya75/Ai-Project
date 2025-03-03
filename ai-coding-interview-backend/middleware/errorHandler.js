class APIError extends Error {
    constructor(message, status = 500, details = null) {
      super(message);
      this.name = this.constructor.name;
      this.status = status;
      this.details = details;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error: ${err.stack}`);
  
    const response = {
      error: {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        ...(err.details && { details: err.details })
      }
    };
  
    res.status(err.status || 500).json(response);
  };
  
  module.exports = { APIError, errorHandler };