import api from './api';
import { AxiosResponse } from 'axios';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at?: string;
}

interface RoleResponse {
  success: boolean;
  message: string;
  data: Role[];
}

const roleService = {
  getRoles: async (): Promise<RoleResponse> => {
    const response: AxiosResponse<RoleResponse> = await api.get('/roles');
    return response.data;
  },
};

export default roleService;
