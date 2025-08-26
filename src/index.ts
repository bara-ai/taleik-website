import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CONFIG } from './config';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { successResponse } from './utils/responses';
import authRoutes from './routes/auth';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: CONFIG.CORS.ORIGIN,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/', (_req, res) => {
  res.json(successResponse({
    message: 'Taleik API',
    version: '1.0.0',
    environment: CONFIG.NODE_ENV,
  }, 'API is running successfully'));
});

// API Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;

if (require.main === module) {
  app.listen(CONFIG.PORT, () => {
    console.log(`Server listening on port ${CONFIG.PORT}`);
    console.log(`Environment: ${CONFIG.NODE_ENV}`);
  });
}
