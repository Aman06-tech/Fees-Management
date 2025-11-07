const express = require('express');
const router = express.Router();
const {
  getFeeTypes,
  getFeeTypeById,
  createFeeType,
  updateFeeType,
  deleteFeeType
} = require('../controllers/feeTypeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getFeeTypes)
  .post(authorize('admin'), createFeeType);

router.route('/:id')
  .get(getFeeTypeById)
  .put(authorize('admin'), updateFeeType)
  .delete(authorize('admin'), deleteFeeType);

module.exports = router;
