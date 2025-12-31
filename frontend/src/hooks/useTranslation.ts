import { useState, useEffect, useCallback } from 'react';
import { fetchTranslations, translate } from '../services/translationService';

interface UseTranslationResult {
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Record<string, string>;
  loading: boolean;
  error: string | null;
}

export function useTranslation(component: string): UseTranslationResult {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTranslations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTranslations(component);
        if (mounted) {
          setTranslations(data);
        }
      } catch (err) {
        if (mounted) {
          setError(`Failed to load translations for ${component}`);
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      mounted = false;
    };
  }, [component]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(translations, key, params);
    },
    [translations]
  );

  return { t, translations, loading, error };
}

// Hook for loading multiple translation components at once
export function useMultipleTranslations(components: string[]): {
  t: (component: string, key: string, params?: Record<string, string | number>) => string;
  translations: Record<string, Record<string, string>>;
  loading: boolean;
  error: string | null;
} {
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAllTranslations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await Promise.all(
          components.map(async (component) => {
            const data = await fetchTranslations(component);
            return { component, data };
          })
        );

        if (mounted) {
          const translationsMap: Record<string, Record<string, string>> = {};
          results.forEach(({ component, data }) => {
            translationsMap[component] = data;
          });
          setTranslations(translationsMap);
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load translations');
          console.error(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAllTranslations();

    return () => {
      mounted = false;
    };
  }, [components.join(',')]);

  const t = useCallback(
    (component: string, key: string, params?: Record<string, string | number>): string => {
      const componentTranslations = translations[component] || {};
      return translate(componentTranslations, key, params);
    },
    [translations]
  );

  return { t, translations, loading, error };
}

export default useTranslation;
