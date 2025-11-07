const { Op } = require("sequelize");
const FeeType = require("../models/FeeType");

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

  // Fallback
  console.error(error);
  return res.status(500).json({ message: "Server error" });
}

// @desc    Get all fee types
// @route   GET /api/fee-types
// @access  Private
exports.getFeeTypes = async (req, res) => {
  try {
    const feeTypes = await FeeType.findAll({
      order: [['name', 'ASC']]
    });

    res.json(feeTypes);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get fee type by ID
// @route   GET /api/fee-types/:id
// @access  Private
exports.getFeeTypeById = async (req, res) => {
  try {
    const feeType = await FeeType.findByPk(req.params.id);

    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found' });
    }

    res.json(feeType);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Create fee type
// @route   POST /api/fee-types
// @access  Private
exports.createFeeType = async (req, res) => {
  try {
    const { name, description, is_recurring } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const feeType = await FeeType.create({
      name,
      description,
      is_recurring
    });

    res.status(201).json(feeType);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Update fee type
// @route   PUT /api/fee-types/:id
// @access  Private
exports.updateFeeType = async (req, res) => {
  try {
    const { name, description, is_recurring } = req.body;

    const [updatedCount] = await FeeType.update(
      { name, description, is_recurring },
      { where: { id: req.params.id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Fee type not found' });
    }

    const feeType = await FeeType.findByPk(req.params.id);

    res.json(feeType);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Delete fee type
// @route   DELETE /api/fee-types/:id
// @access  Private
exports.deleteFeeType = async (req, res) => {
  try {
    const feeType = await FeeType.findByPk(req.params.id);

    if (!feeType) {
      return res.status(404).json({ message: 'Fee type not found' });
    }

    await FeeType.destroy({ where: { id: req.params.id } });

    res.json({
      message: 'Fee type deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};
