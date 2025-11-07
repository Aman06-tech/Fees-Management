const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// SMS configuration (using a placeholder - integrate with your SMS provider)
// Popular options: Twilio, AWS SNS, MSG91, etc.
const sendSMS = async (phone, message) => {
  // TODO: Integrate with your SMS provider
  console.log(`SMS to ${phone}: ${message}`);

  // Example for Twilio (uncomment and configure):
  /*
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return { success: true };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error };
  }
  */

  return { success: true, message: 'SMS sent (simulated)' };
};

// Send Email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'Fees Management System <noreply@feesmanagement.com>',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};

// Fee Reminder Email Template
const getFeeReminderEmailTemplate = (studentName, feeDetails, daysUntilDue) => {
  const isOverdue = daysUntilDue < 0;
  const daysText = isOverdue
    ? `${Math.abs(daysUntilDue)} days overdue`
    : daysUntilDue === 0
      ? 'due today'
      : `due in ${daysUntilDue} days`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .fee-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .fee-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .amount { font-size: 24px; font-weight: bold; color: #4F46E5; text-align: center; margin: 20px 0; }
        .warning { background: ${isOverdue ? '#FEE2E2' : '#FEF3C7'}; color: ${isOverdue ? '#991B1B' : '#92400E'}; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fee Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>

          <div class="warning">
            ${isOverdue ? '⚠️ FEE OVERDUE' : '📅 FEE DUE REMINDER'}
          </div>

          <p>This is a ${isOverdue ? 'notice' : 'reminder'} that your fee payment is <strong>${daysText}</strong>.</p>

          <div class="fee-details">
            <h3>Fee Details:</h3>
            <div class="fee-row">
              <span>Fee Type:</span>
              <strong>${feeDetails.feeName}</strong>
            </div>
            <div class="fee-row">
              <span>Course:</span>
              <strong>${feeDetails.course}</strong>
            </div>
            <div class="fee-row">
              <span>Period:</span>
              <strong>${feeDetails.period || 'N/A'}</strong>
            </div>
            <div class="fee-row">
              <span>Due Date:</span>
              <strong>${new Date(feeDetails.dueDate).toLocaleDateString('en-IN')}</strong>
            </div>
            ${isOverdue ? `
            <div class="fee-row">
              <span>Late Fee:</span>
              <strong style="color: #DC2626;">₹${feeDetails.lateFee || 0}</strong>
            </div>
            ` : ''}
          </div>

          <div class="amount">
            Amount: ₹${parseFloat(feeDetails.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            ${isOverdue && feeDetails.lateFee ? `<br/><span style="font-size: 14px; color: #DC2626;">+ ₹${feeDetails.lateFee} Late Fee</span>` : ''}
          </div>

          <p><strong>Please make the payment at your earliest convenience to avoid additional late fees.</strong></p>

          ${isOverdue ? '<p style="color: #DC2626;"><strong>Note:</strong> Late fees may be applicable after the grace period.</p>' : ''}

          <p>For any queries, please contact the administration office.</p>

          <div class="footer">
            <p>This is an automated notification from Fees Management System</p>
            <p>Please do not reply to this email</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Fee Reminder SMS Template
const getFeeReminderSMSTemplate = (studentName, feeDetails, daysUntilDue) => {
  const isOverdue = daysUntilDue < 0;
  const daysText = isOverdue
    ? `OVERDUE by ${Math.abs(daysUntilDue)} days`
    : daysUntilDue === 0
      ? 'DUE TODAY'
      : `due in ${daysUntilDue} days`;

  return `Dear ${studentName}, Your ${feeDetails.feeName} fee of ₹${feeDetails.amount} is ${daysText} (Due: ${new Date(feeDetails.dueDate).toLocaleDateString('en-IN')}). Please pay soon to avoid late fees. -Fees Management System`;
};

// Send Fee Reminder
const sendFeeReminder = async (student, feeDetails, daysUntilDue) => {
  const results = {
    studentEmail: null,
    parentEmail: null,
    studentSMS: null,
    parentSMS: null
  };

  // Prepare fee details
  const emailHtml = getFeeReminderEmailTemplate(student.name, feeDetails, daysUntilDue);
  const smsText = getFeeReminderSMSTemplate(student.name, feeDetails, daysUntilDue);
  const subject = daysUntilDue < 0
    ? '⚠️ Fee Payment Overdue - Immediate Action Required'
    : daysUntilDue === 0
      ? '📅 Fee Payment Due Today'
      : `📅 Fee Payment Reminder - Due in ${daysUntilDue} Days`;

  // Send to Student
  if (student.email) {
    results.studentEmail = await sendEmail(student.email, subject, emailHtml);
  }

  if (student.phone) {
    results.studentSMS = await sendSMS(student.phone, smsText);
  }

  // Send to Parent
  if (student.parent_email) {
    const parentEmailHtml = getFeeReminderEmailTemplate(
      `${student.parent_name || 'Parent'} (${student.name}'s Guardian)`,
      feeDetails,
      daysUntilDue
    );
    results.parentEmail = await sendEmail(student.parent_email, subject, parentEmailHtml);
  }

  if (student.parent_phone) {
    results.parentSMS = await sendSMS(student.parent_phone, smsText);
  }

  return results;
};

// Payment Confirmation Email
const sendPaymentConfirmation = async (student, paymentDetails) => {
  const subject = '✅ Payment Received - Receipt';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10B981; }
        .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .amount { font-size: 28px; font-weight: bold; color: #10B981; text-align: center; margin: 20px 0; }
        .success { background: #D1FAE5; color: #065F46; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Received</h1>
        </div>
        <div class="content">
          <p>Dear ${student.name},</p>

          <div class="success">
            Your payment has been successfully received!
          </div>

          <div class="receipt">
            <h3 style="text-align: center; color: #10B981;">PAYMENT RECEIPT</h3>
            <div class="receipt-row">
              <span>Receipt Number:</span>
              <strong>${paymentDetails.receiptNumber}</strong>
            </div>
            <div class="receipt-row">
              <span>Payment Date:</span>
              <strong>${new Date(paymentDetails.paymentDate).toLocaleDateString('en-IN')}</strong>
            </div>
            <div class="receipt-row">
              <span>Fee Type:</span>
              <strong>${paymentDetails.feeName}</strong>
            </div>
            <div class="receipt-row">
              <span>Period:</span>
              <strong>${paymentDetails.period || 'N/A'}</strong>
            </div>
            <div class="receipt-row">
              <span>Payment Mode:</span>
              <strong>${paymentDetails.paymentMode.toUpperCase()}</strong>
            </div>
            ${paymentDetails.transactionId ? `
            <div class="receipt-row">
              <span>Transaction ID:</span>
              <strong>${paymentDetails.transactionId}</strong>
            </div>
            ` : ''}
          </div>

          <div class="amount">
            Amount Paid: ₹${parseFloat(paymentDetails.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>

          <p>Thank you for your payment. Please keep this receipt for your records.</p>

          <div class="footer">
            <p>This is an automated notification from Fees Management System</p>
            <p>For any queries, please contact the administration office</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const results = {};

  if (student.email) {
    results.studentEmail = await sendEmail(student.email, subject, html);
  }

  if (student.parent_email) {
    results.parentEmail = await sendEmail(student.parent_email, subject, html);
  }

  return results;
};

module.exports = {
  sendEmail,
  sendSMS,
  sendFeeReminder,
  sendPaymentConfirmation,
  getFeeReminderEmailTemplate,
  getFeeReminderSMSTemplate
};
