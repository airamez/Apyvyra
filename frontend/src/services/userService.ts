// User service for handling user-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch } from '../utils/apiErrorHandler';

export interface User {
  id: number;
  email: string;
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

  // Add more user-related operations here as needed
  // async updateProfile(data: UpdateProfileData): Promise<User> { ... }
  // async deleteAccount(): Promise<void> { ... }
};
