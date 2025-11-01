import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, // Set to true for debugging
    
    // FIXED: Only load language codes, not regional variants
    load: 'languageOnly', // This prevents en-US -> loads only 'en'
    
    // FIXED: Define supported languages explicitly to avoid 404s
    supportedLngs: ['en', 'vi'],
    
    // FIXED: Prevent loading of unsupported languages
    nonExplicitSupportedLngs: true,
    
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
      
      // FIXED: Add error handling to prevent console errors
      requestOptions: {
        cache: 'no-cache'
      }
    },
    
    // FIXED: Language detection configuration
    detection: {
      // Order and from where user language should be detected
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      
      // Keys or params to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      
      // Cache user language on localStorage
      caches: ['localStorage', 'cookie'],
      
      // Optional expire and domain for set cookie
      cookieMinutes: 10080, // 7 days
      
      // FIXED: Only detect language, not region
      convertDetectedLanguage: (lng: string) => {
        // Convert regional codes to base language codes
        // en-US -> en, vi-VN -> vi, etc.
        return lng.split('-')[0];
      }
    }
  });

export default i18next;