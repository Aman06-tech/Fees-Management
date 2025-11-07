const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getCollectionReport,
  getOutstandingDues,
  getDefaulters
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'accountant'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/collection', getCollectionReport);
router.get('/outstanding', getOutstandingDues);
router.get('/defaulters', getDefaulters);

module.exports = router;
