import api from './api';
import { Order, OrderCreate, OrderStatusUpdate } from '../types/order.types';
import { PaginatedResponse } from '../types';

export const orderService = {
  createOrder: async (data: OrderCreate): Promise<Order> => {
    const response = await api.post('/staff/orders', data);
    return response.data;
  },

  getOrders: async (
    page: number = 1,
    limit: number = 10,
    status?: string,
    orderCode?: string,
    tableSessionId?: number
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (status) params.append('status', status);
    if (orderCode) params.append('order_code', orderCode);
    if (tableSessionId) params.append('table_session_id', tableSessionId.toString());

    const response = await api.get(`/staff/orders?${params.toString()}`);
    return response.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await api.get(`/staff/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: number, data: OrderStatusUpdate): Promise<Order> => {
    const response = await api.patch(`/staff/orders/${id}/status`, data);
    return response.data;
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const response = await api.post(`/staff/orders/${id}/cancel`);
    return response.data;
  },
};
