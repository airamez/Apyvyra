// API Configuration
// This allows easy environment-based configuration

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is not set');
}

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  USERS: {
    REGISTER: `${API_BASE_URL}/api/users`,
    LOGIN: `${API_BASE_URL}/api/users/login`,
    ME: `${API_BASE_URL}/api/users/me`,
  },
  PRODUCTS: {
    LIST: `${API_BASE_URL}/api/products`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/products/${id}`,
  },
  // Add more domain endpoints as needed
  // CUSTOMERS: {
  //   LIST: `${API_BASE_URL}/api/customers`,
  //   DETAIL: (id: number) => `${API_BASE_URL}/api/customers/${id}`,
  // },
};

export default API_ENDPOINTS;
