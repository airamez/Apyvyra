// User service for handling user-related operations
import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';

export interface User {
  id: number;
  email: string;
}

export interface RegisterResponse {
  message: string;
  id?: number;
}

export const userService = {
  // Register a new user
  async register(email: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(API_ENDPOINTS.USERS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  },

  // Get current user profile (requires authentication)
  async getCurrentUser(): Promise<User> {
    const response = await fetch(API_ENDPOINTS.USERS.ME, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return await response.json();
  },

  // Add more user-related operations here as needed
  // async updateProfile(data: UpdateProfileData): Promise<User> { ... }
  // async deleteAccount(): Promise<void> { ... }
};
