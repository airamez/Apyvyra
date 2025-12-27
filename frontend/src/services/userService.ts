// User service for handling user-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';

export interface User {
  id: number;
  email: string;
  fullName?: string;
}

export interface UserList {
  id: number;
  username: string;
  email: string;
  userType: number;
}

export interface RegisterResponse {
  message: string;
  id?: number;
}

export const userService = {
  async register(email: string, password: string): Promise<RegisterResponse> {
    return apiFetch<RegisterResponse>(API_ENDPOINTS.APP_USER.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  },

  // Get current user profile (requires authentication)
  async getCurrentUser(): Promise<User> {
    return apiFetch<User>(API_ENDPOINTS.APP_USER.ME, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Get all users (admin only)
  async getAll(filters?: Record<string, any>): Promise<ApiResponse<UserList[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.USER.LIST}?${params.toString()}`
      : API_ENDPOINTS.USER.LIST;
    
    return apiFetchWithMetadata<UserList[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  // Get customer count (userType = 2)
  async getCustomerCount(): Promise<number> {
    const response = await this.getAll({ userType: 2 });
    return response.metadata.totalCount;
  },

  // Update current user profile
  async updateProfile(data: { fullName?: string }): Promise<User> {
    return apiFetch<User>(API_ENDPOINTS.APP_USER.ME, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  // Add more user-related operations here as needed
  // async deleteAccount(): Promise<void> { ... }
};
