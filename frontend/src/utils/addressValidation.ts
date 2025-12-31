import { API_ENDPOINTS } from '../config/api';
import { apiFetch } from './apiErrorHandler';
import { authService } from '../services/authService';

export interface GoogleAddress {
  place_id: string;
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface AddressValidationResult {
  isValid: boolean;
  address: GoogleAddress | null;
  errorMessage?: string;
  isMockValidation?: boolean;
}

export const validateAddress = async (address: string): Promise<AddressValidationResult> => {
  if (!address.trim()) {
    return {
      isValid: false,
      address: null,
      errorMessage: 'Address is required'
    };
  }

  try {
    const response = await apiFetch<{ isValid: boolean; placeId?: string; formattedAddress?: string; errorMessage?: string; addressComponents?: any; isMockValidation?: boolean }>(API_ENDPOINTS.ADDRESS.VALIDATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader(),
      },
      body: JSON.stringify({ address }),
    });

    if (response.isValid && response.placeId && response.formattedAddress) {
      // Convert API response to GoogleAddress format
      const googleAddress: GoogleAddress = {
        place_id: response.placeId,
        formatted_address: response.formattedAddress,
        address_components: response.addressComponents ? Object.entries(response.addressComponents).map(([type, component]: [string, any]) => ({
          long_name: component.long_name,
          short_name: component.short_name,
          types: [type]
        })) : []
      };

      return {
        isValid: true,
        address: googleAddress,
        isMockValidation: response.isMockValidation
      };
    } else {
      return {
        isValid: false,
        address: null,
        errorMessage: response.errorMessage,
        isMockValidation: response.isMockValidation
      };
    }
  } catch (error: any) {
    console.error('Address validation failed:', error);
    
    // Handle authentication errors specifically
    if (error?.statusCode === 401) {
      return {
        isValid: false,
        address: null,
        errorMessage: 'You must be logged in to validate addresses. Please log in and try again.'
      };
    }
    
    // Handle other API errors
    if (error?.errors && error.errors.length > 0) {
      return {
        isValid: false,
        address: null,
        errorMessage: error.errors[0]
      };
    }
    
    return {
      isValid: false,
      address: null,
      errorMessage: 'Failed to validate address. Please try again.'
    };
  }
};
