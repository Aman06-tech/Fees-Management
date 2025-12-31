const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Institute = require('../models/Institute');
const { body, validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Reduced from 30d to 7d for better security
  });
};

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Generate unique institute code
const generateInstituteCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    // Generate a 6-character alphanumeric code
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const institute = await Institute.findOne({ where: { code } });
    exists = !!institute;
  }

  return code;
};

// Validation middleware
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(PASSWORD_REGEX).withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['admin', 'accountant', 'student', 'parent']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, password, name, role, institute_code, institute_name } = req.body;

    console.log('Registration attempt:', { email, name, role, institute_code, institute_name });

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      console.log('User already exists:', email);
      // Generic error message to prevent user enumeration
      return res.status(400).json({ message: 'Registration failed. Please check your information and try again.' });
    }

    let institute_id;

    // Handle institute assignment based on provided data
    if (institute_code) {
      // User wants to join an existing institute
      const institute = await Institute.findOne({ where: { code: institute_code } });

      if (!institute) {
        return res.status(400).json({ message: 'Invalid institute code. Please check and try again.' });
      }

      if (institute.status !== 'active') {
        return res.status(400).json({ message: 'This institute is not currently active.' });
      }

      institute_id = institute.id;
    } else if (institute_name) {
      // Create a new institute (typically for first admin user)
      const code = await generateInstituteCode();
      const institute = await Institute.create({
        name: institute_name,
        code,
        email: email, // Use admin's email as institute email initially
        status: 'active',
        subscription_plan: 'free'
      });

      institute_id = institute.id;
      console.log('New institute created:', { name: institute_name, code });
    } else {
      return res.status(400).json({
        message: 'Please provide either an institute_code to join an existing institute or institute_name to create a new one.'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'admin',
      institute_id
    });

    if (user) {
      console.log('User created successfully:', user.id);

      // Fetch institute details to return with response
      const institute = await Institute.findByPk(institute_id);

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute_id: user.institute_id,
        institute: {
          id: institute.id,
          name: institute.name,
          code: institute.code
        },
        token: generateToken(user.id)
      });
    } else {
      console.log('Failed to create user');
      res.status(400).json({ message: 'Registration failed. Please try again.' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    // Generic error message to prevent information disclosure
    res.status(500).json({ message: 'An error occurred during registration. Please try again.' });
  }
};

exports.register.validation = validateRegister;

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array().map(err => err.msg)
      });
    }

    const { email, password } = req.body;

    // Check for user email with institute
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Institute,
        as: 'institute',
        attributes: ['id', 'name', 'code', 'status']
      }]
    });

    if (user && (await user.comparePassword(password))) {
      // Check if institute is active
      if (user.institute && user.institute.status !== 'active') {
        return res.status(403).json({ message: 'Your institute account is not currently active. Please contact support.' });
      }

      console.log('Successful login:', user.email);
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute_id: user.institute_id,
        institute: user.institute ? {
          id: user.institute.id,
          name: user.institute.name,
          code: user.institute.code
        } : null,
        token: generateToken(user.id)
      });
    } else {
      // Generic error message to prevent user enumeration
      console.log('Failed login attempt for:', email);
      res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    // Generic error message to prevent information disclosure
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  }
};

exports.login.validation = validateLogin;

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Institute,
        as: 'institute',
        attributes: ['id', 'name', 'code', 'email', 'status']
      }]
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { email, name, photoURL, institute_code, institute_name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    let user = await User.findOne({
      where: { email },
      include: [{
        model: Institute,
        as: 'institute',
        attributes: ['id', 'name', 'code', 'status']
      }]
    });

    if (user) {
      // User exists, login
      // Check if institute is active
      if (user.institute && user.institute.status !== 'active') {
        return res.status(403).json({ message: 'Your institute account is not currently active. Please contact support.' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute_id: user.institute_id,
        institute: user.institute ? {
          id: user.institute.id,
          name: user.institute.name,
          code: user.institute.code
        } : null,
        token: generateToken(user.id)
      });
    } else {
      // Create new user - need institute information
      let institute_id;

      if (institute_code) {
        // User wants to join an existing institute
        const institute = await Institute.findOne({ where: { code: institute_code } });

        if (!institute) {
          return res.status(400).json({ message: 'Invalid institute code. Please check and try again.' });
        }

        if (institute.status !== 'active') {
          return res.status(400).json({ message: 'This institute is not currently active.' });
        }

        institute_id = institute.id;
      } else if (institute_name) {
        // Create a new institute
        const code = await generateInstituteCode();
        const institute = await Institute.create({
          name: institute_name,
          code,
          email: email,
          status: 'active',
          subscription_plan: 'free'
        });

        institute_id = institute.id;
        console.log('New institute created via Google OAuth:', { name: institute_name, code });
      } else {
        return res.status(400).json({
          message: 'Please provide either an institute_code to join an existing institute or institute_name to create a new one.'
        });
      }

      user = await User.create({
        email,
        name: name || email.split('@')[0],
        password: Math.random().toString(36).slice(-8) + 'A1!', // Random password (won't be used)
        role: 'admin', // Default role for Google sign-in
        institute_id
      });

      // Fetch institute details to return with response
      const institute = await Institute.findByPk(institute_id);

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute_id: user.institute_id,
        institute: {
          id: institute.id,
          name: institute.name,
          code: institute.code
        },
        token: generateToken(user.id)
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: error.message });
  }
};
