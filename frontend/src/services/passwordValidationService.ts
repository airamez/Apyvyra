import { API_ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/apiErrorHandler';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordRulesStatus {
  isValid: boolean;
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  hasNoSpaces: boolean;
  hasNoSequential: boolean;
}

export const passwordValidationService = {
  async validatePassword(password: string): Promise<PasswordValidationResult> {
    return apiFetch<PasswordValidationResult>(API_ENDPOINTS.PASSWORD_VALIDATION.VALIDATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
  },

  async getRulesStatus(password: string): Promise<PasswordRulesStatus> {
    const response = await apiFetch<{ data: PasswordRulesStatus; success: boolean }>(API_ENDPOINTS.PASSWORD_VALIDATION.RULES_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    return response.data;
  },
};

export default passwordValidationService;
