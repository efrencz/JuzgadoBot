import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import chatHistoryRoutes from './routes/chatHistory.js';
import exportRoutes from './routes/export.js';
import clearRoutes from './routes/clear.js';
import { getEventsFromSheet } from './services/sheetsService.js';
import database from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Set default environment variables if not present
process.env.PORT = process.env.PORT || '3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite:./database.sqlite';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
  origin: ['https://frontend-b3ss.onrender.com', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// Rutas de autenticación
app.use('/auth', authRoutes);

// Rutas del chat
app.use('/chat', chatRoutes);

// Rutas del historial de chat
app.use('/chat-history', chatHistoryRoutes);

// Rutas de exportación
app.use('/export', exportRoutes);

// Rutas de limpieza
app.use('/clear', clearRoutes);

// Ruta de prueba
app.get('/test', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ message: 'Backend is working!' });
});

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Chatbot API is running' });
});

// Ruta de eventos
app.get('/events', async (req, res) => {
  try {
    console.log('Obteniendo eventos...');
    const { events } = await getEventsFromSheet();
    console.log('Eventos obtenidos:', events);
    res.json({ events });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ 
      error: 'Error al obtener eventos',
      details: error.message 
    });
  }
});

// Ruta catch-all para SPA en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    details: err.message
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar base de datos y servidor
const startServer = async () => {
  try {
    // Inicializar la base de datos
    const dbInitialized = await database.initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database. Server will not start.');
      process.exit(1);
    }

    // Iniciar el servidor en el puerto 3000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error('Port 3000 is already in use. Please make sure no other process is using it.');
        process.exit(1);
      } else {
        console.error('Error starting server:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

export default app;