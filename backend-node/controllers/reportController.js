const { Op } = require('sequelize');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const FeeDue = require('../models/FeeDue');
const FeeStructure = require('../models/FeeStructure');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total collection (completed payments)
    const totalCollectionResult = await Payment.sum('total_amount', {
      where: { status: 'completed' }
    });
    const totalCollection = totalCollectionResult || 0;

    // Get total students
    const totalStudents = await Student.count();

    // Get pending payments (overdue + due + pending fee dues)
    const pendingFeeDues = await FeeDue.findAll({
      where: {
        status: {
          [Op.in]: ['overdue', 'due', 'pending', 'partially_paid']
        }
      }
    });

    const pendingPayments = pendingFeeDues.reduce((sum, feeDue) => {
      return sum + (parseFloat(feeDue.amount_due) || 0);
    }, 0);

    // Get this month's collection
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const thisMonthResult = await Payment.sum('total_amount', {
      where: {
        status: 'completed',
        payment_date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    const thisMonth = thisMonthResult || 0;

    res.json({
      totalCollection: parseFloat(totalCollection.toFixed(2)),
      totalStudents: totalStudents,
      pendingPayments: parseFloat(pendingPayments.toFixed(2)),
      thisMonth: parseFloat(thisMonth.toFixed(2))
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get collection report
// @route   GET /api/reports/collection
// @access  Private
exports.getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'completed' };
    if (startDate && endDate) {
      where.payment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payments = await Payment.findAll({ where });

    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.total_amount), 0);

    const paymentModeBreakdown = {};
    payments.forEach(p => {
      paymentModeBreakdown[p.payment_mode] =
        (paymentModeBreakdown[p.payment_mode] || 0) + parseFloat(p.total_amount);
    });

    res.json({
      total_collected: totalCollected,
      total_students: await Student.count(),
      payment_mode_breakdown: paymentModeBreakdown,
      date_range: {
        start: startDate || 'All time',
        end: endDate || 'Present'
      }
    });
  } catch (error) {
    console.error('Error in getCollectionReport:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get outstanding dues
// @route   GET /api/reports/outstanding
// @access  Private
exports.getOutstandingDues = async (req, res) => {
  try {
    const outstandingDues = await FeeDue.findAll({
      where: {
        status: {
          [Op.in]: ['overdue', 'due', 'pending', 'partially_paid']
        }
      },
      include: [
        {
          model: Student,
          attributes: ['serial_number', 'name', 'email', 'phone']
        },
        {
          model: FeeStructure,
          attributes: ['name', 'course', 'frequency']
        }
      ],
      order: [['due_date', 'ASC']]
    });

    res.json(outstandingDues);
  } catch (error) {
    console.error('Error in getOutstandingDues:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get defaulters list
// @route   GET /api/reports/defaulters
// @access  Private
exports.getDefaulters = async (req, res) => {
  try {
    const { limit } = req.query;

    const today = new Date();

    const defaulters = await FeeDue.findAll({
      where: {
        status: {
          [Op.in]: ['overdue', 'partially_paid']
        },
        due_date: {
          [Op.lt]: today
        }
      },
      include: [
        {
          model: Student,
          attributes: ['serial_number', 'name', 'email', 'phone']
        },
        {
          model: FeeStructure,
          attributes: ['name', 'course']
        }
      ],
      order: [['due_date', 'ASC']],
      limit: limit ? parseInt(limit) : undefined
    });

    // Format defaulters for dashboard
    const formattedDefaulters = defaulters.map(feeDue => {
      const daysOverdue = Math.floor((today - new Date(feeDue.due_date)) / (1000 * 60 * 60 * 24));

      return {
        id: feeDue.id,
        student: feeDue.Student?.name || 'Unknown',
        serialNumber: feeDue.Student?.serial_number || 'N/A',
        amount: parseFloat(feeDue.amount_due),
        dueDate: feeDue.due_date,
        days: daysOverdue
      };
    });

    res.json(formattedDefaulters);
  } catch (error) {
    console.error('Error in getDefaulters:', error);
    res.status(500).json({ message: error.message });
  }
};
