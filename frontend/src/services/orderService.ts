import api from './api';
import { Order, OrderCreate, OrderListResponse, OrderStatusUpdate } from '../types/order.types';

export const orderService = {
  createOrder: async (data: OrderCreate): Promise<Order> => {
    const response = await api.post('/orders/', data);
    return response.data;
  },

  getOrders: async (
    page: number = 1,
    size: number = 10,
    status?: string,
    orderCode?: string,
    tableId?: number
  ): Promise<OrderListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());

    if (status) params.append('status', status);
    if (orderCode) params.append('order_code', orderCode);
    if (tableId) params.append('table_id', tableId.toString());

    const response = await api.get(`/orders/?${params.toString()}`);
    return response.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: number, data: OrderStatusUpdate): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data;
  },
};
