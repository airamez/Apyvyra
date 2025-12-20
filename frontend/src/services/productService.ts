// Product service for handling product-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId?: number;
  categoryName?: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  skuBarcode?: string;
  brand?: string;
  manufacturer?: string;
  weight?: number;
  weightUnit?: string;
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
  shortDescription?: string;
  categoryId?: number;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  skuBarcode?: string;
  brand?: string;
  manufacturer?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: string;
  isActive: boolean;
  userId?: number;
}

export const productService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    const response = await fetch(API_ENDPOINTS.PRODUCT.LIST, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  },

  // Get a single product by ID
  async getById(id: number): Promise<Product> {
    const response = await fetch(API_ENDPOINTS.PRODUCT.DETAIL(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    return await response.json();
  },

  // Create a new product
  async create(data: CreateProductData): Promise<Product> {
    const response = await fetch(API_ENDPOINTS.PRODUCT.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }

    return await response.json();
  },

  // Update an existing product
  async update(id: number, data: Partial<CreateProductData>): Promise<Product> {
    const response = await fetch(API_ENDPOINTS.PRODUCT.DETAIL(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }

    return await response.json();
  },

  // Delete a product
  async delete(id: number): Promise<void> {
    const response = await fetch(API_ENDPOINTS.PRODUCT.DETAIL(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
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
    const response = await fetch(`${API_ENDPOINTS.PRODUCT.DETAIL(productId)}/urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(urlData),
    });

    if (!response.ok) {
      throw new Error('Failed to add product URL');
    }

    return await response.json();
  },

  // Delete URL (only needs URL ID since it's unique)
  async deleteUrl(urlId: number): Promise<void> {
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/urls/${urlId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete URL');
    }
  },
};
