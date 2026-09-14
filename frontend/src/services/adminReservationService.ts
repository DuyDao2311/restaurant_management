import api from './api';
import {
  AssignTablePayload,
  RejectReservationPayload,
  Reservation
} from '../types/reservation';
import { PaginatedResponse } from '../types';

export const adminReservationService = {
  getReservations: async (
    page: number = 1,
    limit: number = 10,
    params?: {
      status?: string;
      reservation_date?: string;
      table_id?: number;
    }
  ): Promise<PaginatedResponse<Reservation>> => {
    const response = await api.get('/admin/reservations', { 
      params: { page, limit, ...params } 
    });
    return response.data;
  },

  getReservation: async (id: number): Promise<Reservation> => {
    const response = await api.get(`/admin/reservations/${id}`);
    return response.data.data;
  },

  assignTable: async (id: number, payload: AssignTablePayload): Promise<Reservation> => {
    const response = await api.patch(`/admin/reservations/${id}/assign-table`, payload);
    return response.data.data;
  },

  rejectReservation: async (id: number, payload: RejectReservationPayload): Promise<Reservation> => {
    const response = await api.patch(`/admin/reservations/${id}/reject`, payload);
    return response.data.data;
  }
};
