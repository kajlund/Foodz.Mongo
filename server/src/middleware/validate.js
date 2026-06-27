import { sendError } from '../utils/response.js';

/**
 * Express middleware factory for validating incoming request data using VineJS validators.
 *
 * @param {Object} validator - VineJS compiled validator instance
 * @param {'body'|'query'|'params'} [source='body'] - Target property on req object to validate
 */
export const validate = (validator, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source] || {};
      const validatedData = await validator.validate(dataToValidate);
      // Replace target request property with validated and sanitized data
      req[source] = validatedData;
      next();
    } catch (error) {
      if (error.messages) {
        return sendError(res, {
          statusCode: 400,
          error: error.messages,
        });
      }
      next(error);
    }
  };
};
