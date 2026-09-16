import api from './api';

export const publicReservationService = {
  createReservation: async (data: any): Promise<any> => {
    const response = await api.post('/reservations/', data);
    return response.data;
  },
  lookupReservation: async (reservation_code: string, customer_phone: string): Promise<any> => {
    const response = await api.post('/reservations/lookup', { reservation_code, customer_phone });
    return response.data;
  },
  cancelGuestReservation: async (reservation_code: string, customer_phone: string): Promise<any> => {
    const response = await api.post('/reservations/guest-cancel', { reservation_code, customer_phone });
    return response.data;
  }
};
