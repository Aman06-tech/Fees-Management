# Backend Migration: Go → Node.js/Express/MongoDB

## ✅ Migration Complete!

The backend has been successfully converted from **Go/PostgreSQL** to **Node.js/Express/MongoDB**.

---

## 🎯 What Changed

### Technology Stack
| Before | After |
|--------|-------|
| Go (Golang) | Node.js |
| Gin Framework | Express.js |
| PostgreSQL | MongoDB |
| GORM | Mongoose |

---

## 📁 New Backend Structure

```
backend-node/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User schema with bcrypt
│   ├── Student.js           # Student schema
│   ├── Class.js             # Class schema
│   ├── FeeType.js           # Fee type schema
│   ├── FeeStructure.js      # Fee structure schema
│   ├── Payment.js           # Payment schema with auto receipt generation
│   └── Discount.js          # Discount schema
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── studentController.js # Student CRUD operations
│   ├── feeStructureController.js
│   ├── paymentController.js
│   └── reportController.js  # Reports & analytics
├── middleware/
│   └── auth.js              # JWT authentication & authorization
├── routes/
│   ├── auth.js              # Auth routes
│   ├── students.js          # Student routes
│   ├── feeStructures.js     # Fee structure routes
│   ├── payments.js          # Payment routes
│   └── reports.js           # Report routes
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js               # Main application entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running

### Installation

1. **Navigate to backend directory:**
```bash
cd backend-node
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment (.env file already created):**
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/fees_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. **Start MongoDB:**
```bash
# On Windows with MongoDB installed
mongod

# Or if MongoDB is a service
net start MongoDB
```

5. **Start the server:**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Students (Protected)
- `GET /api/students` - Get all students
- `POST /api/students` - Create student (Admin/Accountant only)
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student (Admin/Accountant only)
- `DELETE /api/students/:id` - Delete student (Admin only)

### Fee Structures (Protected)
- `GET /api/fee-structures` - Get all fee structures
- `POST /api/fee-structures` - Create fee structure (Admin only)
- `PUT /api/fee-structures/:id` - Update fee structure (Admin only)
- `DELETE /api/fee-structures/:id` - Delete fee structure (Admin only)

### Payments (Protected)
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment (Admin/Accountant only)
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment (Admin/Accountant only)
- `GET /api/payments/student/:studentId` - Get student payments

### Reports (Protected - Admin/Accountant)
- `GET /api/reports/collection?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Collection report
- `GET /api/reports/outstanding` - Outstanding dues
- `GET /api/reports/defaulters` - Defaulters list (>30 days overdue)

### Health Check
- `GET /health` - Server health status

---

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles & Permissions
| Role | Permissions |
|------|-------------|
| `admin` | Full access to all endpoints |
| `accountant` | Manage students, fees, payments, and view reports |
| `student` | View own information |
| `parent` | View child's information |

---

## 📊 Key Features

### 1. **MongoDB Schemas**
- All data models use Mongoose schemas with validation
- Automatic timestamps (createdAt, updatedAt)
- References between collections (populate support)

### 2. **Authentication & Security**
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens for stateless authentication
- Role-based access control (RBAC)

### 3. **Payment System**
- Auto-generates unique receipt numbers (RCP000001, RCP000002, etc.)
- Supports multiple payment modes (cash, card, online, cheque, UPI)
- Tracks late fees and discounts
- Payment status management

### 4. **Reporting**
- Collection reports with date range filtering
- Payment mode breakdown analytics
- Outstanding dues tracking
- Defaulters identification (>30 days overdue)

---

## 🧪 Testing the API

### 1. Register a User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123"
  }'
```

### 3. Get Students (with auth token)
```bash
curl http://localhost:8080/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔄 Frontend Integration

The frontend at `http://localhost:3006` is already configured to work with this backend at `http://localhost:8080`.

**No changes needed to the frontend!** The API endpoints remain the same as before.

---

## 📝 Data Migration (Optional)

If you have existing data in PostgreSQL that needs to be migrated to MongoDB:

1. Export data from PostgreSQL
2. Transform to MongoDB format
3. Use `mongoimport` or write migration scripts
4. Use Mongoose models to ensure data integrity

---

## ✨ Benefits of This Migration

1. **Flexible Schema** - MongoDB's document model is perfect for evolving requirements
2. **JSON Native** - Perfect match with JavaScript/Node.js ecosystem
3. **Scalability** - Easier horizontal scaling with MongoDB
4. **Simpler Queries** - No complex joins, uses populate() for references
5. **Faster Development** - JavaScript across full stack
6. **Rich Ecosystem** - NPM packages for everything

---

## 🐛 Troubleshooting

### Server won't start
- Ensure MongoDB is running (`mongod` or check Windows Services)
- Check if port 8080 is available
- Verify `.env` file exists and has correct values

### Database connection errors
```bash
# Start MongoDB
mongod

# Or on Windows
net start MongoDB
```

### Authentication errors
- Make sure JWT_SECRET is set in `.env`
- Check token format: `Bearer <token>`
- Verify user role has permission for the endpoint

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [JWT Documentation](https://jwt.io/)

---

## 🎉 Status

**✅ Backend Migration Complete**
- ✅ All models converted to Mongoose schemas
- ✅ All routes implemented
- ✅ Authentication working
- ✅ Authorization middleware in place
- ✅ MongoDB connected
- ✅ Server running on port 8080
- ✅ Frontend compatible (no changes needed)

**Server URL:** http://localhost:8080
**Health Check:** http://localhost:8080/health
