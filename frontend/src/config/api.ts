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
  },
  PRODUCT: {
    LIST: `${API_BASE_URL}/api/product`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/product/${id}`,
  },
  PRODUCT_CATEGORY: {
    LIST: `${API_BASE_URL}/api/product_category`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/product_category/${id}`,
  },
  // Add more domain endpoints as needed
  // CUSTOMERS: {
  //   LIST: `${API_BASE_URL}/api/customers`,
  //   DETAIL: (id: number) => `${API_BASE_URL}/api/customers/${id}`,
  // },
};

export default API_ENDPOINTS;
