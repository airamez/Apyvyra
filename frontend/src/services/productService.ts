// Product service for handling product-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch } from '../utils/apiErrorHandler';

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

export const productService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    return apiFetch<Product[]>(API_ENDPOINTS.PRODUCT.LIST, {
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
