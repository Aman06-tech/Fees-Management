import api from '../api';

export interface DashboardStats {
  totalCollection: number;
  totalStudents: number;
  pendingPayments: number;
  thisMonth: number;
}

export interface CollectionReport {
  total_collected: number;
  total_students: number;
  payment_mode_breakdown: {
    [key: string]: number;
  };
  date_range: {
    start: string;
    end: string;
  };
}

export interface OutstandingDue {
  id: number;
  student_id: number;
  fee_structure_id: number;
  amount: number;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  due_date: string;
  status: string;
  payment_period: string;
  Student: {
    serial_number: string;
    name: string;
    email: string;
    phone: string;
  };
  FeeStructure: {
    name: string;
    course: string;
    frequency: string;
  };
}

export interface Defaulter {
  id: number;
  student: string;
  serialNumber: string;
  amount: number;
  dueDate: string;
  days: number;
}

export const reportService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/reports/dashboard-stats');
    return response.data;
  },

  async getCollectionReport(startDate?: string, endDate?: string): Promise<CollectionReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/reports/collection?${params.toString()}`);
    return response.data;
  },

  async getOutstandingDues(): Promise<OutstandingDue[]> {
    const response = await api.get('/reports/outstanding');
    return response.data;
  },

  async getDefaulters(limit?: number): Promise<Defaulter[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get(`/reports/defaulters${params}`);
    return response.data;
  }
};
