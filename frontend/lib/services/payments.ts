import api from '../api';

export const paymentsService = {
  // Get all payments
  getPayments: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  // Get single payment by ID
  getPaymentById: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Create new payment
  createPayment: async (paymentData: any) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  // Update payment
  updatePayment: async (id: string, paymentData: any) => {
    const response = await api.put(`/payments/${id}`, paymentData);
    return response.data;
  },

  // Delete payment
  deletePayment: async (id: string) => {
    await api.delete(`/payments/${id}`);
  },
};
