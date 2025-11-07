require('dotenv').config();
const { sendFeeReminder } = require('./services/notificationService');

// Test student data
const testStudent = {
  name: 'Arpan',
  email: 'aman14061406@gmail.com', // Sending to your email for testing
  phone: '+919876543210',
  parent_name: 'Parent of Arpan',
  parent_email: 'aman14061406@gmail.com', // Same email for testing
  parent_phone: '+919876543211'
};

// Test fee details
const testFeeDetails = {
  feeName: 'CAT Tuition Fees',
  course: 'CAT',
  amount: 70000,
  dueDate: '2025-10-01',
  period: 'Q3-2025',
  lateFee: 500
};

// -33 days means 33 days overdue
const daysUntilDue = -33;

console.log('Sending test fee reminder email...');
console.log('To:', testStudent.email);
console.log('Fee:', testFeeDetails.feeName);
console.log('Amount:', testFeeDetails.amount);
console.log('Status:', daysUntilDue < 0 ? 'OVERDUE' : 'DUE');

sendFeeReminder(testStudent, testFeeDetails, daysUntilDue)
  .then((results) => {
    console.log('\n✅ Email sent successfully!');
    console.log('Results:', JSON.stringify(results, null, 2));
    console.log('\nPlease check your email:', testStudent.email);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error sending email:', error);
    process.exit(1);
  });
