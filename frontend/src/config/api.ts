// API Configuration
// This allows easy environment-based configuration

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  APP_USER: {
    REGISTER: `${API_BASE_URL}/api/app_user`,
    LOGIN: `${API_BASE_URL}/api/app_user/login`,
    ME: `${API_BASE_URL}/api/app_user/me`,
    CONFIRM_EMAIL: `${API_BASE_URL}/api/app_user/confirm`,
    RESEND_CONFIRMATION: `${API_BASE_URL}/api/app_user/resend-confirmation`,
  },
  USER: {
    LIST: `${API_BASE_URL}/api/app_user`,
  },
  STAFF: {
    LIST: `${API_BASE_URL}/api/app_user/staff`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/app_user/staff/${id}`,
    RESEND_INVITATION: (id: number) => `${API_BASE_URL}/api/app_user/staff/resend-invitation/${id}`,
    SETUP_INFO: (token: string) => `${API_BASE_URL}/api/app_user/staff-setup/${token}`,
    COMPLETE_SETUP: `${API_BASE_URL}/api/app_user/staff-setup`,
  },
  PRODUCT: {
    LIST: `${API_BASE_URL}/api/product`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/product/${id}`,
    GET_URLS: (productId: number) => `${API_BASE_URL}/api/product/${productId}/urls`,
    ADD_URL: (productId: number) => `${API_BASE_URL}/api/product/${productId}/urls`,
    DELETE_URL: (urlId: number) => `${API_BASE_URL}/api/urls/${urlId}`,
  },
  PRODUCT_CATEGORY: {
    LIST: `${API_BASE_URL}/api/product_category`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/product_category/${id}`,
  },
  ORDER: {
    LIST: `${API_BASE_URL}/api/order`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/order/${id}`,
    UPDATE_STATUS: (id: number) => `${API_BASE_URL}/api/order/${id}/status`,
    STATS: `${API_BASE_URL}/api/order/stats`,
  },
  PAYMENT: {
    CONFIG: `${API_BASE_URL}/api/payment/config`,
    CREATE_INTENT: (orderId: number) => `${API_BASE_URL}/api/payment/create-intent/${orderId}`,
    CONFIRM: (orderId: number) => `${API_BASE_URL}/api/payment/confirm/${orderId}`,
    REFUND: (orderId: number) => `${API_BASE_URL}/api/payment/refund/${orderId}`,
  },
  ADDRESS: {
    VALIDATE: `${API_BASE_URL}/api/address/validate`,
  },
  TRANSLATION: {
    LANGUAGE: `${API_BASE_URL}/api/translation/language`,
    GET: (component: string) => `${API_BASE_URL}/api/translation/${component}`,
  },
  // Add more domain endpoints as needed
  // CUSTOMERS: {
  //   LIST: `${API_BASE_URL}/api/customers`,
  //   DETAIL: (id: number) => `${API_BASE_URL}/api/customers/${id}`,
  // },
};

export default API_ENDPOINTS;
