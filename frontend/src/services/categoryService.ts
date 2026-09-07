import api from './api';
import { Category } from '../types';

export const categoryService = {
  // Lấy danh sách danh mục
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/categories');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Các hàm CRUD khác có thể thêm sau...
};
