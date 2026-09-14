import api from './api';
import { AxiosResponse } from 'axios';

export interface Staff {
  id: number;
  full_name: string;
  email?: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  created_at?: string;
  updated_at?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface StaffListResponse {
  success: boolean;
  data: {
    items: Staff[];
    pagination: Pagination;
  };
}

export interface StaffResponse {
  success: boolean;
  message?: string;
  data: Staff;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

const staffService = {
  getStaff: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<StaffListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (status && status !== 'ALL') params.status = status;

    const response: AxiosResponse<StaffListResponse> = await api.get('/admin/staff', { params });
    return response.data;
  },

  getStaffById: async (id: number): Promise<StaffResponse> => {
    const response: AxiosResponse<StaffResponse> = await api.get(`/admin/staff/${id}`);
    return response.data;
  },

  createStaff: async (data: any): Promise<StaffResponse> => {
    const response: AxiosResponse<StaffResponse> = await api.post('/admin/staff', data);
    return response.data;
  },

  updateStaff: async (id: number, data: any): Promise<StaffResponse> => {
    const response: AxiosResponse<StaffResponse> = await api.put(`/admin/staff/${id}`, data);
    return response.data;
  },

  updateStaffStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<GenericResponse> => {
    const response: AxiosResponse<GenericResponse> = await api.patch(`/admin/staff/${id}/status`, { status });
    return response.data;
  },

  deleteStaff: async (id: number): Promise<GenericResponse> => {
    const response: AxiosResponse<GenericResponse> = await api.delete(`/admin/staff/${id}`);
    return response.data;
  }
};

export default staffService;
