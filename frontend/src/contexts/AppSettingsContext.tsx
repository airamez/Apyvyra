import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { API_ENDPOINTS } from '../config/api';

// Types for app settings
export interface CurrencyConfig {
  code: string;           // ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP')
  symbol: string;         // Currency symbol (e.g., '$', '€', '£')
  locale: string;         // Locale for number formatting (e.g., 'en-US', 'de-DE', 'fr-FR')
}

export interface DateFormatConfig {
  locale: string;         // Locale for date formatting
  options: Intl.DateTimeFormatOptions;
}

export interface CompanyConfig {
  name: string;
  logo: string;
  website: string;
}

export interface AppSettings {
  currency: CurrencyConfig;
  dateFormat: DateFormatConfig;
  company: CompanyConfig;
}

export interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  reloadSettings: () => Promise<void>;
}

// Default settings (fallback if API fails)
const defaultSettings: AppSettings = {
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  dateFormat: {
    locale: 'en-US',
    options: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  },
  company: {
    name: 'Apyvyra',
    logo: '',
    website: 'https://apyvyra.com',
  },
};

// Create context
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// Provider component
export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.APP_SETTINGS.SETTINGS);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('App settings endpoint not found, using defaults');
          // Keep default settings, but continue to finally block
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const result = await response.json();
        
        if (result.data) {
          setSettings(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      }
    } catch (err) {
      console.error('Failed to load app settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const contextValue = useMemo(() => ({
    settings,
    loading,
    error,
    reloadSettings: loadSettings,
  }), [settings, loading, error, loadSettings]);

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// Hook to use app settings
export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  
  return context;
}

// Utility hooks for specific settings
export function useCurrency() {
  const { settings } = useAppSettings();
  return settings.currency;
}

export function useDateFormat() {
  const { settings } = useAppSettings();
  return settings.dateFormat;
}

export function useCompany() {
  const { settings } = useAppSettings();
  return settings.company;
}
