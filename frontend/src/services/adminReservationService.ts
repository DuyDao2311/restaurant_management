import api from './api';
import {
  Reservation,
  ReservationListResponse,
  AssignTablePayload,
  RejectReservationPayload
} from '../types/reservation';

export const adminReservationService = {
  getReservations: async (params?: {
    status?: string;
    reservation_date?: string;
    table_id?: number;
    page?: number;
    size?: number;
  }): Promise<ReservationListResponse> => {
    const { size, ...rest } = params || {};
    const response = await api.get('/admin/reservations', { 
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
