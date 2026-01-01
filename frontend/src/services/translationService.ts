import { API_ENDPOINTS } from '../config/api';

// Cache for translations
const translationCache: Map<string, Record<string, string>> = new Map();
let currentLanguage: string = 'en-US';

// Fetch the current language from the backend
export async function fetchLanguage(): Promise<string> {
  if (currentLanguage !== 'en-US') {
    return currentLanguage;
  }

  try {
    const response = await fetch(API_ENDPOINTS.TRANSLATION.LANGUAGE);
    if (response.ok) {
      const data = await response.json();
      currentLanguage = data.data?.language || 'en-US';
      return currentLanguage;
    }
  } catch (error) {
    console.error('Failed to fetch language:', error);
  }
  
  return currentLanguage;
}

// Fetch translations for a specific component
export async function fetchTranslations(component: string): Promise<Record<string, string>> {
  // Check cache first
  if (translationCache.has(component)) {
    console.log(`Returning cached translations for ${component}:`, translationCache.get(component));
    return translationCache.get(component)!;
  }

  try {
    console.log(`Fetching translations for ${component} from:`, API_ENDPOINTS.TRANSLATION.GET(component));
    const response = await fetch(API_ENDPOINTS.TRANSLATION.GET(component));
    console.log(`Response status:`, response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Raw response data:`, data);
      const translations = data.data || {};
      console.log(`Extracted translations for ${component}:`, translations);
      translationCache.set(component, translations);
      return translations;
    } else {
      console.error(`Failed to fetch translations. Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to fetch translations for ${component}:`, error);
  }

  // Fallback: Try to load from local JSON file if backend is not available
  try {
    console.log(`Trying fallback to local JSON for ${component}`);
    const response = await fetch(`/translations/${component}.json`);
    if (response.ok) {
      const translations = await response.json();
      console.log(`Loaded local translations for ${component}:`, translations);
      translationCache.set(component, translations);
      return translations;
    }
  } catch (error) {
    console.error(`Failed to load local translations for ${component}:`, error);
  }

  // Return empty object if all attempts fail
  console.log(`No translations found for ${component}, returning empty object`);
  translationCache.set(component, {});
  return {};
}

// Get a specific translation with optional parameter substitution
export function translate(
  translations: Record<string, string>,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = translations[key] || key;
  
  console.log(`Translating key "${key}":`, {
    availableKeys: Object.keys(translations),
    foundValue: translations[key],
    fallback: key,
    finalText: text
  });
  
  // Replace parameters like {name} with actual values
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    });
  }
  
  return text;
}

// Clear the translation cache (useful for language changes)
export function clearTranslationCache(): void {
  translationCache.clear();
  currentLanguage = 'en-US';
}

// Preload multiple components at once
export async function preloadTranslations(components: string[]): Promise<void> {
  await Promise.all(components.map(component => fetchTranslations(component)));
}

// Export the translation service
export const translationService = {
  fetchLanguage,
  fetchTranslations,
  translate,
  clearTranslationCache,
  preloadTranslations,
};
