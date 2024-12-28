import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/database.js';

const Admin = sequelize.define('Admin', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Método para verificar la contraseña
Admin.prototype.validatePassword = async function(password) {
  try {
    console.log('Validating password for user:', this.username);
    const result = await bcrypt.compare(password, this.password);
    console.log('Password validation result:', result);
    return result;
  } catch (error) {
    console.error('Error validating password:', error);
    return false;
  }
};

export default Admin;
