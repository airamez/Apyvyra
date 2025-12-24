// Category service for handling product category operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';

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

export interface CategoryFilters {
  isActive?: boolean;
  parentId?: number;
  search?: string;
}

export const categoryService = {
  // Get all categories with query metadata and optional filters
  async getAll(filters?: CategoryFilters): Promise<ApiResponse<ProductCategory[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.parentId) params.append('parentId', filters.parentId.toString());
      if (filters.search) params.append('search', filters.search);
    }
    
    const url = params.toString() ? `${API_ENDPOINTS.PRODUCT_CATEGORY.LIST}?${params.toString()}` : API_ENDPOINTS.PRODUCT_CATEGORY.LIST;
    
    return apiFetchWithMetadata<ProductCategory[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Get category by ID
  async getById(id: number): Promise<ProductCategory> {
    return apiFetch<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY.DETAIL(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Create a new category
  async create(data: { name: string; description?: string }): Promise<ProductCategory> {
    return apiFetch<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  // Update a category
  async update(id: number, data: { name: string; description?: string }): Promise<ProductCategory> {
    return apiFetch<ProductCategory>(API_ENDPOINTS.PRODUCT_CATEGORY.DETAIL(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  // Delete a category
  async delete(id: number): Promise<void> {
    return apiFetch<void>(API_ENDPOINTS.PRODUCT_CATEGORY.DETAIL(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },
};
