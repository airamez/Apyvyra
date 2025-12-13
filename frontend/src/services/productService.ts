// Product service for handling product-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  // Add more product fields as needed
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
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
};
