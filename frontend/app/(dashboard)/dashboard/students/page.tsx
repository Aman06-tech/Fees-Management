'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { studentService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

// Student Management Component with Fee Structure Support
interface FeeType {
  id: string;
  name: string;
}

interface FeeStructure {
  id: string;
  course: string;
  fee_type_id: string;
  amount: string;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  due_date: string;
  description?: string;
  feeType?: FeeType;
}

interface FeeDue {
  id: string;
  status: 'pending' | 'due' | 'overdue' | 'paid' | 'partially_paid';
  amount: string;
  amount_remaining: string;
  due_date: string;
}

interface Student {
  id: string;
  serial_number: string;
  name: string;
  email: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  course: string;
  fee_structure_id?: string;
  feeStructure?: FeeStructure;
  admission_date: string;
  status: string;
  feeDues?: FeeDue[];
}

const StudentStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated'
} as const;

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    serial_number: '',
    name: '',
    email: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    course: 'IPMAT',
    fee_structure_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch fee structures when course changes
  useEffect(() => {
    if (formData.course) {
      fetchFeeStructures(formData.course);
    }
  }, [formData.course]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await studentService.getStudents();
      const studentsData = response.data || [];

      // Fetch fee dues for each student
      const token = localStorage.getItem('auth_token');
      if (token) {
        const studentsWithFees = await Promise.all(
          studentsData.map(async (student: Student) => {
            try {
              const feeDuesResponse = await fetch(
                `http://localhost:8080/api/fee-dues/student/${student.id}`,
                {
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );
              if (feeDuesResponse.ok) {
                const feeDues = await feeDuesResponse.json();
                return { ...student, feeDues };
              }
            } catch (error) {
              console.error(`Error fetching fee dues for student ${student.id}:`, error);
            }
            return student;
          })
        );
        setStudents(studentsWithFees);
      } else {
        setStudents(studentsData);
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to fetch students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeeStructures = async (course: string) => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.error('No auth token found');
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
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await studentService.createStudent(formData);

      // Refresh the list
      await fetchStudents();

      setShowAddModal(false);

      // Reset form
      setFormData({
        serial_number: '',
        name: '',
        email: '',
        phone: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        course: 'IPMAT',
        fee_structure_id: '',
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    } catch (err: any) {
      console.error('Error creating student:', err);
      setError(err.message || 'Failed to create student. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    setIsLoading(true);
    setError(null);

    try {
      await studentService.deleteStudent(id);
      await fetchStudents();
      // Show success message (optional)
      alert('Student deleted successfully');
    } catch (err: any) {
      console.error('Error deleting student:', err);
      setError(err.message || 'Failed to delete student.');
      alert(`Failed to delete student: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (student: Student) => {
    setEditingStudent(student);
    setFormData({
      serial_number: student.serial_number,
      name: student.name,
      email: student.email,
      phone: student.phone,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email,
      course: student.course,
      fee_structure_id: student.fee_structure_id || '',
      admission_date: new Date(student.admission_date).toISOString().split('T')[0],
      status: student.status
    });

    // Fetch fee structures for the student's course
    await fetchFeeStructures(student.course);
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsLoading(true);
    setError(null);

    try {
      await studentService.updateStudent(editingStudent.id, formData);
      await fetchStudents();

      setShowEditModal(false);
      setEditingStudent(null);
      setSuccessMessage('Student updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset form
      setFormData({
        serial_number: '',
        name: '',
        email: '',
        phone: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        course: 'IPMAT',
        fee_structure_id: '',
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active'
      });
    } catch (err: any) {
      console.error('Error updating student:', err);
      setError(err.message || 'Failed to update student. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (student: Student) => {
    // Check if student has unpaid fees
    const unpaidFees = student.feeDues?.filter(
      f => f.status === 'overdue' || f.status === 'due' || f.status === 'pending' || f.status === 'partially_paid'
    ) || [];

    if (unpaidFees.length === 0) {
      setError('This student has no unpaid fees to send reminders for.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm(`Send fee reminder emails and SMS to ${student.name} and their parent for ${unpaidFees.length} unpaid fee(s)?`)) {
      return;
    }

    setSendingReminder(student.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Send reminders for all unpaid fees
      let successCount = 0;
      let errorCount = 0;

      for (const feeDue of unpaidFees) {
        try {
          const response = await fetch(
            `http://localhost:8080/api/fee-dues/${feeDue.id}/send-reminder`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Error sending reminder for fee due ${feeDue.id}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMessage(
          `Successfully sent ${successCount} reminder(s) to ${student.name} and their parent!`
        );
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      if (errorCount > 0) {
        setError(`Failed to send ${errorCount} reminder(s). Please check the console for details.`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      console.error('Error sending reminders:', err);
      setError(err.message || 'Failed to send reminders. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSendingReminder(null);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage student records and information</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
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
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {students.filter(s => s.status === StudentStatus.ACTIVE).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {students.filter(s => s.status === StudentStatus.INACTIVE).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Graduated</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {students.filter(s => s.status === StudentStatus.GRADUATED).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">All Students</h2>
            <div className="w-64">
              <Input
                type="text"
                placeholder="Search by name or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Structure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee Status
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
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No students found. Click "Add Student" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.serial_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.course}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.feeStructure ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.feeStructure.feeType?.name || '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                ₹{parseFloat(student.feeStructure.amount).toLocaleString('en-IN')} ({student.feeStructure.frequency})
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No fee structure</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.feeDues && student.feeDues.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const overdue = student.feeDues.filter(f => f.status === 'overdue').length;
                                const due = student.feeDues.filter(f => f.status === 'due').length;
                                const pending = student.feeDues.filter(f => f.status === 'pending').length;
                                const partiallyPaid = student.feeDues.filter(f => f.status === 'partially_paid').length;

                                return (
                                  <>
                                    {overdue > 0 && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        {overdue} Overdue
                                      </span>
                                    )}
                                    {due > 0 && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                        {due} Due
                                      </span>
                                    )}
                                    {partiallyPaid > 0 && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        {partiallyPaid} Partial
                                      </span>
                                    )}
                                    {pending > 0 && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {pending} Pending
                                      </span>
                                    )}
                                    {overdue === 0 && due === 0 && pending === 0 && partiallyPaid === 0 && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        All Paid
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">No fees</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${student.status === StudentStatus.ACTIVE ? 'bg-green-100 text-green-800' : ''}
                            ${student.status === StudentStatus.INACTIVE ? 'bg-orange-100 text-orange-800' : ''}
                            ${student.status === StudentStatus.GRADUATED ? 'bg-purple-100 text-purple-800' : ''}
                          `}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewStudent(student)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(student)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </Button>
                            </div>
                            {student.feeDues && student.feeDues.some(
                              f => f.status === 'overdue' || f.status === 'due' || f.status === 'pending' || f.status === 'partially_paid'
                            ) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendReminder(student)}
                                disabled={sendingReminder === student.id}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
                              >
                                {sendingReminder === student.id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send Reminder
                                  </>
                                )}
                              </Button>
                            )}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6">
              <div className="space-y-6">
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Serial Number *
                      </label>
                      <Input
                        type="text"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        placeholder="e.g., STU002"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter student name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="1234567890"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course *
                      </label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value, fee_structure_id: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="IPMAT">IPMAT</option>
                        <option value="GMAT">GMAT</option>
                        <option value="CAT">CAT</option>
                        <option value="GRE">GRE</option>
                        <option value="SAT">SAT</option>
                        <option value="IELTS">IELTS</option>
                        <option value="TOEFL">TOEFL</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Select the course the student is enrolled in</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Structure (Optional)
                      </label>
                      <select
                        value={formData.fee_structure_id}
                        onChange={(e) => setFormData({ ...formData, fee_structure_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No Fee Structure</option>
                        {feeStructures.map((feeStructure) => (
                          <option key={feeStructure.id} value={feeStructure.id}>
                            {feeStructure.feeType?.name || 'Unknown'} - ₹{parseFloat(feeStructure.amount).toLocaleString('en-IN')} ({feeStructure.frequency})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {feeStructures.length === 0
                          ? 'No fee structures available for this course. Create one in Fee Structures page.'
                          : 'Select a fee structure to assign to this student'
                        }
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.admission_date}
                        onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent/Guardian Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        placeholder="Enter parent name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Phone *
                      </label>
                      <Input
                        type="tel"
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        placeholder="0987654321"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        placeholder="parent@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Add Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStudent(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6">
              <div className="space-y-6">
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Serial Number *
                      </label>
                      <Input
                        type="text"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        placeholder="e.g., STU002"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter student name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="1234567890"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course *
                      </label>
                      <select
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value, fee_structure_id: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="IPMAT">IPMAT</option>
                        <option value="GMAT">GMAT</option>
                        <option value="CAT">CAT</option>
                        <option value="GRE">GRE</option>
                        <option value="SAT">SAT</option>
                        <option value="IELTS">IELTS</option>
                        <option value="TOEFL">TOEFL</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fee Structure (Optional)
                      </label>
                      <select
                        value={formData.fee_structure_id}
                        onChange={(e) => setFormData({ ...formData, fee_structure_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">No Fee Structure</option>
                        {feeStructures.map((feeStructure) => (
                          <option key={feeStructure.id} value={feeStructure.id}>
                            {feeStructure.feeType?.name || 'Unknown'} - ₹{parseFloat(feeStructure.amount).toLocaleString('en-IN')} ({feeStructure.frequency})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admission Date *
                      </label>
                      <Input
                        type="date"
                        value={formData.admission_date}
                        onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parent Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent/Guardian Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        placeholder="Enter parent name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Phone *
                      </label>
                      <Input
                        type="tel"
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        placeholder="0987654321"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.parent_email}
                        onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                        placeholder="parent@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Update Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedStudent(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Serial Number</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">{selectedStudent.serial_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-900 mt-1">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base text-gray-900 mt-1">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Course</p>
                    <p className="text-base font-semibold text-blue-600 mt-1">{selectedStudent.course}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`inline-flex mt-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full
                      ${selectedStudent.status === StudentStatus.ACTIVE ? 'bg-green-100 text-green-800' : ''}
                      ${selectedStudent.status === StudentStatus.INACTIVE ? 'bg-orange-100 text-orange-800' : ''}
                      ${selectedStudent.status === StudentStatus.GRADUATED ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                      {selectedStudent.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Admission Date</p>
                    <p className="text-base text-gray-900 mt-1">
                      {new Date(selectedStudent.admission_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Parent/Guardian Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Parent/Guardian Name</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">{selectedStudent.parent_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Parent Phone</p>
                    <p className="text-base text-gray-900 mt-1">{selectedStudent.parent_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Parent Email</p>
                    <p className="text-base text-gray-900 mt-1">{selectedStudent.parent_email}</p>
                  </div>
                </div>
              </div>

              {/* Fee Structure Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Fee Structure
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedStudent.feeStructure ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Fee Type</p>
                        <p className="text-base font-semibold text-gray-900 mt-1">
                          {selectedStudent.feeStructure.feeType?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Amount</p>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          ₹{parseFloat(selectedStudent.feeStructure.amount).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Frequency</p>
                        <span className="inline-flex mt-1 px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {selectedStudent.feeStructure.frequency.charAt(0).toUpperCase() + selectedStudent.feeStructure.frequency.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                        <p className="text-base text-gray-900 mt-1">
                          {new Date(selectedStudent.feeStructure.due_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      {selectedStudent.feeStructure.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Description</p>
                          <p className="text-base text-gray-900 mt-1">{selectedStudent.feeStructure.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No fee structure assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedStudent(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
