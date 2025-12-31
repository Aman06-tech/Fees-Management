const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env vars FIRST
dotenv.config();

// Now require database after env vars are loaded
const { connectDB } = require('./config/database');

// Initialize models and associations
require('./models');

const app = express();

// Security Middleware
app.use(helmet()); // Add security headers

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(generalLimiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit to prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
// Export loginLimiter for use in auth routes
app.set('loginLimiter', loginLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/fee-types', require('./routes/feeTypes'));
app.use('/api/fee-structures', require('./routes/feeStructures'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/fee-dues', require('./routes/feeDues'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

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

