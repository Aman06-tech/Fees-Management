const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const feeDueController = require('../controllers/feeDueController');

// Dashboard stats
router.get('/dashboard/stats', protect, feeDueController.getDashboardStats);

// Student-specific routes
router.get('/student/:studentId', protect, feeDueController.getFeeDuesByStudent);

// Actions on specific fee due
router.post('/:id/mark-paid', protect, feeDueController.markAsPaid);
router.post('/:id/send-reminder', protect, feeDueController.sendManualReminder);

// CRUD operations
router.route('/')
  .get(protect, feeDueController.getFeeDues)
  .post(protect, feeDueController.createFeeDue);

router.route('/:id')
  .get(protect, feeDueController.getFeeDueById)
  .put(protect, feeDueController.updateFeeDue)
  .delete(protect, feeDueController.deleteFeeDue);

module.exports = router;
