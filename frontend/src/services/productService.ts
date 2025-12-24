// Product service for handling product-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  brand?: string;
  manufacturer?: string;
  weight?: string;
  dimensions?: string;
  isActive: boolean;
  urls?: ProductUrl[];
  createdAt: string;
  updatedAt: string;
}

export type UrlType = 'image' | 'video' | 'manual';

export interface ProductUrl {
  id: number;
  productId: number;
  url: string;
  urlType: UrlType;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  price: number | undefined;
  costPrice?: number;
  stockQuantity: number | undefined;
  lowStockThreshold: number | undefined;
  brand?: string;
  manufacturer?: string;
  weight?: string;
  dimensions?: string;
  isActive: boolean;
  userId?: number;
}

export interface ProductFilters {
  categoryId?: number;
  brand?: string;
  isActive?: boolean;
  search?: string;
  sku?: string;
  manufacturer?: string;
}

export const productService = {
  // Get all products with query metadata and optional filters
  async getAll(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sku) params.append('sku', filters.sku);
      if (filters.manufacturer) params.append('manufacturer', filters.manufacturer);
    }
    
    const url = params.toString() ? `${API_ENDPOINTS.PRODUCT.LIST}?${params.toString()}` : API_ENDPOINTS.PRODUCT.LIST;
    
    return apiFetchWithMetadata<Product[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Get a single product by ID
  async getById(id: number): Promise<Product> {
    return apiFetch<Product>(API_ENDPOINTS.PRODUCT.DETAIL(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Create a new product
  async create(data: CreateProductData): Promise<Product> {
    return apiFetch<Product>(API_ENDPOINTS.PRODUCT.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  // Update an existing product
  async update(id: number, data: Partial<CreateProductData>): Promise<Product> {
    return apiFetch<Product>(API_ENDPOINTS.PRODUCT.DETAIL(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  // Delete a product
  async delete(id: number): Promise<void> {
    return apiFetch<void>(API_ENDPOINTS.PRODUCT.DETAIL(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Add URL to product
  async addUrl(productId: number, urlData: {
    url: string;
    urlType: UrlType;
    altText?: string;
    displayOrder: number;
    isPrimary: boolean;
    userId?: number;
  }): Promise<ProductUrl> {
    return apiFetch<ProductUrl>(API_ENDPOINTS.PRODUCT.ADD_URL(productId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(urlData),
    });
  },

  // Delete URL from product
  async deleteUrl(urlId: number): Promise<void> {
    return apiFetch<void>(API_ENDPOINTS.PRODUCT.DELETE_URL(urlId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Get product URLs
  async getProductUrls(productId: number): Promise<ProductUrl[]> {
    return apiFetch<ProductUrl[]>(API_ENDPOINTS.PRODUCT.GET_URLS(productId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },
};
