import api from './api';
import { AxiosResponse } from 'axios';

import { PaginatedResponse } from '../types';

export interface User {
  id: number;
  role_id: number;
  full_name: string;
  phone: string;
  email?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  created_at?: string;
  updated_at?: string;
}

interface SingleUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface UserUpdateData {
  role_id?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

const userService = {
  getUsers: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> => {
    const response: AxiosResponse<PaginatedResponse<User>> = await api.get('/users', {
      params: { page, limit }
    });
    return response.data;
  },

  getUserById: async (id: number): Promise<SingleUserResponse> => {
    const response: AxiosResponse<SingleUserResponse> = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: UserUpdateData): Promise<SingleUserResponse> => {
    const response: AxiosResponse<SingleUserResponse> = await api.put(`/users/${id}`, data);
    return response.data;
  }
};

export default userService;
