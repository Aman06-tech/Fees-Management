const express = require('express');
const router = express.Router();
const {
  getFeeStructures,
  getFeeStructureById,
  getFeeStructuresByCourse,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
} = require('../controllers/feeStructureController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getFeeStructures)
  .post(authorize('admin'), createFeeStructure);

router.get('/course/:course', getFeeStructuresByCourse);

router.route('/:id')
  .get(getFeeStructureById)
  .put(authorize('admin'), updateFeeStructure)
  .delete(authorize('admin'), deleteFeeStructure);

module.exports = router;
