import { useI18n } from '../modules/i18n/useI18n.js'

// The language selector swaps the local interface dictionary.
export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  return (
    <label className="language-control">
      <span className="sr-only">{t('language.label')}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)}>
        <option value="en">{t('language.english')}</option>
        <option value="tl">{t('language.tagalog')}</option>
        <option value="taglish">{t('language.taglish')}</option>
      </select>
    </label>
  )
}
