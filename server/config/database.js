import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Sequelize para PostgreSQL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://chatbot_bd_user:kPmqEtee0DjQ9LqI3qMZ15UwZQWyNjof@dpg-cu1v0od2ng1s73eg4nhg-a.oregon-postgres.render.com/chatbot_bd';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  define: {
    timestamps: true,
    underscored: true
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
