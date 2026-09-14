import api from './api';
import { AxiosResponse } from 'axios';

import { PaginatedResponse } from '../types';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at?: string;
}

const roleService = {
  getRoles: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Role>> => {
    const response: AxiosResponse<PaginatedResponse<Role>> = await api.get('/roles', {
      params: { page, limit }
    });
    return response.data;
  },
};

export default roleService;
