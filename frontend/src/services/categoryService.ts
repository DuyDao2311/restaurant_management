import api from './api';
import { AxiosResponse } from 'axios';
import { Category } from '../types';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface CategoryListResponse {
  success: boolean;
  message?: string;
  data: {
    items: Category[];
    pagination: Pagination;
  };
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data: Category;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  image?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  image?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export const categoryService = {
  /**
   * Get all categories with optional pagination and search
   */
  getCategories: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<CategoryListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (status && status !== 'ALL') params.status = status;

    const response: AxiosResponse<CategoryListResponse> = await api.get('/categories', { params });
    return response.data;
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: number): Promise<CategoryResponse> => {
    const response: AxiosResponse<CategoryResponse> = await api.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * Create a new category
   */
  createCategory: async (data: CreateCategoryData): Promise<CategoryResponse> => {
    const response: AxiosResponse<CategoryResponse> = await api.post('/categories', data);
    return response.data;
  },

  /**
   * Update a category
   */
  updateCategory: async (id: number, data: UpdateCategoryData): Promise<CategoryResponse> => {
    const response: AxiosResponse<CategoryResponse> = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Update category status
   */
  updateCategoryStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<CategoryResponse> => {
    const response: AxiosResponse<CategoryResponse> = await api.patch(`/categories/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (id: number): Promise<GenericResponse> => {
    const response: AxiosResponse<GenericResponse> = await api.delete(`/categories/${id}`);
    return response.data;
  }
};
