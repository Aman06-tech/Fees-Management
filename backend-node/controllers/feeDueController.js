const { Op } = require('sequelize');
const FeeDue = require('../models/FeeDue');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const Payment = require('../models/Payment');
const { sendFeeReminder, sendPaymentConfirmation } = require('../services/notificationService');
const { getDaysUntilDue } = require('../services/schedulerService');

function handleSequelizeError(res, error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: "Invalid reference" });
  }

  console.error(error);
  return res.status(500).json({ message: "Server error" });
}

// @desc    Get all fee dues with filters
// @route   GET /api/fee-dues
// @access  Private
exports.getFeeDues = async (req, res) => {
  try {
    const { status, student_id, overdue_only } = req.query;

    const where = {};
    if (status) where.status = status;
    if (student_id) where.student_id = student_id;

    if (overdue_only === 'true') {
      where.status = { [Op.in]: ['due', 'overdue'] };
    }

    // Role-based filtering on included Student model
    const studentInclude = {
      model: Student,
      as: 'student',
      attributes: ['id', 'serial_number', 'name', 'email', 'phone', 'course', 'parent_name', 'parent_email', 'parent_phone'],
      where: {}
    };

    if (req.user.role === 'student') {
      // Students can only see their own fee dues
      studentInclude.where = { email: req.user.email };
      studentInclude.required = true; // INNER JOIN
    } else if (req.user.role === 'parent') {
      // Parents can only see their children's fee dues
      studentInclude.where = { parent_email: req.user.email };
      studentInclude.required = true; // INNER JOIN
    }
    // Admin and accountant can see all fee dues

    const feeDues = await FeeDue.findAll({
      where,
      include: [
        studentInclude,
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'course', 'name', 'amount', 'frequency']
        }
      ],
      order: [['due_date', 'ASC'], ['status', 'ASC']]
    });

    // Add days until due for each fee
    const feeDuesWithDays = feeDues.map(fee => {
      const feeObj = fee.toJSON();
      feeObj.days_until_due = getDaysUntilDue(fee.due_date);
      return feeObj;
    });

    res.json(feeDuesWithDays);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get fee due by ID
// @route   GET /api/fee-dues/:id
// @access  Private
exports.getFeeDueById = async (req, res) => {
  try {
    const feeDue = await FeeDue.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure'
        },
        {
          model: Payment,
          as: 'payment'
        }
      ]
    });

    if (!feeDue) {
      return res.status(404).json({ message: 'Fee due not found' });
    }

    const feeDueObj = feeDue.toJSON();
    feeDueObj.days_until_due = getDaysUntilDue(feeDue.due_date);

    res.json(feeDueObj);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Create fee due
// @route   POST /api/fee-dues
// @access  Private
exports.createFeeDue = async (req, res) => {
  try {
    const {
      student_id,
      fee_structure_id,
      due_date,
      amount,
      payment_period,
      grace_period_days,
      notes
    } = req.body;

    // Validate required fields
    if (!student_id || !fee_structure_id || !due_date || !amount) {
      return res.status(400).json({
        message: "student_id, fee_structure_id, due_date, and amount are required"
      });
    }

    // Check if student exists
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if fee structure exists
    const feeStructure = await FeeStructure.findByPk(fee_structure_id);
    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    // Calculate amount remaining
    const amountRemaining = parseFloat(amount);

    const feeDue = await FeeDue.create({
      student_id,
      fee_structure_id,
      due_date,
      amount,
      payment_period,
      amount_remaining: amountRemaining,
      grace_period_days: grace_period_days || 0,
      notes,
      status: 'pending'
    });

    // Fetch with associations
    const createdFeeDue = await FeeDue.findByPk(feeDue.id, {
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure'
        }
      ]
    });

    res.status(201).json(createdFeeDue);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Mark fee due as paid
// @route   POST /api/fee-dues/:id/mark-paid
// @access  Private
exports.markAsPaid = async (req, res) => {
  try {
    const { payment_id, amount_paid } = req.body;

    const feeDue = await FeeDue.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure'
        }
      ]
    });

    if (!feeDue) {
      return res.status(404).json({ message: 'Fee due not found' });
    }

    const paidAmount = parseFloat(amount_paid || feeDue.amount_remaining);
    const newAmountPaid = parseFloat(feeDue.amount_paid) + paidAmount;
    const newAmountRemaining = parseFloat(feeDue.amount) - newAmountPaid;

    const updateData = {
      amount_paid: newAmountPaid,
      amount_remaining: newAmountRemaining,
      payment_id: payment_id || feeDue.payment_id
    };

    // Determine new status
    if (newAmountRemaining <= 0) {
      updateData.status = 'paid';
    } else if (newAmountPaid > 0) {
      updateData.status = 'partially_paid';
    }

    await feeDue.update(updateData);

    // Fetch payment details if available
    if (payment_id) {
      const payment = await Payment.findByPk(payment_id);
      if (payment && feeDue.student) {
        // Send payment confirmation
        const paymentDetails = {
          receiptNumber: payment.receipt_number,
          paymentDate: payment.payment_date,
          feeName: feeDue.feeStructure.name,
          period: feeDue.payment_period,
          paymentMode: payment.payment_mode,
          transactionId: payment.transaction_id,
          amount: payment.total_amount
        };

        await sendPaymentConfirmation(feeDue.student, paymentDetails);
      }
    }

    // Fetch updated record
    const updatedFeeDue = await FeeDue.findByPk(feeDue.id, {
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure'
        },
        {
          model: Payment,
          as: 'payment'
        }
      ]
    });

    res.json(updatedFeeDue);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Send manual reminder
// @route   POST /api/fee-dues/:id/send-reminder
// @access  Private
exports.sendManualReminder = async (req, res) => {
  try {
    const feeDue = await FeeDue.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure'
        }
      ]
    });

    if (!feeDue) {
      return res.status(404).json({ message: 'Fee due not found' });
    }

    if (!feeDue.student || !feeDue.feeStructure) {
      return res.status(400).json({ message: 'Missing student or fee structure data' });
    }

    const daysUntilDue = getDaysUntilDue(feeDue.due_date);

    const feeDetails = {
      feeName: feeDue.feeStructure.name,
      course: feeDue.feeStructure.course,
      amount: feeDue.amount,
      dueDate: feeDue.due_date,
      period: feeDue.payment_period,
      lateFee: feeDue.late_fee_applied
    };

    const results = await sendFeeReminder(feeDue.student, feeDetails, daysUntilDue);

    res.json({
      message: 'Reminder sent successfully',
      results
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get fee dues dashboard statistics
// @route   GET /api/fee-dues/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total pending amount
    const pendingFees = await FeeDue.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'due', 'overdue', 'partially_paid']
        }
      },
      attributes: ['amount_remaining']
    });

    const totalPending = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.amount_remaining || 0), 0);

    // Overdue count and amount
    const overdueFees = await FeeDue.findAll({
      where: {
        status: 'overdue'
      },
      attributes: ['amount_remaining']
    });

    const overdueCount = overdueFees.length;
    const overdueAmount = overdueFees.reduce((sum, fee) => sum + parseFloat(fee.amount_remaining || 0), 0);

    // Due today count and amount
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTodayFees = await FeeDue.findAll({
      where: {
        due_date: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        },
        status: {
          [Op.in]: ['pending', 'due', 'partially_paid']
        }
      },
      attributes: ['amount_remaining']
    });

    const dueTodayCount = dueTodayFees.length;
    const dueTodayAmount = dueTodayFees.reduce((sum, fee) => sum + parseFloat(fee.amount_remaining || 0), 0);

    // Upcoming (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingFees = await FeeDue.findAll({
      where: {
        due_date: {
          [Op.gte]: tomorrow,
          [Op.lt]: nextWeek
        },
        status: {
          [Op.in]: ['pending', 'partially_paid']
        }
      },
      attributes: ['amount_remaining']
    });

    const upcomingCount = upcomingFees.length;
    const upcomingAmount = upcomingFees.reduce((sum, fee) => sum + parseFloat(fee.amount_remaining || 0), 0);

    // Paid this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const paidThisMonth = await FeeDue.count({
      where: {
        status: 'paid',
        updatedAt: {
          [Op.gte]: firstDayOfMonth
        }
      }
    });

    res.json({
      totalPending,
      overdueCount,
      overdueAmount,
      dueTodayCount,
      dueTodayAmount,
      upcomingCount,
      upcomingAmount,
      paidThisMonth
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get fee dues by student
// @route   GET /api/fee-dues/student/:studentId
// @access  Private
exports.getFeeDuesByStudent = async (req, res) => {
  try {
    const feeDues = await FeeDue.findAll({
      where: { student_id: req.params.studentId },
      include: [
        {
          model: FeeStructure,
          as: 'feeStructure'
        },
        {
          model: Payment,
          as: 'payment'
        }
      ],
      order: [['due_date', 'DESC']]
    });

    const feeDuesWithDays = feeDues.map(fee => {
      const feeObj = fee.toJSON();
      feeObj.days_until_due = getDaysUntilDue(fee.due_date);
      return feeObj;
    });

    res.json(feeDuesWithDays);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Update fee due
// @route   PUT /api/fee-dues/:id
// @access  Private
exports.updateFeeDue = async (req, res) => {
  try {
    const {
      due_date,
      amount,
      payment_period,
      grace_period_days,
      late_fee_applied,
      notes
    } = req.body;

    const feeDue = await FeeDue.findByPk(req.params.id);

    if (!feeDue) {
      return res.status(404).json({ message: 'Fee due not found' });
    }

    const updateData = {};
    if (due_date) updateData.due_date = due_date;
    if (amount) {
      updateData.amount = amount;
      updateData.amount_remaining = parseFloat(amount) - parseFloat(feeDue.amount_paid);
    }
    if (payment_period !== undefined) updateData.payment_period = payment_period;
    if (grace_period_days !== undefined) updateData.grace_period_days = grace_period_days;
    if (late_fee_applied !== undefined) updateData.late_fee_applied = late_fee_applied;
    if (notes !== undefined) updateData.notes = notes;

    await feeDue.update(updateData);

    const updatedFeeDue = await FeeDue.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: FeeStructure,
          as: 'feeStructure'
        }
      ]
    });

    res.json(updatedFeeDue);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Delete fee due
// @route   DELETE /api/fee-dues/:id
// @access  Private
exports.deleteFeeDue = async (req, res) => {
  try {
    const feeDue = await FeeDue.findByPk(req.params.id);

    if (!feeDue) {
      return res.status(404).json({ message: 'Fee due not found' });
    }

    await FeeDue.destroy({ where: { id: req.params.id } });

    res.json({
      message: 'Fee due deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

module.exports = exports;
