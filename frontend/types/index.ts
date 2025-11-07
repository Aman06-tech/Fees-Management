// User and Authentication Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN = "admin",
  ACCOUNTANT = "accountant",
  STUDENT = "student",
  PARENT = "parent",
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Student Types (using serial_number instead of enrollment_no)
export interface Student {
  id: number;
  serial_number: string; // Unique serial number for student
  name: string;
  email: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  class_id: number;
  section: string;
  admission_date: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export enum StudentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  GRADUATED = "graduated",
}

export interface CreateStudentInput {
  serial_number: string;
  name: string;
  email: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  class_id: number;
  section: string;
  admission_date: string;
}

// Fee Structure Types
export interface FeeType {
  id: number;
  name: string;
  description: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeStructure {
  id: number;
  class_id: number;
  fee_type_id: number;
  amount: number;
  frequency: FeeFrequency;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export enum FeeFrequency {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually",
  ONE_TIME = "one_time",
}

// Payment Types
export interface Payment {
  id: number;
  student_id: number;
  fee_structure_id: number;
  amount: number;
  payment_mode: PaymentMode;
  transaction_id: string;
  payment_date: string;
  late_fee: number;
  discount: number;
  total_amount: number;
  status: PaymentStatus;
  receipt_number: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export enum PaymentMode {
  CASH = "cash",
  CARD = "card",
  ONLINE = "online",
  CHEQUE = "cheque",
  UPI = "upi",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface CreatePaymentInput {
  student_id: number;
  fee_structure_id: number;
  amount: number;
  payment_mode: PaymentMode;
  transaction_id?: string;
  late_fee?: number;
  discount?: number;
  remarks?: string;
}

// Class Types
export interface Class {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Discount Types
export interface Discount {
  id: number;
  student_id: number;
  discount_type: DiscountType;
  percentage: number;
  fixed_amount: number;
  description: string;
  start_date: string;
  end_date: string;
  status: DiscountStatus;
  created_at: string;
  updated_at: string;
}

export enum DiscountType {
  SCHOLARSHIP = "scholarship",
  SIBLING = "sibling",
  MERIT = "merit",
  FINANCIAL_AID = "financial_aid",
}

export enum DiscountStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

// Report Types
export interface CollectionReport {
  total_collected: number;
  total_pending: number;
  total_students: number;
  payment_mode_breakdown: Record<PaymentMode, number>;
  date_range: {
    start: string;
    end: string;
  };
}

export interface DefaulterReport {
  student_id: number;
  serial_number: string;
  student_name: string;
  class_name: string;
  total_due: number;
  last_payment_date: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
