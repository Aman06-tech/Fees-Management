const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'card', 'online', 'cheque', 'upi'),
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  late_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'completed'
  },
  receipt_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  payment_period: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment period like January 2025, Q1 2025, 2025, etc.'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'payments',
  hooks: {
    beforeValidate: async (payment, options) => {
      if (!payment.receipt_number) {
        try {
          // Generate receipt number with timestamp for uniqueness
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

          // Use timestamp-based receipt number for guaranteed uniqueness
          payment.receipt_number = `RCP${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
        } catch (error) {
          console.error('Error generating receipt number:', error);
          // Fallback to random number if count fails
          const random = Math.floor(Math.random() * 1000000);
          payment.receipt_number = `RCP${Date.now()}${String(random).padStart(6, '0')}`;
        }
      }
    }
  }
});

module.exports = Payment;
