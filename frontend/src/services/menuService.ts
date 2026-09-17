import api from './api';
import { MenuItem } from '../types';

export const menuService = {
  getAllMenuItems: async (params?: { page?: number; limit?: number; category_id?: number; status?: string; search?: string }): Promise<{ items: MenuItem[]; total: number; total_pages: number }> => {
    try {
      const response = await api.get('/menu-items', { params });
      const data = response.data.data;
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items,
          total: data.pagination?.total || 0,
          total_pages: data.pagination?.total_pages || 0
        };
      }
      return { items: [], total: 0, total_pages: 0 };
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
