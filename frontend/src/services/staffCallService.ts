import api from './api';

import { PaginatedResponse } from '../types';

export interface StaffCall {
  id: number;
  table_id: number;
  reason: string;
  status: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export const staffCallService = {
  createCall: async (table_id: number, reason: string = 'CALL_STAFF', note?: string) => {
    const response = await api.post('/staff-calls/', { table_id, reason, note });
    return response.data;
  },

  getCalls: async (page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<StaffCall>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    
    const response = await api.get('/staff-calls/', { params });
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/staff-calls/${id}/status`, { status });
    return response.data;
  }
};
