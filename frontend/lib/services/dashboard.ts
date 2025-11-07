import api from '../api';

export interface DashboardStats {
  totalCollection: number;
  totalStudents: number;
  pendingPayments: number;
  thisMonth: number;
}

export interface RecentPayment {
  id: string;
  student: string;
  serialNumber: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

export interface Defaulter {
  id: string;
  student: string;
  serialNumber: string;
  amount: number;
  dueDate: string;
  days: number;
}

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/reports/dashboard-stats');
    return response.data;
  },

  // Get recent payments
  getRecentPayments: async (limit: number = 5): Promise<RecentPayment[]> => {
    const response = await api.get('/payments/recent', { params: { limit } });
    return response.data;
  },

  // Get defaulters list
  getDefaulters: async (limit: number = 10): Promise<Defaulter[]> => {
    const response = await api.get('/reports/defaulters', { params: { limit } });
    return response.data;
  },
};
