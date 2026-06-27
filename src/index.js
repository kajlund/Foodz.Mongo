import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { getConfig } from './config.js';
import { getLogger } from './logger.js';
import recipeRoutes from './routes/recipeRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Validate configuration
    const config = await getConfig();

    // Initialize Pino logger
    const logger = getLogger(config);

    // Connect to MongoDB using validated URI and logger
    await connectDB(config.MONGO_URI, logger);

    const app = express();

    // Attach logger to request object
    app.use((req, res, next) => {
      req.logger = logger;
      next();
    });

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Health check route
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', message: 'Recipe REST API is running' });
    });

    // API Routes
    app.use('/api/recipes', recipeRoutes);

    // Global Error Handler
    app.use(errorHandler);

    const server = app.listen(config.PORT, () => {
      logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT} (Log level: ${config.logLevel})`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.fatal(`Unhandled Rejection Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Initialization Error: ${error.message}`);
    process.exit(1);
  }
}

startServer();
