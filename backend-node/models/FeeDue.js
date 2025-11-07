const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeeDue = sequelize.define('FeeDue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  fee_structure_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fee_structures',
      key: 'id'
    }
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Due date for this fee payment'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_period: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment period like January 2025, Q1 2025, etc.'
  },
  status: {
    type: DataTypes.ENUM('pending', 'due', 'overdue', 'paid', 'partially_paid'),
    defaultValue: 'pending',
    comment: 'pending: not yet due, due: due today, overdue: past due date, paid: fully paid'
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  amount_remaining: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  payment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id'
    },
    comment: 'Reference to payment if paid'
  },
  grace_period_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of grace days before late fee applies'
  },
  late_fee_applied: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  reminder_sent_7days: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_sent_3days: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_sent_1day: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder_sent_overdue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'fee_dues',
  indexes: [
    {
      fields: ['student_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    }
  ]
});

module.exports = FeeDue;
