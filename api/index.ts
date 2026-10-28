import express from 'express';
import { apiRouter } from '../src/server/api.ts';
import { getDatabase } from '../src/db/database.ts';

const app = express();
app.use(express.json({ limit: '10mb' }));

try {
  getDatabase();
} catch (err) {
  console.warn('Database initialization warning:', err);
}

// Mount apiRouter both with /api prefix and directly
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
