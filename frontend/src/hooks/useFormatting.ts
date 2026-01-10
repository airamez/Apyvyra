import { useCallback, useMemo } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';

// Custom hook that provides formatting functions using app settings from context
export function useFormatting() {
  const { settings, loading, error } = useAppSettings();
  
  // Get locale with fallback
  const getLocale = useCallback(() => {
    if (loading) return 'en-US'; // Fallback during loading
    if (error) return 'en-US'; // Fallback on error too to prevent crashes
    const locale = settings?.locale;
    if (!locale) return 'en-US'; // Fallback instead of throwing
    return locale;
  }, [settings, loading, error]);

  // Currency formatting
  const formatCurrency = useCallback((amount: number): string => {
    const locale = getLocale();
    
    if (loading || error || !settings?.currency) {
      // Always use fallback during loading, error, or missing settings
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: settings.currency.code,
    }).format(amount);
  }, [getLocale, settings, loading, error]);

  // Date formatting - simple using the locale
  const formatDate = useCallback((dateString: string): string => {
    const locale = getLocale();
    
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }, [getLocale]);

  // Time formatting
  const formatTime = useCallback((dateString: string): string => {
    const locale = getLocale();
    
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [getLocale]);

  // Format currency with symbol (for display)
  const formatCurrencyWithSymbol = useCallback((amount: number): string => {
    const locale = getLocale();
    
    if (loading || error || !settings?.currency) {
      // Always use fallback during loading, error, or missing settings
      return `$${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)}`;
    }
    
    return `${settings.currency.symbol}${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }, [getLocale, settings, loading, error]);

  return useMemo(() => ({
    formatCurrency,
    formatDate,
    formatTime,
    formatCurrencyWithSymbol,
    currency: settings?.currency,
    dateFormat: settings?.dateFormat,
    company: settings?.company,
    loading,
    error,
  }), [formatCurrency, formatDate, formatTime, formatCurrencyWithSymbol, settings, loading, error]);
}

export default useFormatting;
