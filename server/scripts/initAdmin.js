import bcrypt from 'bcrypt';
import Admin from '../models/admin.js';
import sequelize from '../config/database.js';

const initializeAdmin = async () => {
  try {
    // Esperar a que la base de datos esté sincronizada
    await sequelize.sync();

    // Verificar si ya existe un usuario admin
    const existingAdmin = await Admin.findOne({ where: { username: 'admin' } });
    
    if (!existingAdmin) {
      // Crear hash de la contraseña
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Crear usuario admin
      await Admin.create({
        username: 'admin',
        password: hashedPassword
      });
      
      console.log('Usuario admin creado exitosamente');
    } else {
      console.log('El usuario admin ya existe');
    }
  } catch (error) {
    console.error('Error al inicializar admin:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
};

// Ejecutar la inicialización
initializeAdmin();
