import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch, apiFetchWithMetadata, type ApiResponse } from '../utils/apiErrorHandler';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: number;
  statusName: string;
  shippingAddress: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  orderDate: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  items: OrderItem[];
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  shippingAddress: string;
  notes?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  pendingRevenue: number;
  confirmedRevenue: number;
  processingRevenue: number;
  shippedRevenue: number;
  deliveredRevenue: number;
}

export const ORDER_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
} as const;

export const ORDER_STATUS_NAMES: Record<number, string> = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Processing',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Cancelled',
};

export const orderService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiResponse<Order[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.ORDER.LIST}?${params.toString()}`
      : API_ENDPOINTS.ORDER.LIST;
    
    return apiFetchWithMetadata<Order[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async getById(id: number): Promise<Order> {
    return apiFetch<Order>(API_ENDPOINTS.ORDER.DETAIL(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async create(request: CreateOrderRequest): Promise<Order> {
    return apiFetch<Order>(API_ENDPOINTS.ORDER.LIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });
  },

  async updateStatus(id: number, status: number): Promise<Order> {
    return apiFetch<Order>(API_ENDPOINTS.ORDER.UPDATE_STATUS(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    });
  },

  async getStats(): Promise<OrderStats> {
    return apiFetch<OrderStats>(API_ENDPOINTS.ORDER.STATS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },
};
