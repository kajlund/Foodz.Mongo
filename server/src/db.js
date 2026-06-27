import mongoose from 'mongoose';

const connectDB = async (mongoUri, logger) => {
  try {
    const conn = await mongoose.connect(mongoUri);
    if (logger) {
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
  } catch (error) {
    if (logger) {
      logger.error(`MongoDB Connection Error: ${error.message}`);
    } else {
      console.error(`MongoDB Connection Error: ${error.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;
