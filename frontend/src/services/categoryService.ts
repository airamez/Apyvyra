// Category service for handling product category operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  isActive: boolean;
  subCategories?: ProductCategory[];
  createdAt: string;
  updatedAt: string;
}

export const categoryService = {
  // Get all categories
  async getAll(): Promise<ProductCategory[]> {
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/productcategories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return await response.json();
  },

  // Get category by ID
  async getById(id: number): Promise<ProductCategory> {
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/productcategories/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch category');
    }

    return await response.json();
  },
};
