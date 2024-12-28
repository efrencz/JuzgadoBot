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
  logging: false
});

// Función para inicializar la base de datos
export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true }); 
    console.log('Database synchronized successfully.');

    // Importar el modelo Admin después de la sincronización
    const Admin = (await import('../models/admin.js')).default;

    // Crear usuario admin por defecto si no existe
    const adminExists = await Admin.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      // Hash the password before creating the admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await Admin.create({
        username: 'admin',
        password: hashedPassword
      });
      console.log('Default admin user created successfully.');
    }
  } catch (error) {
    console.error('Unable to initialize database:', error);
    throw error;
  }
};

export default sequelize;
