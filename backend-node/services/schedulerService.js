const cron = require('node-cron');
const { Op } = require('sequelize');
const FeeDue = require('../models/FeeDue');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const { sendFeeReminder } = require('./notificationService');

// Update fee status based on due dates
const updateFeeStatuses = async () => {
  try {
    console.log('Running fee status update...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mark as 'due' if due date is today
    await FeeDue.update(
      { status: 'due' },
      {
        where: {
          due_date: {
            [Op.gte]: today,
            [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          },
          status: 'pending'
        }
      }
    );

    // Mark as 'overdue' if past due date
    await FeeDue.update(
      { status: 'overdue' },
      {
        where: {
          due_date: {
            [Op.lt]: today
          },
          status: {
            [Op.in]: ['pending', 'due']
          }
        }
      }
    );

    console.log('Fee statuses updated successfully');
  } catch (error) {
    console.error('Error updating fee statuses:', error);
  }
};

// Calculate days until due
const getDaysUntilDue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Send reminders for upcoming due dates
const sendDueReminders = async () => {
  try {
    console.log('Checking for due reminders...');
    const today = new Date();

    // Get all pending/due fees
    const fees = await FeeDue.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'due', 'overdue']
        }
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email', 'phone', 'parent_name', 'parent_email', 'parent_phone', 'course']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'name', 'course', 'amount']
        }
      ]
    });

    for (const fee of fees) {
      const daysUntilDue = getDaysUntilDue(fee.due_date);

      // Determine if reminder should be sent
      let shouldSend = false;
      let reminderType = null;

      if (daysUntilDue === 7 && !fee.reminder_sent_7days) {
        shouldSend = true;
        reminderType = '7days';
      } else if (daysUntilDue === 3 && !fee.reminder_sent_3days) {
        shouldSend = true;
        reminderType = '3days';
      } else if (daysUntilDue === 1 && !fee.reminder_sent_1day) {
        shouldSend = true;
        reminderType = '1day';
      } else if (daysUntilDue < 0 && !fee.reminder_sent_overdue) {
        shouldSend = true;
        reminderType = 'overdue';
      }

      if (shouldSend && fee.student && fee.feeStructure) {
        try {
          // Prepare fee details
          const feeDetails = {
            feeName: fee.feeStructure.name,
            course: fee.feeStructure.course,
            amount: fee.amount,
            dueDate: fee.due_date,
            period: fee.payment_period,
            lateFee: fee.late_fee_applied
          };

          // Send reminder
          const results = await sendFeeReminder(fee.student, feeDetails, daysUntilDue);

          console.log(`Reminder sent for fee ${fee.id} (${reminderType}):`, results);

          // Update reminder status
          const updateData = {};
          if (reminderType === '7days') updateData.reminder_sent_7days = true;
          else if (reminderType === '3days') updateData.reminder_sent_3days = true;
          else if (reminderType === '1day') updateData.reminder_sent_1day = true;
          else if (reminderType === 'overdue') updateData.reminder_sent_overdue = true;

          await fee.update(updateData);
        } catch (error) {
          console.error(`Error sending reminder for fee ${fee.id}:`, error);
        }
      }
    }

    console.log('Due reminders check completed');
  } catch (error) {
    console.error('Error sending due reminders:', error);
  }
};

// Initialize scheduler
const initScheduler = () => {
  console.log('Initializing fee dues scheduler...');

  // Run status update every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled fee status update...');
    updateFeeStatuses();
  });

  // Run reminder check every day at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled reminder check...');
    sendDueReminders();
  });

  // Run status update immediately on startup
  updateFeeStatuses();

  console.log('Fee dues scheduler initialized successfully');
  console.log('- Status updates: Daily at midnight');
  console.log('- Reminder checks: Daily at 9 AM');
};

module.exports = {
  initScheduler,
  updateFeeStatuses,
  sendDueReminders,
  getDaysUntilDue
};
