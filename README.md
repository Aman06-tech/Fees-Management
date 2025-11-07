# Fees Management System

A comprehensive full-stack fees management system built with Next.js (frontend) and Golang (backend) for educational institutions.

## Project Structure

```
FeesManagement/
├── frontend/                  # Next.js frontend application
│   ├── app/                  # Next.js 14 App Router
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/     # Protected dashboard pages
│   │   │   ├── students/
│   │   │   ├── fees/
│   │   │   ├── payments/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/          # Reusable React components
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   ├── lib/                 # Utility libraries
│   │   ├── api.ts          # Axios API client
│   │   └── utils.ts        # Helper functions
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── package.json
│
└── backend/                 # Golang backend API
    ├── cmd/
    │   └── api/
    │       └── main.go      # Application entry point
    ├── internal/
    │   ├── models/          # Database models
    │   │   ├── student.go   # Uses serial_number field
    │   │   ├── user.go
    │   │   ├── class.go
    │   │   ├── fee.go
    │   │   ├── payment.go
    │   │   └── discount.go
    │   ├── handlers/        # HTTP request handlers
    │   ├── services/        # Business logic layer
    │   ├── repository/      # Database operations
    │   ├── middleware/      # Middleware functions
    │   │   ├── auth.go
    │   │   └── cors.go
    │   └── utils/           # Utility functions
    │       ├── jwt.go
    │       └── password.go
    ├── pkg/
    │   ├── database/        # Database connection
    │   │   └── database.go
    │   └── config/          # Configuration management
    │       └── config.go
    ├── migrations/          # SQL migration files
    │   └── 001_create_tables.sql
    ├── .env
    └── go.mod
```

## Features

### Core Modules

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Admin, Accountant, Student, Parent)
   - Secure password hashing with bcrypt

2. **Student Management**
   - Student registration with **serial_number** (not enrollment number)
   - Student profile management
   - Class and section assignment
   - Bulk student import (planned)

3. **Fee Structure Management**
   - Multiple fee types (Tuition, Transport, Library, etc.)
   - Class-wise fee configuration
   - Recurring and one-time fees
   - Flexible fee frequencies (Monthly, Quarterly, Annually)

4. **Fee Collection**
   - Multiple payment modes (Cash, Card, Online, UPI, Cheque)
   - Partial payment support
   - Late fee calculation
   - Discount application
   - Automated receipt generation

5. **Financial Reports**
   - Collection reports (Daily/Monthly/Yearly)
   - Outstanding dues tracking
   - Defaulters list
   - Payment history
   - Revenue analytics

6. **Discounts & Scholarships**
   - Multiple discount types (Scholarship, Sibling, Merit, Financial Aid)
   - Percentage or fixed amount discounts
   - Time-bound discount validity

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns

### Backend
- **Language**: Golang
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Password Hashing**: Bcrypt
- **Environment**: godotenv

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Go 1.21+
- PostgreSQL 14+

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Run development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
go mod tidy
```

3. Configure environment:
```bash
# Update .env file with your PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=fees_management
SERVER_PORT=8080
JWT_SECRET=your-super-secret-key
```

4. Create database:
```sql
CREATE DATABASE fees_management;
```

5. Run the application:
```bash
go run cmd/api/main.go
```

Backend API will be available at `http://localhost:8080`

## Database Schema

### Key Tables

**students** - Uses `serial_number` as unique identifier (not enrollment_no)
```sql
- id (Primary Key)
- serial_number (Unique)
- name
- email
- phone
- parent_name, parent_phone, parent_email
- class_id (Foreign Key)
- section
- admission_date
- status (active/inactive/graduated)
```

**fee_structures**
```sql
- id
- class_id
- fee_type_id
- amount
- frequency
- due_date
```

**payments**
```sql
- id
- student_id
- fee_structure_id
- amount
- payment_mode
- transaction_id
- late_fee
- discount
- total_amount
- receipt_number
- status
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Students (Protected)
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Fee Structures (Protected)
- `GET /api/fee-structures` - List fee structures
- `POST /api/fee-structures` - Create fee structure

### Payments (Protected)
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/student/:studentId` - Student payment history

### Reports (Protected)
- `GET /api/reports/collection` - Collection report
- `GET /api/reports/outstanding` - Outstanding dues
- `GET /api/reports/defaulters` - Defaulters list

## Important Notes

1. **Serial Number vs Enrollment Number**
   - This system uses `serial_number` field for students instead of `enrollment_no`
   - Serial number is a unique identifier for each student
   - Ensure all student-related operations use `serial_number`

2. **Security**
   - Change the JWT_SECRET in production
   - Use strong database passwords
   - Enable HTTPS in production
   - Keep dependencies updated

3. **Database**
   - Run migrations before first use
   - Regular backups recommended
   - Use connection pooling in production

## Development Roadmap

### Phase 1 (Completed)
- ✅ Project structure setup
- ✅ Database schema design
- ✅ TypeScript types and Golang models
- ✅ Configuration files

### Phase 2 (Next Steps)
- ⬜ Implement authentication handlers
- ⬜ Complete CRUD operations for students
- ⬜ Build fee structure management
- ⬜ Create UI components

### Phase 3
- ⬜ Payment processing
- ⬜ Receipt generation (PDF)
- ⬜ Notification system

### Phase 4
- ⬜ Reports and analytics
- ⬜ Dashboard implementation
- ⬜ Data visualization

### Phase 5
- ⬜ Testing
- ⬜ Deployment
- ⬜ Documentation

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
