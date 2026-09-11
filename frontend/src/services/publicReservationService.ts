import api from './api';

export const publicReservationService = {
  createReservation: async (data: any): Promise<any> => {
    const response = await api.post('/reservations/', data);
    return response.data;
  },
  lookupReservation: async (code: string): Promise<any> => {
    const response = await api.get(`/reservations/lookup/${code}`);
    return response.data;
  }
};
