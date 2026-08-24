import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import recipeRoutes from './routes/recipeRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates and configures the Express application instance.
 *
 * @param {Object} config - Application configuration object
 * @param {Object} logger - Pino logger instance
 * @returns {import('express').Express} Configured Express application
 */
export function getApp(config, logger) {
  const app = express();

  // Attach logger to request object
  if (logger) {
    app.use((req, res, next) => {
      req.logger = logger;
      next();
    });
  }

  // Core middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Recipe REST API is running' });
  });

  // API Routes
  app.use('/api/recipes', recipeRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
