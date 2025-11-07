const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fees_management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected successfully');

    // Import models to ensure they're loaded
    const User = require('../models/User');
    const Student = require('../models/Student');
    const FeeType = require('../models/FeeType');
    const FeeStructure = require('../models/FeeStructure');
    const Payment = require('../models/Payment');
    const FeeDue = require('../models/FeeDue');

    // Sync models in correct order to handle foreign key dependencies
    await User.sync({ alter: true });
    await Student.sync({ alter: true });
    await FeeType.sync({ alter: true });
    await FeeStructure.sync({ alter: true });
    await Payment.sync({ alter: true });
    await FeeDue.sync({ alter: true });

    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
