import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';

export interface Staff {
  id: number;
  email: string;
  fullName?: string;
  status: number;
  statusName: string;
  emailConfirmedAt?: string;
  createdAt: string;
  createdBy: number;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: number;
  updatedByName?: string;
}

export interface CreateStaffData {
  email: string;
  fullName: string;
}

export interface UpdateStaffData {
  fullName: string;
  status: number;
}

export interface StaffSetupInfo {
  email: string;
  fullName?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface StaffSetupData {
  token: string;
  password: string;
}

export const staffService = {
  async getAll(filters?: Record<string, any>): Promise<ApiResponse<Staff[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.STAFF.LIST}?${params.toString()}`
      : API_ENDPOINTS.STAFF.LIST;
    
    return apiFetchWithMetadata<Staff[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getById(id: number): Promise<Staff> {
    return apiFetch<Staff>(API_ENDPOINTS.STAFF.DETAIL(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async create(data: CreateStaffData): Promise<Staff> {
    return apiFetch<Staff>(API_ENDPOINTS.STAFF.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: UpdateStaffData): Promise<Staff> {
    return apiFetch<Staff>(API_ENDPOINTS.STAFF.DETAIL(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return apiFetch<void>(API_ENDPOINTS.STAFF.DETAIL(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async resendInvitation(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(API_ENDPOINTS.STAFF.RESEND_INVITATION(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getSetupInfo(token: string): Promise<StaffSetupInfo> {
    return apiFetch<StaffSetupInfo>(API_ENDPOINTS.STAFF.SETUP_INFO(token), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async completeSetup(data: StaffSetupData): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(API_ENDPOINTS.STAFF.COMPLETE_SETUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
};
