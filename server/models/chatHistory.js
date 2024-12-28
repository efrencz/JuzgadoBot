import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChatHistory = sequelize.define('ChatHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'anonymous'
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'unknown'
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}'
  }
}, {
  tableName: 'ChatHistories',
  timestamps: true
});

export default ChatHistory;
