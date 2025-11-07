'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FeeType {
  id?: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function FeeTypesPage() {
  const { user } = useAuth();
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeeType>({
    name: '',
    description: '',
    is_recurring: true
  });

  useEffect(() => {
    if (user) {
      fetchFeeTypes();
    }
  }, [user]);

  const fetchFeeTypes = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/fee-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFeeTypes(data);
      }
    } catch (error) {
      console.error('Error fetching fee types:', error);
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
      ? `http://localhost:8080/api/fee-types/${editingId}`
      : 'http://localhost:8080/api/fee-types';

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
        fetchFeeTypes();
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', description: '', is_recurring: true });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save fee type');
      }
    } catch (error) {
      console.error('Error saving fee type:', error);
      alert('Failed to save fee type');
    }
  };

  const handleEdit = (feeType: FeeType) => {
    setFormData({
      name: feeType.name,
      description: feeType.description || '',
      is_recurring: feeType.is_recurring
    });
    setEditingId(feeType.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee type?')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Authentication required. Please login again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/fee-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchFeeTypes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete fee type');
      }
    } catch (error) {
      console.error('Error deleting fee type:', error);
      alert('Failed to delete fee type');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', is_recurring: true });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fee Types Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Fee Type'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Fee Type' : 'Add New Fee Type'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Tuition Fee, Transport Fee, Library Fee"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Brief description of this fee type"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
                Recurring Fee
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'} Fee Type
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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feeTypes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No fee types found. Create one to get started.
                </td>
              </tr>
            ) : (
              feeTypes.map((feeType) => (
                <tr key={feeType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {feeType.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {feeType.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      feeType.is_recurring
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {feeType.is_recurring ? 'Recurring' : 'One-time'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(feeType)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(feeType.id!)}
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
    </div>
  );
}
