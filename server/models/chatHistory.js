import { DataTypes } from 'sequelize';
import database from '../config/database.js';

const chat_histories = database.sequelize.define('chat_histories', {
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'anonymous',
    field: 'user_name'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unknown',
    field: 'phone_number'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'session_id'
  },
  queries: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('queries');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch (error) {
        console.error('Error parsing queries:', error);
        return [];
      }
    },
    set(value) {
      let valueToStore = value;
      if (Array.isArray(value)) {
        valueToStore = JSON.stringify(value);
      } else if (typeof value === 'string') {
        // Verificar si ya es un string JSON válido
        try {
          JSON.parse(value);
          valueToStore = value;
        } catch {
          valueToStore = JSON.stringify([value]);
        }
      } else {
        valueToStore = '[]';
      }
      this.setDataValue('queries', valueToStore);
    }
  },
  responses: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('responses');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch (error) {
        console.error('Error parsing responses:', error);
        return [];
      }
    },
    set(value) {
      let valueToStore = value;
      if (Array.isArray(value)) {
        valueToStore = JSON.stringify(value);
      } else if (typeof value === 'string') {
        // Verificar si ya es un string JSON válido
        try {
          JSON.parse(value);
          valueToStore = value;
        } catch {
          valueToStore = JSON.stringify([value]);
        }
      } else {
        valueToStore = '[]';
      }
      this.setDataValue('responses', valueToStore);
    }
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'chat_histories'
});

export default chat_histories;
