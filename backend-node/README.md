# Fees Management Backend - Node.js/Express/MongoDB

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following:
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/fees_management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (Protected)

### Students
- GET `/api/students` - Get all students (Protected)
- POST `/api/students` - Create student (Admin/Accountant)
- GET `/api/students/:id` - Get student by ID (Protected)
- PUT `/api/students/:id` - Update student (Admin/Accountant)
- DELETE `/api/students/:id` - Delete student (Admin)

### Fee Structures
- GET `/api/fee-structures` - Get all fee structures (Protected)
- POST `/api/fee-structures` - Create fee structure (Admin)
- PUT `/api/fee-structures/:id` - Update fee structure (Admin)
- DELETE `/api/fee-structures/:id` - Delete fee structure (Admin)

### Payments
- GET `/api/payments` - Get all payments (Protected)
- POST `/api/payments` - Create payment (Admin/Accountant)
- GET `/api/payments/:id` - Get payment by ID (Protected)
- PUT `/api/payments/:id` - Update payment (Admin/Accountant)
- GET `/api/payments/student/:studentId` - Get student payments (Protected)

### Reports
- GET `/api/reports/collection` - Get collection report (Admin/Accountant)
- GET `/api/reports/outstanding` - Get outstanding dues (Admin/Accountant)
- GET `/api/reports/defaulters` - Get defaulters list (Admin/Accountant)

### Health Check
- GET `/health` - Server health check

## User Roles
- `admin` - Full access
- `accountant` - Can manage students, fees, and payments
- `student` - Limited access
- `parent` - Limited access
