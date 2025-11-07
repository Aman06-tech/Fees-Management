const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('./models/Class');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedClasses = async () => {
  try {
    // Clear existing classes
    await Class.deleteMany({});
    console.log('Cleared existing classes');

    // Create classes 1-12
    const classes = [];
    for (let i = 1; i <= 12; i++) {
      classes.push({
        name: `Class ${i}`,
        description: `Standard ${i} curriculum`
      });
    }

    const createdClasses = await Class.insertMany(classes);
    console.log(`Created ${createdClasses.length} classes`);

    // Display created classes with their IDs
    console.log('\nClass IDs for reference:');
    createdClasses.forEach(cls => {
      console.log(`${cls.name}: ${cls._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

// Run seed
connectDB().then(() => {
  console.log('Starting seed process...\n');
  seedClasses();
});
