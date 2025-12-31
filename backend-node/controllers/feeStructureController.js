const { Op } = require("sequelize");
const FeeStructure = require("../models/FeeStructure");

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

// Helper function to calculate amounts with discount
function calculateAmounts(data) {
  const amount = parseFloat(data.amount) || 0;
  const discountPercentage = parseFloat(data.discount_percentage) || 0;

  // Calculate total amount (could be same as amount or calculated differently)
  const totalAmount = parseFloat(data.total_amount) || amount;

  // Calculate discount amount
  const discountAmount = (totalAmount * discountPercentage) / 100;

  // Calculate final amount after discount
  const finalAmount = totalAmount - discountAmount;

  return {
    total_amount: totalAmount.toFixed(2),
    discount_amount: discountAmount.toFixed(2),
    final_amount: finalAmount.toFixed(2)
  };
}

// @desc    Get all fee structures (supports ?course=IPMAT filtering)
// @route   GET /api/fee-structures
// @access  Private
exports.getFeeStructures = async (req, res) => {
  try {
    const { course } = req.query;

    const where = {};

    // CRITICAL: Institute-based filtering - ensures data isolation
    if (req.user && req.user.institute_id) {
      where.institute_id = req.user.institute_id;
    } else {
      return res.status(403).json({ message: 'Institute context not found' });
    }

    if (course) {
      where.course = course;
    }

    const feeStructures = await FeeStructure.findAll({
      where,
      order: [['course', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json(feeStructures);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get fee structure by ID
// @route   GET /api/fee-structures/:id
// @access  Private
exports.getFeeStructureById = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findByPk(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // CRITICAL: Institute-based access control
    if (feeStructure.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - fee structure belongs to a different institute" });
    }

    res.json(feeStructure);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Create fee structure
// @route   POST /api/fee-structures
// @access  Private
exports.createFeeStructure = async (req, res) => {
  try {
    const {
      course,
      name,
      amount,
      frequency,
      due_date,
      description,
      monthly_amount,
      alternate_months_amount,
      quarterly_amount,
      yearly_amount,
      discount_percentage,
      total_amount
    } = req.body;

    // Validate required fields
    if (!course || !name || !amount || !frequency || !due_date) {
      return res.status(400).json({
        message: "course, name, amount, frequency, and due_date are required"
      });
    }

    // Calculate discount amounts
    const calculatedAmounts = calculateAmounts({
      amount,
      discount_percentage: discount_percentage || 0,
      total_amount: total_amount || amount
    });

    // CRITICAL: Create fee structure with institute_id from authenticated user
    const feeStructure = await FeeStructure.create({
      course,
      name,
      amount,
      frequency,
      due_date,
      description,
      monthly_amount: monthly_amount || 0,
      alternate_months_amount: alternate_months_amount || 0,
      quarterly_amount: quarterly_amount || 0,
      yearly_amount: yearly_amount || 0,
      discount_percentage: discount_percentage || 0,
      ...calculatedAmounts,
      institute_id: req.user.institute_id
    });

    res.status(201).json(feeStructure);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Update fee structure
// @route   PUT /api/fee-structures/:id
// @access  Private
exports.updateFeeStructure = async (req, res) => {
  try {
    const {
      course,
      name,
      amount,
      frequency,
      due_date,
      description,
      monthly_amount,
      alternate_months_amount,
      quarterly_amount,
      yearly_amount,
      discount_percentage,
      total_amount
    } = req.body;

    // CRITICAL: First check if fee structure belongs to user's institute
    const feeStructure = await FeeStructure.findByPk(req.params.id);
    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    if (feeStructure.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - fee structure belongs to a different institute" });
    }

    // Calculate discount amounts
    const calculatedAmounts = calculateAmounts({
      amount,
      discount_percentage: discount_percentage || 0,
      total_amount: total_amount || amount
    });

    const updateData = {
      course,
      name,
      amount,
      frequency,
      due_date,
      description,
      monthly_amount: monthly_amount !== undefined ? monthly_amount : 0,
      alternate_months_amount: alternate_months_amount !== undefined ? alternate_months_amount : 0,
      quarterly_amount: quarterly_amount !== undefined ? quarterly_amount : 0,
      yearly_amount: yearly_amount !== undefined ? yearly_amount : 0,
      discount_percentage: discount_percentage !== undefined ? discount_percentage : 0,
      ...calculatedAmounts
    };

    const [updatedCount] = await FeeStructure.update(
      updateData,
      { where: { id: req.params.id, institute_id: req.user.institute_id } } // Double-check institute_id
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Fee structure not found or access denied' });
    }

    const updatedFeeStructure = await FeeStructure.findByPk(req.params.id);

    res.json(updatedFeeStructure);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Delete fee structure
// @route   DELETE /api/fee-structures/:id
// @access  Private
exports.deleteFeeStructure = async (req, res) => {
  try {
    // CRITICAL: Check if fee structure belongs to user's institute before deleting
    const feeStructure = await FeeStructure.findByPk(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    if (feeStructure.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - fee structure belongs to a different institute" });
    }

    // Check if fee structure is being used by any students/payments/fee dues in the same institute
    const Student = require('../models/Student');
    const Payment = require('../models/Payment');
    const FeeDue = require('../models/FeeDue');

    // CRITICAL: Scope the count checks to same institute only
    const studentCount = await Student.count({
      where: {
        fee_structure_id: req.params.id,
        institute_id: req.user.institute_id
      }
    });
    const paymentCount = await Payment.count({
      where: {
        fee_structure_id: req.params.id,
        institute_id: req.user.institute_id
      }
    });
    const feeDueCount = await FeeDue.count({
      where: {
        fee_structure_id: req.params.id,
        institute_id: req.user.institute_id
      }
    });

    if (studentCount > 0 || paymentCount > 0 || feeDueCount > 0) {
      const usedBy = [];
      if (studentCount > 0) usedBy.push(`${studentCount} student(s)`);
      if (paymentCount > 0) usedBy.push(`${paymentCount} payment(s)`);
      if (feeDueCount > 0) usedBy.push(`${feeDueCount} fee due(s)`);

      return res.status(400).json({
        message: `Cannot delete fee structure. It is currently being used by ${usedBy.join(', ')}. Please remove these references first.`
      });
    }

    await FeeStructure.destroy({ where: { id: req.params.id, institute_id: req.user.institute_id } });

    res.json({
      message: 'Fee structure deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get fee structures by course
// @route   GET /api/fee-structures/course/:course
// @access  Private
exports.getFeeStructuresByCourse = async (req, res) => {
  try {
    const { course } = req.params;

    // CRITICAL: Institute-based filtering
    if (!req.user || !req.user.institute_id) {
      return res.status(403).json({ message: 'Institute context not found' });
    }

    const feeStructures = await FeeStructure.findAll({
      where: {
        course,
        institute_id: req.user.institute_id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(feeStructures);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};
