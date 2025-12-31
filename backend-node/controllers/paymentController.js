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

    // CRITICAL: Institute-based filtering - ensures data isolation
    if (req.user && req.user.institute_id) {
      where.institute_id = req.user.institute_id;
    } else {
      return res.status(403).json({ message: 'Institute context not found' });
    }

    if (student_id) {
      where.student_id = student_id;
    }

    // Role-based filtering on included Student model
    const studentInclude = {
      model: Student,
      as: 'student',
      attributes: ['id', 'serial_number', 'name', 'email', 'course', 'parent_email'],
      where: {}
    };

    if (req.user.role === 'student') {
      // Students can only see their own payments
      studentInclude.where = { email: req.user.email };
      studentInclude.required = true; // INNER JOIN
    } else if (req.user.role === 'parent') {
      // Parents can only see their children's payments
      studentInclude.where = { parent_email: req.user.email };
      studentInclude.required = true; // INNER JOIN
    }
    // Admin and accountant see all payments within their institute

    const payments = await Payment.findAll({
      where,
      include: [
        studentInclude,
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

    // CRITICAL: Institute-based access control
    if (payment.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - payment belongs to a different institute" });
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
    // CRITICAL: First verify student belongs to user's institute
    const student = await Student.findByPk(req.params.studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - student belongs to a different institute" });
    }

    const payments = await Payment.findAll({
      where: {
        student_id: req.params.studentId,
        institute_id: req.user.institute_id // Double-check institute_id
      },
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

    // CRITICAL: Check if student exists and belongs to user's institute
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - student belongs to a different institute" });
    }

    // CRITICAL: Check if fee structure exists and belongs to user's institute
    const feeStructure = await FeeStructure.findByPk(fee_structure_id);
    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (feeStructure.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - fee structure belongs to a different institute" });
    }

    // CRITICAL: Create payment with institute_id from authenticated user
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
      remarks,
      institute_id: req.user.institute_id
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

    // CRITICAL: First check if payment belongs to user's institute
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - payment belongs to a different institute" });
    }

    // If references are being updated, check if they exist and belong to same institute
    if (student_id) {
      const student = await Student.findByPk(student_id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.institute_id !== req.user.institute_id) {
        return res.status(403).json({ message: "Access denied - student belongs to a different institute" });
      }
    }

    if (fee_structure_id) {
      const feeStructure = await FeeStructure.findByPk(fee_structure_id);
      if (!feeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
      if (feeStructure.institute_id !== req.user.institute_id) {
        return res.status(403).json({ message: "Access denied - fee structure belongs to a different institute" });
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
      { where: { id: req.params.id, institute_id: req.user.institute_id } } // Double-check institute_id
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Payment not found or access denied' });
    }

    // Fetch updated record with associations
    const updatedPayment = await Payment.findByPk(req.params.id, {
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

    res.json(updatedPayment);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
exports.deletePayment = async (req, res) => {
  try {
    // CRITICAL: Check if payment belongs to user's institute before deleting
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - payment belongs to a different institute" });
    }

    await Payment.destroy({ where: { id: req.params.id, institute_id: req.user.institute_id } });

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

    // CRITICAL: Institute-based filtering
    if (!req.user || !req.user.institute_id) {
      return res.status(403).json({ message: 'Institute context not found' });
    }

    const payments = await Payment.findAll({
      where: {
        status: 'completed',
        institute_id: req.user.institute_id
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
