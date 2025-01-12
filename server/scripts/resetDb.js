import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Eliminar la base de datos si existe
if (fs.existsSync(dbPath)) {
  console.log('Eliminando base de datos existente...');
  fs.unlinkSync(dbPath);
  console.log('Base de datos eliminada.');
}

// Importar y ejecutar la inicialización de la base de datos
import { initializeDatabase } from '../config/database.js';

console.log('Inicializando nueva base de datos...');
await initializeDatabase()
  .then(() => {
    console.log('Base de datos reiniciada exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error al reiniciar la base de datos:', error);
    process.exit(1);
  });
