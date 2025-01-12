import Admin from '../models/admin.js';
import database from '../config/database.js';

const initializeAdmin = async () => {
  try {
    // Esperar a que la base de datos esté sincronizada
    await database.sequelize.sync();

    // Eliminar admin existente si existe
    await Admin.destroy({ where: { username: 'admin' } });
    
    // Crear nuevo usuario admin
    const admin = await Admin.create({
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Usuario admin creado exitosamente:', admin.username);
  } catch (error) {
    console.error('Error al inicializar admin:', error);
  }
};

// Ejecutar la inicialización
initializeAdmin();
