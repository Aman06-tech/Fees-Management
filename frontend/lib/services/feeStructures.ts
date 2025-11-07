import api from '../api';

export interface FeeStructure {
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

export const feeStructuresService = {
  // Get all fee structures with optional course filter
  getFeeStructures: async (course?: string): Promise<FeeStructure[]> => {
    const url = course ? `/fee-structures?course=${course}` : '/fee-structures';
    const response = await api.get(url);
    return response.data;
  },

  // Get single fee structure by ID
  getFeeStructureById: async (id: string): Promise<FeeStructure> => {
    const response = await api.get(`/fee-structures/${id}`);
    return response.data;
  },

  // Create new fee structure
  createFeeStructure: async (data: Omit<FeeStructure, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeeStructure> => {
    const response = await api.post('/fee-structures', data);
    return response.data;
  },

  // Update fee structure
  updateFeeStructure: async (id: string, data: Partial<FeeStructure>): Promise<FeeStructure> => {
    const response = await api.put(`/fee-structures/${id}`, data);
    return response.data;
  },

  // Delete fee structure
  deleteFeeStructure: async (id: string): Promise<void> => {
    await api.delete(`/fee-structures/${id}`);
  },
};
