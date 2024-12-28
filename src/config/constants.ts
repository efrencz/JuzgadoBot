const isDevelopment = import.meta.env.DEV;

export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? 'http://localhost:3001' 
    : 'https://chatbot-backend.onrender.com',
  TIMEOUT: 10000, // 10 seconds
};