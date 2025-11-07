'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  serial_number: string;
  name: string;
  email: string;
  course?: string;
}

interface FeeStructure {
  id: string;
  course: string;
  name: string;
  amount: string;
  frequency: 'monthly' | 'alternate_months' | 'quarterly' | 'annually' | 'one_time';
  monthly_amount?: string;
  alternate_months_amount?: string;
  quarterly_amount?: string;
  yearly_amount?: string;
  discount_percentage?: string;
  discount_amount?: string;
  total_amount?: string;
  final_amount?: string;
}

interface Payment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  amount: string;
  payment_mode: 'cash' | 'card' | 'online' | 'cheque' | 'upi';
  transaction_id?: string;
  payment_date: string;
  payment_period?: string;
  late_fee: string;
  discount: string;
  total_amount: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receipt_number: string;
  remarks?: string;
  student?: Student;
  feeStructure?: FeeStructure;
  createdAt: string;
  updatedAt: string;
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'online', label: 'Net Banking', icon: '🏦' },
  { value: 'cheque', label: 'Cheque', icon: '📝' }
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const QUARTERS = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
const ALTERNATE_MONTHS = ['Jan-Feb', 'Mar-Apr', 'May-Jun', 'Jul-Aug', 'Sep-Oct', 'Nov-Dec'];

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    fee_structure_id: '',
    amount: '',
    payment_mode: 'cash' as const,
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_period: '',
    late_fee: '0',
    discount: '0',
    discount_percentage: '0',
    remarks: ''
  });

  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    if (user) {
      fetchPayments();
      fetchStudents();
      fetchFeeStructures();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.error('No auth token found');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8080/api/fee-structures', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFeeStructures(data);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    }
  };

  const calculateDiscountFromPercentage = (amount: string, percentage: string) => {
    const amountNum = parseFloat(amount) || 0;
    const percentNum = parseFloat(percentage) || 0;
    return ((amountNum * percentNum) / 100).toFixed(2);
  };

  const calculateDiscountPercentage = (amount: string, discount: string) => {
    const amountNum = parseFloat(amount) || 0;
    const discountNum = parseFloat(discount) || 0;
    if (amountNum === 0) return '0';
    return ((discountNum / amountNum) * 100).toFixed(2);
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const lateFee = parseFloat(formData.late_fee) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return amount + lateFee - discount;
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');

      const amount = parseFloat(formData.amount);
      const lateFee = parseFloat(formData.late_fee);
      const discount = parseFloat(formData.discount);
      const totalAmount = amount + lateFee - discount;

      const response = await fetch('http://localhost:8080/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount,
          late_fee: lateFee,
          discount,
          total_amount: totalAmount,
          status: 'completed'
        })
      });

      if (response.ok) {
        await fetchPayments();
        setShowRecordModal(false);
        resetForm();
        alert('Payment recorded successfully!');
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to record payment');
      }
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError('Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      fee_structure_id: '',
      amount: '',
      payment_mode: 'cash',
      transaction_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_period: '',
      late_fee: '0',
      discount: '0',
      discount_percentage: '0',
      remarks: ''
    });
    setSelectedFeeStructure(null);
  };

  const handleEditClick = (payment: Payment) => {
    setEditingPayment(payment);

    // Calculate discount percentage
    const amount = parseFloat(payment.amount);
    const discount = parseFloat(payment.discount);
    const discountPercentage = amount > 0 ? ((discount / amount) * 100).toFixed(2) : '0';

    setFormData({
      student_id: payment.student_id,
      fee_structure_id: payment.fee_structure_id,
      amount: payment.amount,
      payment_mode: payment.payment_mode,
      transaction_id: payment.transaction_id || '',
      payment_date: new Date(payment.payment_date).toISOString().split('T')[0],
      payment_period: payment.payment_period || '',
      late_fee: payment.late_fee,
      discount: payment.discount,
      discount_percentage: discountPercentage,
      remarks: payment.remarks || ''
    });

    // Set the selected fee structure
    const feeStructure = feeStructures.find(fs => fs.id === payment.fee_structure_id);
    setSelectedFeeStructure(feeStructure || null);

    setShowEditModal(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');

      const amount = parseFloat(formData.amount);
      const lateFee = parseFloat(formData.late_fee);
      const discount = parseFloat(formData.discount);
      const totalAmount = amount + lateFee - discount;

      const response = await fetch(`http://localhost:8080/api/payments/${editingPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount,
          late_fee: lateFee,
          discount,
          total_amount: totalAmount,
          status: 'completed'
        })
      });

      if (response.ok) {
        await fetchPayments();
        setShowEditModal(false);
        setEditingPayment(null);
        resetForm();
        setSuccessMessage('Payment updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to update payment');
      }
    } catch (err: any) {
      console.error('Error updating payment:', err);
      setError('Failed to update payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeeStructureChange = (feeStructureId: string) => {
    const feeStructure = feeStructures.find(fs => fs.id === feeStructureId);
    setSelectedFeeStructure(feeStructure || null);

    if (feeStructure) {
      let amount = parseFloat(feeStructure.amount);

      // Use frequency-specific amount if available
      if (feeStructure.frequency === 'monthly' && feeStructure.monthly_amount) {
        amount = parseFloat(feeStructure.monthly_amount);
      } else if (feeStructure.frequency === 'alternate_months' && feeStructure.alternate_months_amount) {
        amount = parseFloat(feeStructure.alternate_months_amount);
      } else if (feeStructure.frequency === 'quarterly' && feeStructure.quarterly_amount) {
        amount = parseFloat(feeStructure.quarterly_amount);
      } else if (feeStructure.frequency === 'annually' && feeStructure.yearly_amount) {
        amount = parseFloat(feeStructure.yearly_amount);
      }

      setFormData({
        ...formData,
        fee_structure_id: feeStructureId,
        amount: amount.toString(),
        payment_period: ''
      });
    }
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Payment Receipt</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
        printWindow.document.write('.receipt { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }');
        printWindow.document.write('.header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }');
        printWindow.document.write('.row { display: flex; justify-content: space-between; margin: 10px 0; }');
        printWindow.document.write('.label { font-weight: bold; }');
        printWindow.document.write('.total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(receiptRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.total_amount), 0);

  const todayCollected = payments
    .filter(p => p.status === 'completed' &&
      new Date(p.payment_date).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + parseFloat(p.total_amount), 0);

  const filteredPayments = payments.filter(payment =>
    payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPaymentPeriodSelector = () => {
    if (!selectedFeeStructure) return null;

    const frequency = selectedFeeStructure.frequency;

    if (frequency === 'one_time') {
      return null; // No period needed for one-time payments
    }

    if (frequency === 'monthly') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month *
          </label>
          <select
            value={formData.payment_period}
            onChange={(e) => setFormData({ ...formData, payment_period: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Select month</option>
            {MONTHS.map((month, index) => (
              <option key={index} value={`${month} ${currentYear}`}>
                {month} {currentYear}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (frequency === 'alternate_months') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Period *
          </label>
          <select
            value={formData.payment_period}
            onChange={(e) => setFormData({ ...formData, payment_period: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Select period</option>
            {ALTERNATE_MONTHS.map((period, index) => (
              <option key={index} value={`${period} ${currentYear}`}>
                {period} {currentYear}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (frequency === 'quarterly') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Quarter *
          </label>
          <select
            value={formData.payment_period}
            onChange={(e) => setFormData({ ...formData, payment_period: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Select quarter</option>
            {QUARTERS.map((quarter, index) => (
              <option key={index} value={`${quarter} ${currentYear}`}>
                {quarter} {currentYear}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (frequency === 'annually') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Year *
          </label>
          <select
            value={formData.payment_period}
            onChange={(e) => setFormData({ ...formData, payment_period: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Select year</option>
            {years.map((year) => (
              <option key={year} value={`${year}`}>
                {year}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage fee payments and transactions</p>
        </div>
        <Button onClick={() => setShowRecordModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Payment
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Collection</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ₹{todayCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <div className="w-64">
              <Input
                type="text"
                placeholder="Search by receipt, student, or transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Structure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No payments found. Click "Record Payment" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {payment.receipt_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{payment.student?.name || 'N/A'}</div>
                            <div className="text-gray-500">{payment.student?.serial_number}</div>
                            <div className="text-xs text-gray-400">{payment.student?.course}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{payment.feeStructure?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">₹{parseFloat(payment.feeStructure?.amount || '0').toLocaleString('en-IN')} - {payment.feeStructure?.frequency}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.payment_period || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-semibold text-green-600">₹{parseFloat(payment.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            {(parseFloat(payment.late_fee) > 0 || parseFloat(payment.discount) > 0) && (
                              <div className="text-xs text-gray-500">
                                {parseFloat(payment.late_fee) > 0 && <span className="text-red-600">+₹{payment.late_fee} late fee</span>}
                                {parseFloat(payment.discount) > 0 && <span className="text-green-600 ml-1">-₹{payment.discount} disc</span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {PAYMENT_MODES.find(m => m.value === payment.payment_mode)?.icon} {payment.payment_mode.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${payment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            ${payment.status === 'pending' ? 'bg-orange-100 text-orange-800' : ''}
                            ${payment.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                            ${payment.status === 'refunded' ? 'bg-purple-100 text-purple-800' : ''}
                          `}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(payment)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowReceiptModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              View Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
              <button
                onClick={() => {
                  setShowRecordModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6">
              <div className="space-y-6">
                {/* Student Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student *
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.serial_number} - {student.name} ({student.course})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fee Structure Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Structure *
                  </label>
                  <select
                    value={formData.fee_structure_id}
                    onChange={(e) => handleFeeStructureChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Select a fee structure</option>
                    {feeStructures.map(fs => (
                      <option key={fs.id} value={fs.id}>
                        {fs.course} - {fs.name} (₹{parseFloat(fs.amount).toLocaleString('en-IN')} - {fs.frequency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Period Selector */}
                {renderPaymentPeriodSelector()}

                {/* Amount Details with Discount Calculator */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Amount Breakdown</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          setFormData({
                            ...formData,
                            amount: newAmount,
                            discount: calculateDiscountFromPercentage(newAmount, formData.discount_percentage)
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.late_fee}
                        onChange={(e) => setFormData({ ...formData, late_fee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Discount Calculator */}
                  <div className="border-t border-gray-300 pt-4 mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Discount Calculator</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount_percentage}
                          onChange={(e) => {
                            const percentage = e.target.value;
                            setFormData({
                              ...formData,
                              discount_percentage: percentage,
                              discount: calculateDiscountFromPercentage(formData.amount, percentage)
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Amount (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) => {
                            const discount = e.target.value;
                            setFormData({
                              ...formData,
                              discount: discount,
                              discount_percentage: calculateDiscountPercentage(formData.amount, discount)
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Calculation Display */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Base + Late Fee</p>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(parseFloat(formData.amount || '0') + parseFloat(formData.late_fee || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Discount ({formData.discount_percentage}%)</p>
                        <p className="text-lg font-bold text-red-600">
                          - ₹{parseFloat(formData.discount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Payable</p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {PAYMENT_MODES.map(mode => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_mode: mode.value as any })}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          formData.payment_mode === mode.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{mode.icon}</div>
                        <div className="text-xs font-medium text-gray-900">{mode.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction ID (for non-cash payments) */}
                {formData.payment_mode !== 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Enter transaction or reference number"
                    />
                  </div>
                )}

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={3}
                    placeholder="Optional remarks or notes"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowRecordModal(false);
                    resetForm();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Record Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Payment</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPayment(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="p-6">
              <div className="space-y-6">
                {/* Student Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student *
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.serial_number} - {student.name} ({student.course})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fee Structure Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fee Structure *
                  </label>
                  <select
                    value={formData.fee_structure_id}
                    onChange={(e) => handleFeeStructureChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Select a fee structure</option>
                    {feeStructures.map(fs => (
                      <option key={fs.id} value={fs.id}>
                        {fs.course} - {fs.name} (₹{parseFloat(fs.amount).toLocaleString('en-IN')} - {fs.frequency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Period Selector */}
                {renderPaymentPeriodSelector()}

                {/* Amount Details with Discount Calculator */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Amount Breakdown</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          setFormData({
                            ...formData,
                            amount: newAmount,
                            discount: calculateDiscountFromPercentage(newAmount, formData.discount_percentage)
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Late Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.late_fee}
                        onChange={(e) => setFormData({ ...formData, late_fee: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Discount Calculator */}
                  <div className="border-t border-gray-300 pt-4 mb-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Discount Calculator</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Percentage (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount_percentage}
                          onChange={(e) => {
                            const percentage = e.target.value;
                            setFormData({
                              ...formData,
                              discount_percentage: percentage,
                              discount: calculateDiscountFromPercentage(formData.amount, percentage)
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount Amount (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) => {
                            const discount = e.target.value;
                            setFormData({
                              ...formData,
                              discount: discount,
                              discount_percentage: calculateDiscountPercentage(formData.amount, discount)
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Calculation Display */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Base + Late Fee</p>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(parseFloat(formData.amount || '0') + parseFloat(formData.late_fee || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Discount ({formData.discount_percentage}%)</p>
                        <p className="text-lg font-bold text-red-600">
                          - ₹{parseFloat(formData.discount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Payable</p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {PAYMENT_MODES.map(mode => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_mode: mode.value as any })}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          formData.payment_mode === mode.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{mode.icon}</div>
                        <div className="text-xs font-medium text-gray-900">{mode.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction ID (for non-cash payments) */}
                {formData.payment_mode !== 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      type="text"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="Enter transaction or reference number"
                    />
                  </div>
                )}

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={3}
                    placeholder="Optional remarks or notes"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPayment(null);
                    resetForm();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Update Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download / Print
                </button>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedPayment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div ref={receiptRef} className="p-8">
              <div className="receipt border-2 border-gray-300 rounded-lg p-6">
                {/* Header */}
                <div className="header text-center border-b-2 border-gray-300 pb-4 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">PAYMENT RECEIPT</h1>
                  <p className="text-sm text-gray-600 mt-2">Fees Management System</p>
                </div>

                {/* Receipt Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Receipt Number:</span>
                    <span className="text-gray-900">{selectedPayment.receipt_number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Payment Date:</span>
                    <span className="text-gray-900">{new Date(selectedPayment.payment_date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Student Name:</span>
                    <span className="text-gray-900">{selectedPayment.student?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Student ID:</span>
                    <span className="text-gray-900">{selectedPayment.student?.serial_number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Course:</span>
                    <span className="text-gray-900">{selectedPayment.student?.course}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Fee Type:</span>
                    <span className="text-gray-900">{selectedPayment.feeStructure?.name}</span>
                  </div>
                  {selectedPayment.payment_period && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Payment Period:</span>
                      <span className="text-gray-900">{selectedPayment.payment_period}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">Payment Mode:</span>
                    <span className="text-gray-900 uppercase">{selectedPayment.payment_mode}</span>
                  </div>
                  {selectedPayment.transaction_id && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">Transaction ID:</span>
                      <span className="text-gray-900">{selectedPayment.transaction_id}</span>
                    </div>
                  )}
                </div>

                {/* Amount Details */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700">Base Amount:</span>
                      <span className="text-gray-900">₹{parseFloat(selectedPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {parseFloat(selectedPayment.late_fee) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-700">Late Fee:</span>
                        <span className="text-red-600">+ ₹{parseFloat(selectedPayment.late_fee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {parseFloat(selectedPayment.discount) > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-700">Discount:</span>
                        <span className="text-green-600">- ₹{parseFloat(selectedPayment.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="total border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total Amount Paid:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{parseFloat(selectedPayment.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Remarks */}
                {selectedPayment.remarks && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Remarks:</p>
                    <p className="text-sm text-gray-900">{selectedPayment.remarks}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">This is a computer-generated receipt and does not require a signature.</p>
                  <p className="text-xs text-gray-500 mt-2">Generated on {new Date().toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
