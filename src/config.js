import vine from '@vinejs/vine';

/**
 * VineJS schema for overall application configuration
 */
const configSchema = vine.object({
  NODE_ENV: vine.enum(['development', 'production', 'test']),
  PORT: vine.number().min(1).max(65535),
  MONGO_URI: vine.string(),
  LOG_LEVEL: vine.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
});

const validator = vine.compile(configSchema);

/**
 * Validates environment variables and returns a clean configuration object.
 *
 * @param {Record<string, string>} [env=process.env] - Environment variables object
 * @returns {Promise<{ NODE_ENV: string, PORT: number, MONGO_URI: string, logLevel: string, isDev: boolean }>}
 */
export async function getConfig(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';

  // Prepare raw config input
  let rawConfig;

  if (isProduction) {
    // In production, do NOT provide fallback defaults for critical variables.
    rawConfig = {
      NODE_ENV: env.NODE_ENV,
      PORT: env.PORT,
      MONGO_URI: env.MONGO_URI,
      LOG_LEVEL: env.LOG_LEVEL || 'info', // Defaults to 'info' in production
    };
  } else {
    // Development / Test mode defaults
    rawConfig = {
      NODE_ENV: env.NODE_ENV || 'development',
      PORT: env.PORT || 3000,
      MONGO_URI: env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodz',
      LOG_LEVEL: env.LOG_LEVEL || 'trace', // Defaults to 'trace' in development
    };
  }

  try {
    const validatedConfig = await validator.validate(rawConfig);

    // Extra safeguard: in production, disallow local dev MongoDB URIs
    if (isProduction && (validatedConfig.MONGO_URI.includes('127.0.0.1') || validatedConfig.MONGO_URI.includes('localhost'))) {
      throw new Error('[Config Error] Production deployment cannot use localhost / 127.0.0.1 MONGO_URI.');
    }

    return {
      NODE_ENV: validatedConfig.NODE_ENV,
      PORT: validatedConfig.PORT,
      MONGO_URI: validatedConfig.MONGO_URI,
      logLevel: validatedConfig.LOG_LEVEL,
      isDev: validatedConfig.NODE_ENV === 'development',
    };
  } catch (error) {
    if (error.messages) {
      const formattedErrors = JSON.stringify(error.messages);
      throw new Error(`[Config Validation Failed]: ${formattedErrors}`);
    }
    throw error;
  }
}
