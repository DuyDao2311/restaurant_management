import api from './api';
import {
  AssignTablePayload,
  RejectReservationPayload,
  Reservation
} from '../types/reservation';
import { PaginatedResponse } from '../types';

export const staffReservationService = {
  getReservations: async (
    page: number = 1,
    limit: number = 10,
    params?: {
      status?: string;
      reservation_date?: string;
      table_id?: number;
    }
  ): Promise<PaginatedResponse<Reservation>> => {
    const response = await api.get('/staff/reservations', { 
      params: { page, limit, ...params } 
    });
    return response.data;
  },

  getReservation: async (id: number): Promise<Reservation> => {
    const response = await api.get(`/staff/reservations/${id}`);
    return response.data.data;
  },

  assignTable: async (id: number, payload: AssignTablePayload): Promise<Reservation> => {
    const response = await api.patch(`/staff/reservations/${id}/assign-table`, payload);
    return response.data.data;
  },

  rejectReservation: async (id: number, payload: RejectReservationPayload): Promise<Reservation> => {
    const response = await api.patch(`/staff/reservations/${id}/reject`, payload);
    return response.data.data;
  },

  checkInReservation: async (id: number): Promise<Reservation> => {
    const response = await api.post(`/staff/reservations/${id}/check-in`);
    return response.data.data;
  }
};
