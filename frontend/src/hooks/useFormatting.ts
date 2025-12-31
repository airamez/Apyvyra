import { useCallback, useMemo } from 'react';
import { useAppSettings } from '../contexts/AppSettingsContext';

// Custom hook that provides formatting functions using app settings from context
export function useFormatting() {
  const { settings, loading, error } = useAppSettings();

  // Currency formatting
  const formatCurrency = useCallback((amount: number): string => {
    if (loading || error || !settings?.currency) {
      // Fallback to default USD formatting when settings are not available
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
    
    return new Intl.NumberFormat(settings.currency.locale, {
      style: 'currency',
      currency: settings.currency.code,
    }).format(amount);
  }, [settings?.currency?.locale, settings?.currency?.code, loading, error]);

  // Date formatting
  const formatDate = useCallback((dateString: string): string => {
    if (loading || error || !settings?.dateFormat) {
      // Fallback to default date formatting when settings are not available
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    
    return new Date(dateString).toLocaleDateString(
      settings.dateFormat.locale,
      settings.dateFormat.options
    );
  }, [settings?.dateFormat?.locale, settings?.dateFormat?.options, loading, error]);

  // Format currency with symbol (for display)
  const formatCurrencyWithSymbol = useCallback((amount: number): string => {
    if (loading || error || !settings?.currency) {
      // Fallback to default USD formatting when settings are not available
      return `$${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)}`;
    }
    
    return `${settings.currency.symbol}${new Intl.NumberFormat(settings.currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }, [settings?.currency?.locale, settings?.currency?.symbol, loading, error]);

  return useMemo(() => ({
    formatCurrency,
    formatDate,
    formatCurrencyWithSymbol,
    currency: loading || error || !settings?.currency ? {
      code: 'USD',
      symbol: '$',
      locale: 'en-US',
    } : settings.currency,
    dateFormat: loading || error || !settings?.dateFormat ? {
      locale: 'en-US',
      options: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
    } : settings.dateFormat,
    company: loading || error || !settings?.company ? {
      name: 'Apyvyra',
      logo: '',
      website: 'https://apyvyra.com',
    } : settings.company,
    loading,
    error,
  }), [formatCurrency, formatDate, formatCurrencyWithSymbol, settings, loading, error]);
}

export default useFormatting;
