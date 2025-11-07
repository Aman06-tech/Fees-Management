const Student = require('./Student');
const FeeStructure = require('./FeeStructure');
const FeeDue = require('./FeeDue');
const Payment = require('./Payment');

// Define associations
FeeDue.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Student.hasMany(FeeDue, { foreignKey: 'student_id', as: 'feeDues' });

FeeDue.belongsTo(FeeStructure, { foreignKey: 'fee_structure_id', as: 'feeStructure' });
FeeStructure.hasMany(FeeDue, { foreignKey: 'fee_structure_id', as: 'feeDues' });

FeeDue.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
Payment.hasOne(FeeDue, { foreignKey: 'payment_id', as: 'feeDue' });

Payment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Student.hasMany(Payment, { foreignKey: 'student_id', as: 'payments' });

Payment.belongsTo(FeeStructure, { foreignKey: 'fee_structure_id', as: 'feeStructure' });
FeeStructure.hasMany(Payment, { foreignKey: 'fee_structure_id', as: 'payments' });

module.exports = {
  Student,
  FeeStructure,
  FeeDue,
  Payment
};
