import { config } from 'dotenv';

// Load environment variables
config();

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DATABASE: {
    URL: process.env.DATABASE_URL || 'sqlite:./dev.db',
    MIGRATIONS_PATH: './src/database/migrations',
  },
  
  // JWT configuration
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Google OAuth configuration
  GOOGLE_OAUTH: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
  },
  
  // CORS configuration
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
} as const;

export default CONFIG;