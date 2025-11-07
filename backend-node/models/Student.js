const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  serial_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Course name like IPMAT, GMAT, etc.'
  },
  fee_structure_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'fee_structures',
      key: 'id'
    }
  },
  admission_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'graduated'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  tableName: 'students'
});

module.exports = Student;
