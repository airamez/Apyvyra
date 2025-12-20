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
    const response = await fetch(API_ENDPOINTS.PRODUCT_CATEGORY.LIST, {
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
    const response = await fetch(API_ENDPOINTS.PRODUCT_CATEGORY.DETAIL(id), {
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

    // Create a new category
    async create(data: { name: string; description?: string }): Promise<ProductCategory> {
      const response = await fetch(API_ENDPOINTS.PRODUCT_CATEGORY.LIST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      return await response.json();
    },

    // Update a category
    async update(id: number, data: { name: string; description?: string }): Promise<ProductCategory> {
      const response = await fetch(API_ENDPOINTS.PRODUCT_CATEGORY.DETAIL(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      return await response.json();
    },

    // Delete a category
    async delete(id: number): Promise<void> {
      const response = await fetch(API_ENDPOINTS.PRODUCT_CATEGORY.DETAIL(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
    },
};
