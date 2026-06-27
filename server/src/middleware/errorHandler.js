import { CustomError } from '../errors.js';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (req.logger) {
    req.logger.error(err);
  } else {
    console.error(err);
  }

  // Handle custom domain errors (NotFoundError, BadRequestError, etc.)
  if (err instanceof CustomError || err.statusCode) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid field: ${err.path}`;
    return res.status(404).json({ success: false, error: message });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, error: message });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({ success: false, error: message });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

export default errorHandler;
