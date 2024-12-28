import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  CORS_OPTIONS: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  UPLOADS_DIR: join(__dirname, '..', 'uploads'),
};