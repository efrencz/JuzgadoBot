import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Desactivar logging para producción
  define: {
    timestamps: true, // Habilitar timestamps por defecto
    underscored: true // Usar snake_case para nombres de columnas
  }
});

// Función para inicializar la base de datos
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Importar todos los modelos
    const [adminModule, chatHistoryModule] = await Promise.all([
      import('../models/admin.js'),
      import('../models/chatHistory.js')
    ]);

    const Admin = adminModule.default;
    const ChatHistory = chatHistoryModule.default;

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true }); 
    console.log('Database synchronized successfully.');

    // Crear admin por defecto si no existe
    const adminExists = await Admin.findOne();
    if (!adminExists) {
      await Admin.create({
        username: 'admin',
        password: await bcrypt.hash('admin123', 10)
      });
      console.log('Default admin user created.');
    }

    return true;
  } catch (error) {
    console.error('Unable to initialize database:', error);
    return false;
  }
};

const database = {
  sequelize,
  initializeDatabase
};

export default database;
