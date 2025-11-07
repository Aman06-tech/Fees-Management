const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getStudents)
  .post(authorize('admin', 'accountant'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(authorize('admin', 'accountant'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;
