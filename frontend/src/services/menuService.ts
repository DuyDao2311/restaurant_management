import api from './api';
import { MenuItem } from '../types';

export const menuService = {
  // Lấy danh sách món ăn
  getAllMenuItems: async (): Promise<MenuItem[]> => {
    try {
      const response = await api.get('/menu-items');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  },

  // Lấy chi tiết món ăn
  getMenuItemById: async (id: number): Promise<MenuItem> => {
    const response = await api.get(`/menu-items/${id}`);
    return response.data.data || response.data;
  },

  // Tạo món ăn mới
  createMenuItem: async (data: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await api.post('/menu-items', data);
    return response.data.data || response.data;
  },

  // Cập nhật món ăn
  updateMenuItem: async (id: number, data: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await api.put(`/menu-items/${id}`, data);
    return response.data.data || response.data;
  },

  // Xóa món ăn
  deleteMenuItem: async (id: number): Promise<void> => {
    await api.delete(`/menu-items/${id}`);
  },
};
