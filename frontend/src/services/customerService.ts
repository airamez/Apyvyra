import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';

export interface CustomerAddressResponse {
  id: number;
  addressLine: string;
  formattedAddress?: string;
  googlePlaceId?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  stateCode?: string;
  city?: string;
  postalCode?: string;
  streetNumber?: string;
  route?: string;
  isValidated: boolean;
}

export interface Customer {
  id: number;
  appUserId: number;
  email: string;
  fullName?: string;
  phone?: string;
  address?: CustomerAddressResponse;
  addressValidated: boolean;
  status: number;
  statusName: string;
  emailConfirmedAt?: string;
  createdAt: string;
  createdBy: number;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: number;
  updatedByName?: string;
  orderCount: number;
  phoneCallCount: number;
  notes?: string;
}

export interface CreateCustomerData {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  bypassAddressValidation?: boolean;
  notes?: string;
}

export interface UpdateCustomerData {
  fullName?: string;
  phone?: string;
  address?: string;
  status?: number;
  bypassAddressValidation?: boolean;
  notes?: string;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  status: number;
  statusName: string;
  paymentStatus: number;
  paymentStatusName: string;
  shippingAddress: string;
  totalAmount: number;
  orderDate: string;
  itemCount: number;
}

export interface PhoneCall {
  id: number;
  customerId: number;
  callDate: string;
  callType: number;
  callTypeName: string;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
  createdBy: number;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: number;
  updatedByName?: string;
}

export interface CreatePhoneCallData {
  callDate?: string;
  callType: number;
  durationMinutes?: number;
  notes?: string;
}

export interface UpdatePhoneCallData {
  callDate?: string;
  callType?: number;
  durationMinutes?: number;
  notes?: string;
}

export const customerService = {
  async getAll(filters?: Record<string, any>): Promise<ApiResponse<Customer[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.CUSTOMER.LIST}?${params.toString()}`
      : API_ENDPOINTS.CUSTOMER.LIST;
    
    return apiFetchWithMetadata<Customer[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getById(id: number): Promise<Customer> {
    return apiFetch<Customer>(API_ENDPOINTS.CUSTOMER.DETAIL(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async create(data: CreateCustomerData): Promise<Customer> {
    return apiFetch<Customer>(API_ENDPOINTS.CUSTOMER.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: UpdateCustomerData): Promise<Customer> {
    return apiFetch<Customer>(API_ENDPOINTS.CUSTOMER.DETAIL(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return apiFetch<void>(API_ENDPOINTS.CUSTOMER.DETAIL(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async resendWelcomeEmail(id: number): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(API_ENDPOINTS.CUSTOMER.RESEND_WELCOME(id), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getOrders(id: number): Promise<CustomerOrder[]> {
    return apiFetch<CustomerOrder[]>(API_ENDPOINTS.CUSTOMER.ORDERS(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getPhoneCalls(id: number): Promise<PhoneCall[]> {
    return apiFetch<PhoneCall[]>(API_ENDPOINTS.CUSTOMER.PHONE_CALLS(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async createPhoneCall(customerId: number, data: CreatePhoneCallData): Promise<PhoneCall> {
    return apiFetch<PhoneCall>(API_ENDPOINTS.CUSTOMER.PHONE_CALLS(customerId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async updatePhoneCall(customerId: number, callId: number, data: UpdatePhoneCallData): Promise<PhoneCall> {
    return apiFetch<PhoneCall>(API_ENDPOINTS.CUSTOMER.PHONE_CALL_DETAIL(customerId, callId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  async deletePhoneCall(customerId: number, callId: number): Promise<void> {
    return apiFetch<void>(API_ENDPOINTS.CUSTOMER.PHONE_CALL_DETAIL(customerId, callId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },
};
