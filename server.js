import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware para manejar CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Middleware para establecer headers de seguridad
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('X-Frame-Options', 'DENY');
  next();
});

// Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API endpoints primero
app.use('/api', (req, res, next) => {
  // Aquí irían tus rutas de API
  next();
});

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(join(__dirname, 'dist')));

// Todas las rutas que no sean API deben servir index.html
app.get('*', (req, res) => {
  console.log('Serving index.html for path:', req.path);
  // Asegurarse de que el encabezado Content-Type esté configurado correctamente
  res.set('Content-Type', 'text/html');
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  console.log(`Sirviendo archivos estáticos desde: ${join(__dirname, 'dist')}`);
});
