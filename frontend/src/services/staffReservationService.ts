import api from './api';
import {
  Reservation,
  ReservationListResponse,
  AssignTablePayload,
  RejectReservationPayload
} from '../types/reservation';

export const staffReservationService = {
  getReservations: async (params?: {
    status?: string;
    reservation_date?: string;
    table_id?: number;
    page?: number;
    size?: number;
  }): Promise<ReservationListResponse> => {
    const { size, ...rest } = params || {};
    const response = await api.get('/staff/reservations', { 
      params: { ...rest, limit: size } 
    });
    const resData = response.data;
    return {
      items: resData.data || [],
      total: resData.total || 0,
      page: resData.page || 1,
      size: resData.limit || 10,
      pages: Math.ceil((resData.total || 0) / (resData.limit || 10)) || 1
    };
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
