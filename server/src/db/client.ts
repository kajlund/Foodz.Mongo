import mongoose from 'mongoose';
import type { Logger } from 'pino';
export async function connectDatabase(uri: string, logger: Logger): Promise<void> {
  const connection = await mongoose.connect(uri); logger.info({ host: connection.connection.host }, 'MongoDB connected');
}
export async function disconnectDatabase(): Promise<void> { await mongoose.disconnect(); }
