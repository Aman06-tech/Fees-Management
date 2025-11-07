const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('../models/Class');

// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedClasses = async () => {
  try {
    // Check if classes already exist
    const existingClasses = await Class.find();

    if (existingClasses.length > 0) {
      console.log('Classes already exist. Skipping seed.');
      process.exit(0);
    }

    // Create default classes
    const defaultClasses = [
      {
        _id: new mongoose.Types.ObjectId('673b0a2c8f5e4a1b2c3d4e5f'),
        name: 'Grade 1',
        description: 'First Grade'
      },
      { name: 'Grade 2', description: 'Second Grade' },
      { name: 'Grade 3', description: 'Third Grade' },
      { name: 'Grade 4', description: 'Fourth Grade' },
      { name: 'Grade 5', description: 'Fifth Grade' },
      { name: 'Grade 6', description: 'Sixth Grade' },
      { name: 'Grade 7', description: 'Seventh Grade' },
      { name: 'Grade 8', description: 'Eighth Grade' },
      { name: 'Grade 9', description: 'Ninth Grade' },
      { name: 'Grade 10', description: 'Tenth Grade' }
    ];

    const classes = await Class.insertMany(defaultClasses);
    console.log(`✅ ${classes.length} classes created successfully!`);
    console.log('Classes:', classes.map(c => ({ id: c._id, name: c.name })));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding classes:', error);
    process.exit(1);
  }
};

seedClasses();
