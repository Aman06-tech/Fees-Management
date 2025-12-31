const Institute = require('./Institute');
const Student = require('./Student');
const FeeType = require('./FeeType');
const FeeStructure = require('./FeeStructure');
const Payment = require('./Payment');
const FeeDue = require('./FeeDue');
const User = require('./User');
const Settings = require('./Settings');

// Define associations

// Institute associations
Institute.hasMany(User, {
  foreignKey: 'institute_id',
  as: 'users'
});

User.belongsTo(Institute, {
  foreignKey: 'institute_id',
  as: 'institute'
});

Institute.hasMany(Student, {
  foreignKey: 'institute_id',
  as: 'students'
});

Student.belongsTo(Institute, {
  foreignKey: 'institute_id',
  as: 'institute'
});

Institute.hasMany(FeeStructure, {
  foreignKey: 'institute_id',
  as: 'feeStructures'
});

FeeStructure.belongsTo(Institute, {
  foreignKey: 'institute_id',
  as: 'institute'
});

Institute.hasMany(Payment, {
  foreignKey: 'institute_id',
  as: 'payments'
});

Payment.belongsTo(Institute, {
  foreignKey: 'institute_id',
  as: 'institute'
});

// Payment belongs to Student
Payment.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student'
});

// Student has many Payments
Student.hasMany(Payment, {
  foreignKey: 'student_id',
  as: 'payments'
});

// Payment belongs to FeeStructure
Payment.belongsTo(FeeStructure, {
  foreignKey: 'fee_structure_id',
  as: 'feeStructure'
});

// FeeStructure has many Payments
FeeStructure.hasMany(Payment, {
  foreignKey: 'fee_structure_id',
  as: 'payments'
});

// Student belongs to FeeStructure
Student.belongsTo(FeeStructure, {
  foreignKey: 'fee_structure_id',
  as: 'feeStructure'
});

// FeeStructure has many Students
FeeStructure.hasMany(Student, {
  foreignKey: 'fee_structure_id',
  as: 'students'
});

// FeeDue associations

// FeeDue belongs to Student
FeeDue.belongsTo(Student, {
  foreignKey: 'student_id',
  as: 'student'
});

// Student has many FeeDues
Student.hasMany(FeeDue, {
  foreignKey: 'student_id',
  as: 'feeDues'
});

// FeeDue belongs to FeeStructure
FeeDue.belongsTo(FeeStructure, {
  foreignKey: 'fee_structure_id',
  as: 'feeStructure'
});

// FeeStructure has many FeeDues
FeeStructure.hasMany(FeeDue, {
  foreignKey: 'fee_structure_id',
  as: 'feeDues'
});

// FeeDue belongs to Payment
FeeDue.belongsTo(Payment, {
  foreignKey: 'payment_id',
  as: 'payment'
});

// Payment has one FeeDue
Payment.hasOne(FeeDue, {
  foreignKey: 'payment_id',
  as: 'feeDue'
});

module.exports = {
  Institute,
  Student,
  FeeType,
  FeeStructure,
  Payment,
  FeeDue,
  User,
  Settings
};
