import api from './api';
import type { LoginResponse, MeResponse, RegisterRequest, RegisterResponse } from '../types';

const authService = {
  /**
   * Đăng ký tài khoản
   * @param data - Thông tin đăng ký
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },
  /**
   * Đăng nhập
   * @param phone - Số điện thoại
   * @param password - Mật khẩu
   */
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', { phone, password });
    return response.data;
  },

  /**
   * Lấy thông tin user hiện tại (Dựa trên JWT Token)
   */
  getCurrentUser: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>('/auth/me');
    return response.data;
  },
};

export default authService;
