import api from './api';
import { Payment, PaymentConfirmRequest, PaymentListResponse } from '../types/payment.types';

export const paymentService = {
  getPayments: async (params?: any) => {
    const response = await api.get('/staff/payments', { params });
    return response.data; // PaymentListResponse
  },

  getPaymentById: async (id: number) => {
    const response = await api.get(`/staff/payments/${id}`);
    return response.data; // Payment
  },

  getPaymentByOrderId: async (orderId: number) => {
    const response = await api.get(`/staff/orders/${orderId}/payment`);
    return response.data; // Payment
  },

  confirmPayment: async (id: number, data: PaymentConfirmRequest) => {
    const response = await api.post(`/staff/payments/${id}/confirm`, data);
    return response.data; // Payment
  }
};
