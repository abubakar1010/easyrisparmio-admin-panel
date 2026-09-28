import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import it from './locales/it.json';
import auditEn from './locales/audit.en.json';
import auditIt from './locales/audit.it.json';
import apiErrorsEn from './locales/api-errors.en.json';
import apiErrorsIt from './locales/api-errors.it.json';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import 'dayjs/locale/en-gb';

// Italian first: Italian is the default for new sessions and the fallback for any
// missing key. English is only used when the admin explicitly switches to it.
export const DEFAULT_LANGUAGE = 'it';
export const LANGUAGE_STORAGE_KEY = 'dashboard_language';

type Language = 'it' | 'en';

export const normalizeLanguage = (language?: string | null): Language =>
  language?.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANGUAGE;

const readSavedLanguage = (): Language => {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const applyLanguage = (language: string) => {
  const code = normalizeLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Storage can be unavailable (private mode); the in-memory language still applies.
  }
  document.documentElement.lang = code;
  dayjs.locale(code === 'en' ? 'en-gb' : 'it');
};

i18n.on('languageChanged', applyLanguage);

const initialLanguage = readSavedLanguage();

i18n.use(initReactI18next).init({
  resources: {
    it: { translation: { ...it, audit: auditIt, api_errors: apiErrorsIt } },
    en: { translation: { ...en, audit: auditEn, api_errors: apiErrorsEn } },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ['it', 'en'],
  interpolation: {
    escapeValue: false,
  },
});

// `languageChanged` does not fire for the initial language, so apply it once here.
applyLanguage(initialLanguage);

/** The active dashboard language, always `it` unless English was chosen explicitly. */
export const currentLanguage = (): Language => normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);

export default i18n;
