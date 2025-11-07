const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");
const FeeDue = require("../models/FeeDue");
const { sendPaymentConfirmation } = require("../services/notificationService");

function handleSequelizeError(res, error) {
  // Unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    return res.status(409).json({ message: `${field} already exists` });
  }

  // Validation error
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // Foreign key constraint error
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: "Invalid reference" });
  }

  // Fallback
  console.error(error);
  return res.status(500).json({ message: "Server error" });
}

// @desc    Get all payments (supports ?student_id= filtering)
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const { student_id } = req.query;

    const where = {};
    if (student_id) {
      where.student_id = student_id;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'serial_number', 'name', 'email', 'course']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'course', 'name', 'amount', 'frequency']
        }
      ],
      order: [['payment_date', 'DESC']]
    });

    res.json(payments);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'serial_number', 'name', 'email', 'course']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'course', 'name', 'amount', 'frequency']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get payments by student ID
// @route   GET /api/payments/student/:studentId
// @access  Private
exports.getPaymentsByStudent = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { student_id: req.params.studentId },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'serial_number', 'name', 'email', 'course']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'course', 'name', 'amount', 'frequency']
        }
      ],
      order: [['payment_date', 'DESC']]
    });

    res.json(payments);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const {
      student_id,
      fee_structure_id,
      amount,
      payment_mode,
      transaction_id,
      payment_date,
      late_fee,
      discount,
      total_amount,
      status,
      payment_period,
      remarks
    } = req.body;

    // Validate required fields
    if (!student_id || !fee_structure_id || !amount || !payment_mode || !total_amount) {
      return res.status(400).json({
        message: "student_id, fee_structure_id, amount, payment_mode, and total_amount are required"
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

    const payment = await Payment.create({
      student_id,
      fee_structure_id,
      amount,
      payment_mode,
      transaction_id,
      payment_date,
      late_fee,
      discount,
      total_amount,
      status,
      payment_period,
      remarks
    });

    // Auto-update fee dues if there's a matching fee due
    if (payment_period) {
      // Find matching fee due by student, fee structure, and payment period
      const feeDue = await FeeDue.findOne({
        where: {
          student_id,
          fee_structure_id,
          payment_period,
          status: {
            [Op.in]: ['pending', 'due', 'overdue', 'partially_paid']
          }
        },
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

      if (feeDue) {
        // Mark fee due as paid
        const paidAmount = parseFloat(total_amount);
        const newAmountPaid = parseFloat(feeDue.amount_paid) + paidAmount;
        const newAmountRemaining = parseFloat(feeDue.amount) - newAmountPaid;

        const updateData = {
          amount_paid: newAmountPaid,
          amount_remaining: newAmountRemaining,
          payment_id: payment.id
        };

        // Determine new status
        if (newAmountRemaining <= 0) {
          updateData.status = 'paid';
        } else if (newAmountPaid > 0) {
          updateData.status = 'partially_paid';
        }

        await feeDue.update(updateData);

        // Send payment confirmation
        if (feeDue.student) {
          const paymentDetails = {
            receiptNumber: payment.receipt_number,
            paymentDate: payment.payment_date,
            feeName: feeDue.feeStructure.name,
            period: payment_period,
            paymentMode: payment_mode,
            transactionId: transaction_id,
            amount: total_amount
          };

          await sendPaymentConfirmation(feeDue.student, paymentDetails);
        }
      }
    }

    // Fetch with associations
    const createdPayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'serial_number', 'name', 'email', 'course']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'course', 'name', 'amount', 'frequency']
        }
      ]
    });

    res.status(201).json(createdPayment);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
exports.updatePayment = async (req, res) => {
  try {
    const {
      student_id,
      fee_structure_id,
      amount,
      payment_mode,
      transaction_id,
      payment_date,
      late_fee,
      discount,
      total_amount,
      status,
      payment_period,
      remarks
    } = req.body;

    // If references are being updated, check if they exist
    if (student_id) {
      const student = await Student.findByPk(student_id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
    }

    if (fee_structure_id) {
      const feeStructure = await FeeStructure.findByPk(fee_structure_id);
      if (!feeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
    }

    const [updatedCount] = await Payment.update(
      {
        student_id,
        fee_structure_id,
        amount,
        payment_mode,
        transaction_id,
        payment_date,
        late_fee,
        discount,
        total_amount,
        status,
        payment_period,
        remarks
      },
      { where: { id: req.params.id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Fetch updated record with associations
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'serial_number', 'name', 'email', 'course']
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
          attributes: ['id', 'course', 'name', 'amount', 'frequency']
        }
      ]
    });

    res.json(payment);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await Payment.destroy({ where: { id: req.params.id } });

    res.json({
      message: 'Payment deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get recent payments for dashboard
// @route   GET /api/payments/recent
// @access  Private
exports.getRecentPayments = async (req, res) => {
  try {
    const { limit } = req.query;

    const payments = await Payment.findAll({
      where: {
        status: 'completed'
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['serial_number', 'name']
        }
      ],
      order: [['payment_date', 'DESC']],
      limit: limit ? parseInt(limit) : 5
    });

    // Format payments for dashboard
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      student: payment.student?.name || 'Unknown',
      serialNumber: payment.student?.serial_number || 'N/A',
      amount: parseFloat(payment.total_amount),
      date: payment.payment_date,
      status: payment.status
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error in getRecentPayments:', error);
    return handleSequelizeError(res, error);
  }
};
