// Auth service for handling JWT tokens and authentication
import { API_ENDPOINTS } from '../config/api';

interface User {
  id: number;
  email: string;
  role: number; // 0: admin, 1: staff, 2: customer
}

interface LoginResponse {
  id: number;
  email: string;
  role: number;
  token: string;
  message: string;
}

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

export const authService = {
  // Store JWT token
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get JWT token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Remove JWT token
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Store user data (non-sensitive info only)
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Get user data
  getUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  // Get user role
  getUserRole(): number | null {
    const user = this.getUser();
    return user ? user.role : null;
  },

  // Check if user is admin or staff
  isAdminOrStaff(): boolean {
    const role = this.getUserRole();
    return role === 0 || role === 1; // 0: admin, 1: staff
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = this.parseJwt(token);
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  // Parse JWT token to get payload
  parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  },

  // Get authorization header for API requests
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(API_ENDPOINTS.APP_USER.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    // Store token and user data
    this.setToken(data.token);
    this.setUser({ id: data.id, email: data.email, role: data.role });
    
    return data;
  },

  // Logout user
  logout(): void {
    this.removeToken();
  },
};
