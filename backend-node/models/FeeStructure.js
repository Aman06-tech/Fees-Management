const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeStructure = sequelize.define('FeeStructure', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Course name like IPMAT, GMAT, CAT, etc.'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Fee name like Tuition Fee, Transport Fee, etc.'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  frequency: {
    type: DataTypes.ENUM('monthly', 'alternate_months', 'quarterly', 'annually', 'one_time'),
    allowNull: false,
    defaultValue: 'one_time'
  },
  // Breakdown amounts
  monthly_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Amount if paid monthly'
  },
  alternate_months_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Amount if paid every alternate month (bi-monthly)'
  },
  quarterly_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Amount if paid quarterly'
  },
  yearly_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Amount if paid yearly/annually'
  },
  // Discount fields
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Discount percentage (0-100)'
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Calculated discount amount'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total amount before discount'
  },
  final_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Final amount after discount'
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  institute_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'institutes',
      key: 'id'
    },
    comment: 'Institute/Organization this fee structure belongs to'
  }
}, {
  timestamps: true,
  tableName: 'fee_structures'
});

module.exports = FeeStructure;
