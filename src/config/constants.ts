const isDevelopment = import.meta.env.DEV;

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:3000' : 'https://juzgadobot.onrender.com'),
  TIMEOUT: 10000, // 10 seconds
};