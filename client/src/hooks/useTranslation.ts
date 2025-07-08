import { useLanguage } from '@/contexts/LanguageContext';

// Custom hook for easier translation usage
export const useTranslation = () => {
  const { t, language, isRTL } = useLanguage();
  
  // Helper function to get nested translation keys
  const translate = (key: string, fallback?: string): string => {
    const result = t(key);
    return result !== key ? result : (fallback || key);
  };

  return {
    t: translate,
    language,
    isRTL
  };
};