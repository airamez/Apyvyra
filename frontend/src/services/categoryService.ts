// Category service for handling product category operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';
import type { FilterValues } from '../components/FilterComponent';
import { filtersToQueryParams } from '../utils/filterUtils';

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
  // Get all categories with query metadata and optional filters
  async getAll(filters?: FilterValues): Promise<ApiResponse<ProductCategory[]>> {
    let url = API_ENDPOINTS.PRODUCT_CATEGORY.LIST;
    
    if (filters && filters.length > 0) {
      const params = filtersToQueryParams(filters);
      url = `${url}?${params.toString()}`;
    }
    
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
