import api from './api';
import {
  CreateTableRequest,
  UpdateTableRequest,
  TableResponse,
  TableListResponse,
  TableQRManagementResponse,
  DeleteTableResponse,
  TablePublicQRDataResponse,
} from '../types/table';

export const tableService = {
  getTables: async (params?: {
    status?: string;
    location?: string;
    search?: string;
  }): Promise<TableListResponse> => {
    const response = await api.get('/tables', { params });
    return response.data;
  },

  getTable: async (id: number): Promise<TableResponse> => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },

  createTable: async (data: CreateTableRequest): Promise<TableResponse> => {
    const response = await api.post('/tables', data);
    return response.data;
  },

  updateTable: async (
    id: number,
    data: UpdateTableRequest
  ): Promise<TableResponse> => {
    const response = await api.put(`/tables/${id}`, data);
    return response.data;
  },

  deleteTable: async (id: number): Promise<DeleteTableResponse> => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
  },

  getTableQR: async (id: number): Promise<TableQRManagementResponse> => {
    const response = await api.get(`/tables/${id}/qr`);
    return response.data;
  },

  validateQRToken: async (
    qrToken: string
  ): Promise<TablePublicQRDataResponse> => {
    const response = await api.get(`/tables/qr/${qrToken}`);
    return response.data;
  },
};
