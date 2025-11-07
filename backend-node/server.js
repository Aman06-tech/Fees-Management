const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars FIRST
dotenv.config();

// Now require database after env vars are loaded
const { connectDB } = require('./config/database');

// Initialize models and associations
require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/fee-types', require('./routes/feeTypes'));
app.use('/api/fee-structures', require('./routes/feeStructures'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/fee-dues', require('./routes/feeDues'));
app.use('/api/reports', require('./routes/reports'));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;

// Connect to database then start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      // Initialize fee dues scheduler
      const { initScheduler } = require('./services/schedulerService');
      initScheduler();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

