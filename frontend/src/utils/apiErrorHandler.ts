/**
 * API Error Handler Utility
 * Provides centralized error handling for all API calls
 */

export interface ApiError {
  success: boolean;
  errors: string[];
  statusCode: number;
}

/**
 * Checks response headers for success status and error messages
 * @param response - Fetch Response object
 * @returns ApiError object if request failed, null if successful
 */
export function checkResponseHeaders(response: Response): ApiError | null {
  const successHeader = response.headers.get('X-Success');
  const errorsHeader = response.headers.get('X-Errors');
  
  const isSuccess = successHeader === 'true';
  
  if (!isSuccess) {
    let errors: string[] = [];
    
    // Parse errors from header if present
    if (errorsHeader) {
      try {
        errors = JSON.parse(errorsHeader);
      } catch (e) {
        errors = [errorsHeader];
      }
    }
    
    // If no errors in header, try to extract from response body
    if (errors.length === 0) {
      errors = ['An error occurred while processing your request'];
    }
    
    return {
      success: false,
      errors,
      statusCode: response.status
    };
  }
  
  return null;
}

/**
 * Handles API response and throws ApiError if request failed
 * @param response - Fetch Response object
 * @returns Response if successful
 * @throws ApiError if request failed
 */
export async function handleApiResponse(response: Response): Promise<Response> {
  const error = checkResponseHeaders(response);
  
  if (error) {
    throw error;
  }
  
  return response;
}

/**
 * Wrapper for fetch that automatically handles errors
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws ApiError if request failed
 */
export async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  await handleApiResponse(response);
  
  // If response has no content (204), return null
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json();
}

/**
 * Formats error messages for display
 * @param error - ApiError or Error object
 * @returns Formatted error message
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const apiError = error as ApiError;
    return apiError.errors.join('\n');
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Formats error messages as an array
 * @param error - ApiError or Error object
 * @returns Array of error messages
 */
export function getErrorMessages(error: unknown): string[] {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const apiError = error as ApiError;
    return apiError.errors;
  }
  
  if (error instanceof Error) {
    return [error.message];
  }
  
  return ['An unexpected error occurred'];
}
