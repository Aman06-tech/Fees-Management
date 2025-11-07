'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { feeStructuresService } from '@/lib/services/feeStructures';

interface FeeStructure {
  id?: string;
  course: string;
  name: string;
  amount: string;
  frequency: 'monthly' | 'alternate_months' | 'quarterly' | 'annually' | 'one_time';
  due_date: string;
  description?: string;
  monthly_amount?: string;
  alternate_months_amount?: string;
  quarterly_amount?: string;
  yearly_amount?: string;
  discount_percentage?: string;
  discount_amount?: string;
  total_amount?: string;
  final_amount?: string;
  createdAt?: string;
  updatedAt?: string;
}

const COURSES = ['IPMAT', 'GMAT', 'CAT', 'GRE', 'SAT', 'IELTS', 'TOEFL'];
const FREQUENCIES = [
  { value: 'one_time', label: 'One Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'alternate_months', label: 'Alternate Months (Bi-Monthly)' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
];

export default function FeeStructuresPage() {
  const { user } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FeeStructure>({
    course: 'IPMAT',
    name: '',
    amount: '',
    frequency: 'one_time',
    due_date: new Date().toISOString().split('T')[0],
    description: '',
    monthly_amount: '0',
    alternate_months_amount: '0',
    quarterly_amount: '0',
    yearly_amount: '0',
    discount_percentage: '0',
    total_amount: '0'
  });

  useEffect(() => {
    // Only fetch if user is authenticated
    if (user) {
      fetchFeeStructures();
    }
  }, [user]);

  const fetchFeeStructures = async (course?: string) => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      const url = course
        ? `http://localhost:8080/api/fee-structures?course=${course}`
        : 'http://localhost:8080/api/fee-structures';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFeeStructures(data);
      } else {
        console.error('Failed to fetch fee structures:', response.status);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Authentication required. Please login again.');
      return;
    }

    const url = editingId
      ? `http://localhost:8080/api/fee-structures/${editingId}`
      : 'http://localhost:8080/api/fee-structures';

    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchFeeStructures(selectedCourse);
        setShowForm(false);
        setEditingId(null);
        setFormData({
          course: 'IPMAT',
          name: '',
          amount: '',
          frequency: 'one_time',
          due_date: new Date().toISOString().split('T')[0],
          description: '',
          monthly_amount: '0',
          alternate_months_amount: '0',
          quarterly_amount: '0',
          yearly_amount: '0',
          discount_percentage: '0',
          total_amount: '0'
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save fee structure');
      }
    } catch (error) {
      console.error('Error saving fee structure:', error);
      alert('Failed to save fee structure');
    }
  };

  const handleEditClick = (feeStructure: FeeStructure) => {
    setEditingFeeStructure(feeStructure);
    setFormData({
      course: feeStructure.course,
      name: feeStructure.name,
      amount: feeStructure.amount,
      frequency: feeStructure.frequency,
      due_date: feeStructure.due_date.split('T')[0],
      description: feeStructure.description || '',
      monthly_amount: feeStructure.monthly_amount || '0',
      alternate_months_amount: feeStructure.alternate_months_amount || '0',
      quarterly_amount: feeStructure.quarterly_amount || '0',
      yearly_amount: feeStructure.yearly_amount || '0',
      discount_percentage: feeStructure.discount_percentage || '0',
      total_amount: feeStructure.total_amount || '0'
    });
    setShowEditModal(true);
  };

  const handleUpdateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeeStructure) return;

    setLoading(true);
    setError(null);

    try {
      await feeStructuresService.updateFeeStructure(editingFeeStructure.id!, formData);
      await fetchFeeStructures(selectedCourse || undefined);

      setShowEditModal(false);
      setEditingFeeStructure(null);
      setSuccessMessage('Fee structure updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setFormData({
        course: 'IPMAT',
        name: '',
        amount: '',
        frequency: 'one_time',
        due_date: new Date().toISOString().split('T')[0],
        description: '',
        monthly_amount: '0',
        alternate_months_amount: '0',
        quarterly_amount: '0',
        yearly_amount: '0',
        discount_percentage: '0',
        total_amount: '0'
      });
    } catch (err: any) {
      console.error('Error updating fee structure:', err);
      setError(err.message || 'Failed to update fee structure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Authentication required. Please login again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/fee-structures/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchFeeStructures(selectedCourse);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete fee structure');
      }
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      alert('Failed to delete fee structure');
    }
  };

  const resetForm = () => {
    setFormData({
      course: 'IPMAT',
      name: '',
      amount: '',
      frequency: 'one_time',
      due_date: new Date().toISOString().split('T')[0],
      description: '',
      monthly_amount: '0',
      alternate_months_amount: '0',
      quarterly_amount: '0',
      yearly_amount: '0',
      discount_percentage: '0',
      total_amount: '0'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredFeeStructures = selectedCourse
    ? feeStructures.filter(fs => fs.course === selectedCourse)
    : feeStructures;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Fee Structures Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Fee Structure'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between mb-6">
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
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between mb-6">
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

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-black">
            {editingId ? 'Edit Fee Structure' : 'Add New Fee Structure'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Course *
              </label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              >
                {COURSES.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Fee Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="e.g., Tuition Fee, Transport Fee"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter amount"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Payment Breakdown Section */}
            <div className="md:col-span-2">
              <h3 className="text-md font-semibold text-black mb-3 mt-4 border-b pb-2">Payment Breakdown (Optional)</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Monthly Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monthly_amount}
                onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Amount if paid monthly"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Alternate Months Amount (Bi-Monthly)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.alternate_months_amount}
                onChange={(e) => setFormData({ ...formData, alternate_months_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Amount if paid every alternate month"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quarterly Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quarterly_amount}
                onChange={(e) => setFormData({ ...formData, quarterly_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Amount if paid quarterly"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Yearly Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.yearly_amount}
                onChange={(e) => setFormData({ ...formData, yearly_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Amount if paid annually"
              />
            </div>

            {/* Discount Section */}
            <div className="md:col-span-2">
              <h3 className="text-md font-semibold text-black mb-3 mt-4 border-b pb-2">Discount & Total</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Total amount before discount"
              />
              <p className="text-xs text-gray-500 mt-1">Leave as 0 to use the base amount above</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Discount percentage (0-100)"
              />
              <p className="text-xs text-gray-500 mt-1">Enter percentage (e.g., 10 for 10%)</p>
            </div>

            {/* Real-time Discount Calculation Display */}
            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Amount Calculation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Amount (before discount)</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(() => {
                      const total = parseFloat(formData.total_amount || '0') || parseFloat(formData.amount || '0') || 0;
                      return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Discount Amount ({formData.discount_percentage || '0'}%)</p>
                  <p className="text-lg font-bold text-red-600">
                    - ₹{(() => {
                      const total = parseFloat(formData.total_amount || '0') || parseFloat(formData.amount || '0') || 0;
                      const discountPercentage = parseFloat(formData.discount_percentage || '0') || 0;
                      const discountAmount = (total * discountPercentage) / 100;
                      return discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Final Amount (after discount)</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{(() => {
                      const total = parseFloat(formData.total_amount || '0') || parseFloat(formData.amount || '0') || 0;
                      const discountPercentage = parseFloat(formData.discount_percentage || '0') || 0;
                      const discountAmount = (total * discountPercentage) / 100;
                      const finalAmount = total - discountAmount;
                      return finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'} Fee Structure
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-2">
          Filter by Course
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            fetchFeeStructures(e.target.value || undefined);
          }}
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        >
          <option value="">All Courses</option>
          {COURSES.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Fee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFeeStructures.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  No fee structures found. Create one to get started.
                </td>
              </tr>
            ) : (
              filteredFeeStructures.map((feeStructure) => (
                <tr key={feeStructure.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                    {feeStructure.course}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {feeStructure.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    ₹{parseFloat(feeStructure.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {FREQUENCIES.find(f => f.value === feeStructure.frequency)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {new Date(feeStructure.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(feeStructure)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(feeStructure.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Fee Structure Modal */}
      {showEditModal && editingFeeStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Fee Structure</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingFeeStructure(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateFeeStructure} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  >
                    {COURSES.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Fee Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="e.g., Tuition Fee, Transport Fee"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Frequency *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  >
                    {FREQUENCIES.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>

                {/* Payment Breakdown Section */}
                <div className="md:col-span-2">
                  <h3 className="text-md font-semibold text-black mb-3 mt-4 border-b pb-2">Payment Breakdown (Optional)</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Monthly Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_amount}
                    onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Amount if paid monthly"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Alternate Months Amount (Bi-Monthly)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.alternate_months_amount}
                    onChange={(e) => setFormData({ ...formData, alternate_months_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Amount if paid every alternate month"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Quarterly Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quarterly_amount}
                    onChange={(e) => setFormData({ ...formData, quarterly_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Amount if paid quarterly"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Yearly Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.yearly_amount}
                    onChange={(e) => setFormData({ ...formData, yearly_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Amount if paid annually"
                  />
                </div>

                {/* Discount Section */}
                <div className="md:col-span-2">
                  <h3 className="text-md font-semibold text-black mb-3 mt-4 border-b pb-2">Discount & Total</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Total amount before discount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave as 0 to use the base amount above</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Discount percentage (0-100)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter percentage (e.g., 10 for 10%)</p>
                </div>

                {/* Real-time Discount Calculation Display */}
                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">Amount Calculation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total Amount (before discount)</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{(() => {
                          const total = parseFloat(formData.total_amount || '0') || parseFloat(formData.amount || '0') || 0;
                          return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Discount Amount ({formData.discount_percentage || '0'}%)</p>
                      <p className="text-lg font-bold text-red-600">
                        - ₹{(() => {
                          const total = parseFloat(formData.total_amount || '0') || parseFloat(formData.amount || '0') || 0;
                          const discountPercentage = parseFloat(formData.discount_percentage || '0') || 0;
                          const discountAmount = (total * discountPercentage) / 100;
                          return discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Final Amount (after discount)</p>
                      <p className="text-xl font-bold text-green-600">
                        ₹{(() => {
                          const total = parseFloat(formData.total_amount || '0') || parseFloat(formData.amount || '0') || 0;
                          const discountPercentage = parseFloat(formData.discount_percentage || '0') || 0;
                          const discountAmount = (total * discountPercentage) / 100;
                          const finalAmount = total - discountAmount;
                          return finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex gap-2 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Fee Structure'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingFeeStructure(null);
                    }}
                    disabled={loading}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
