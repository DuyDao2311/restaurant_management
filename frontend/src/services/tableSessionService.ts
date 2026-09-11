import api from './api';
import { TableSession } from '../types/table_session.types';

export const tableSessionService = {
  getActiveSessionByTable: async (tableId: number): Promise<TableSession> => {
    const response = await api.get(`/tables/${tableId}/session`);
    return response.data.data; // assuming the response format is { success: true, data: { ... } }
  },

  getOrdersBySession: async (sessionId: number): Promise<any> => {
    const response = await api.get(`/staff/table-sessions/${sessionId}/orders`);
    return response.data;
  },

  closeSession: async (sessionId: number): Promise<any> => {
    const response = await api.post(`/staff/table-sessions/${sessionId}/close`);
    return response.data;
  },
};
