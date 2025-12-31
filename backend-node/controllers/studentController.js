const { Op } = require("sequelize");
const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");

/**
 * Allowed fields that can be written from the client.
 * This prevents accidental/ malicious extra properties from being stored.
 */
const ALLOWED_FIELDS = [
  "serial_number",
  "name",
  "email",
  "phone",
  "parent_name",
  "parent_phone",
  "parent_email",
  "course",
  "fee_structure_id",
  "admission_date",
  "status",
];

function sanitizePayload(body = {}) {
  const payload = {};
  for (const key of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key];
    }
  }
  return payload;
}

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

// @desc    Get all students (supports ?q=search, ?page, ?limit, ?sort)
exports.getStudents = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 25, sort = "-createdAt" } = req.query;

    const where = {};

    // CRITICAL: Institute-based filtering - ensures data isolation
    if (req.user && req.user.institute_id) {
      where.institute_id = req.user.institute_id;
    } else {
      return res.status(403).json({ message: 'Institute context not found' });
    }

    // Role-based access control
    if (req.user.role === 'student') {
      // Students can only see their own record
      where.email = req.user.email;
    } else if (req.user.role === 'parent') {
      // Parents can only see their children's records
      where.parent_email = req.user.email;
    }
    // Admin and accountant can see all students within their institute

    if (q && q.trim()) {
      const searchCondition = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q.trim()}%` } },
          { serial_number: { [Op.iLike]: `%${q.trim()}%` } },
          { email: { [Op.iLike]: `%${q.trim()}%` } },
          { course: { [Op.iLike]: `%${q.trim()}%` } },
        ]
      };

      // Combine role-based filter with search
      if (Object.keys(where).length > 0) {
        where[Op.and] = [searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

    // Parse sort parameter (e.g., "-createdAt" or "name")
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';

    const { count: total, rows: students } = await Student.findAndCountAll({
      where,
      include: [{
        model: FeeStructure,
        as: 'feeStructure'
      }],
      order: [[sortField, sortOrder]],
      offset: (pageNum - 1) * limitNum,
      limit: limitNum,
    });

    res.json({
      data: students,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const id = req.params.id;

    const student = await Student.findByPk(id, {
      include: [{
        model: FeeStructure,
        as: 'feeStructure'
      }]
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // CRITICAL: Institute-based access control
    if (student.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - student belongs to a different institute" });
    }

    // Role-based access control
    if (req.user.role === 'student') {
      // Students can only view their own record
      if (student.email !== req.user.email) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user.role === 'parent') {
      // Parents can only view their children's records
      if (student.parent_email !== req.user.email) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    // Admin and accountant can view any student

    res.json(student);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Create new student
exports.createStudent = async (req, res) => {
  try {
    const payload = sanitizePayload(req.body);

    // CRITICAL: Add institute_id from authenticated user
    payload.institute_id = req.user.institute_id;

    // basic required checks (adjust according to your model rules)
    const required = [
      "serial_number",
      "name",
      "email",
      "phone",
      "parent_name",
      "parent_phone",
      "parent_email",
      "course",
      "admission_date",
    ];

    for (const f of required) {
      if (!payload[f]) {
        return res.status(400).json({ message: `${f} is required` });
      }
    }

    // CRITICAL: check unique serial_number / email within the same institute
    const existing = await Student.findOne({
      where: {
        institute_id: req.user.institute_id,
        [Op.or]: [
          { serial_number: payload.serial_number },
          { email: payload.email }
        ],
      },
    });

    if (existing) {
      if (existing.serial_number === payload.serial_number) {
        return res
          .status(409)
          .json({ message: "serial_number already exists in your institute" });
      }
      if (existing.email === payload.email) {
        return res.status(409).json({ message: "email already exists" });
      }
    }

    const student = await Student.create(payload);

    return res.status(201).json(student);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Update student
exports.updateStudent = async (req, res) => {
  try {
    const id = req.params.id;

    // CRITICAL: First check if student belongs to user's institute
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - student belongs to a different institute" });
    }

    const payload = sanitizePayload(req.body);

    // Prevent changing institute_id
    delete payload.institute_id;

    // Prevent setting invalid status if you have enum
    if (payload.status) {
      const validStatuses = ['active', 'inactive', 'graduated'];
      if (!validStatuses.includes(payload.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
    }

    // CRITICAL: If email or serial_number is being updated, ensure uniqueness within institute
    if (payload.email || payload.serial_number) {
      const orConditions = [];
      if (payload.email) orConditions.push({ email: payload.email });
      if (payload.serial_number) orConditions.push({ serial_number: payload.serial_number });

      const conflict = await Student.findOne({
        where: {
          institute_id: req.user.institute_id,
          id: { [Op.ne]: id },
          [Op.or]: orConditions,
        },
      });

      if (conflict) {
        if (conflict.serial_number === payload.serial_number) {
          return res
            .status(409)
            .json({ message: "serial_number already exists in your institute" });
        }
        if (conflict.email === payload.email) {
          return res.status(409).json({ message: "email already exists in your institute" });
        }
      }
    }

    const [updatedCount] = await Student.update(payload, {
      where: { id, institute_id: req.user.institute_id }, // Double-check institute_id
    });

    if (updatedCount === 0) {
      return res.status(404).json({ message: "Student not found or access denied" });
    }

    const updatedStudent = await Student.findByPk(id);

    return res.json(updatedStudent);
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};

// @desc    Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;

    // CRITICAL: Check if student belongs to user's institute before deleting
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.institute_id !== req.user.institute_id) {
      return res.status(403).json({ message: "Access denied - student belongs to a different institute" });
    }

    await Student.destroy({ where: { id, institute_id: req.user.institute_id } });

    return res.json({
      message: "Student deleted successfully",
      id: id,
    });
  } catch (error) {
    return handleSequelizeError(res, error);
  }
};
