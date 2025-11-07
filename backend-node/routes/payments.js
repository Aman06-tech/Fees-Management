const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  getPaymentsByStudent,
  getRecentPayments,
  createPayment,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(authorize('admin', 'accountant'), createPayment);

router.get('/recent', getRecentPayments);
router.get('/student/:studentId', getPaymentsByStudent);

router.route('/:id')
  .get(getPaymentById)
  .put(authorize('admin', 'accountant'), updatePayment)
  .delete(authorize('admin'), deletePayment);

module.exports = router;
