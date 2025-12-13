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
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
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
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/products`, {
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
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/products/${id}`, {
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
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/products`, {
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
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/products/${id}`, {
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
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/products/${id}`, {
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

  // Add image to product
  async addImage(productId: number, imageData: {
    imageUrl: string;
    altText?: string;
    displayOrder: number;
    isPrimary: boolean;
    userId?: number;
  }): Promise<ProductImage> {
    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/products/${productId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      throw new Error('Failed to add product image');
    }

    return await response.json();
  },
};
