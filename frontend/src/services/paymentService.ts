import { API_ENDPOINTS } from '../config/api';
import { authService } from './authService';
import { apiFetch } from '../utils/apiErrorHandler';

export interface PaymentConfig {
  publishableKey: string;
  testMode: boolean;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  status: string;
}

export interface PaymentConfirmation {
  success: boolean;
  orderId: number;
  orderNumber: string;
  paymentStatus: string;
  message: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  message: string;
}

export const paymentService = {
  async getConfig(): Promise<PaymentConfig> {
    return apiFetch<PaymentConfig>(API_ENDPOINTS.PAYMENT.CONFIG, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async createPaymentIntent(orderId: number): Promise<PaymentIntent> {
    return apiFetch<PaymentIntent>(API_ENDPOINTS.PAYMENT.CREATE_INTENT(orderId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async confirmPayment(orderId: number): Promise<PaymentConfirmation> {
    return apiFetch<PaymentConfirmation>(API_ENDPOINTS.PAYMENT.CONFIRM(orderId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },

  async refundPayment(orderId: number): Promise<RefundResponse> {
    return apiFetch<RefundResponse>(API_ENDPOINTS.PAYMENT.REFUND(orderId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
    });
  },
};
