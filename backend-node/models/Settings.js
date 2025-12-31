const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  institution_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Institution Name'
  },
  institution_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contact_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '2024-2025'
  },
  // Email notification settings
  email_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sms_notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  payment_reminders_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  late_fee_alerts_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'settings'
});

module.exports = Settings;
