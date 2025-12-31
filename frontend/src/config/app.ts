// Application Configuration
// This file contains utilities that work with the AppSettingsContext

import type { AppSettings, CurrencyConfig, DateFormatConfig } from '../contexts/AppSettingsContext';

// Get current app configuration from context (should be used within components)
export function getAppConfig(): AppSettings {
  // This will be replaced by context usage in components
  throw new Error('getAppConfig() is deprecated. Use useAppSettings() hook instead.');
}

// Legacy functions for backward compatibility (deprecated)
export function updateAppConfig(_config: Partial<AppSettings>): void {
  console.warn('updateAppConfig() is deprecated. Settings should be updated via backend API.');
}

export function resetAppConfig(): void {
  console.warn('resetAppConfig() is deprecated. Settings should be updated via backend API.');
}

// Currency formatting utility - use within components with useAppSettings()
export function formatCurrency(amount: number, currency: CurrencyConfig): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
  }).format(amount);
}

// Date formatting utility - use within components with useAppSettings()
export function formatDate(dateString: string, dateFormat: DateFormatConfig): string {
  return new Date(dateString).toLocaleDateString(dateFormat.locale, dateFormat.options);
}

export default {
  getAppConfig,
  updateAppConfig,
  resetAppConfig,
  formatCurrency,
  formatDate,
};
