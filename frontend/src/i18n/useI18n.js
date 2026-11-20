import en from './en.json';
import tl from './tl.json';
import taglish from './taglish.json';

const translations = { en, tl, taglish };

export function translate(lang, key, values = {}) {
  const dictionary = translations[lang] ?? en;
  const hasTranslation = Object.prototype.hasOwnProperty.call(dictionary, key);
  if (!hasTranslation && import.meta.env.DEV) {
    console.warn(`Missing "${lang}" translation for "${key}"; falling back to English.`);
  }
  const template = hasTranslation ? dictionary[key] : en[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

export function htmlLanguage(lang) {
  return lang === 'en' ? 'en' : 'fil';
}
