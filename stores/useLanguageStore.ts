
import { create } from 'zustand';
import { Language, translations } from '../utils/i18n';
import { dbService } from '../services/db';

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: 'en', // Default start, will be updated by App.tsx from DB
  
  setLang: async (lang: Language) => {
      set({ lang });
      await dbService.setSetting('language', lang);
  },

  t: (key: string, params?: Record<string, string | number>) => {
      const currentLang = get().lang;
      let text = translations[currentLang][key] || translations['en'][key] || key;
      
      if (params) {
          Object.entries(params).forEach(([k, v]) => {
              text = text.replace(`{${k}}`, String(v));
          });
      }
      return text;
  }
}));
