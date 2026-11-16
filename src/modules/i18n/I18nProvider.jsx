import { useMemo, useState } from 'react'
import en from './en.json'
import tl from './tl.json'
import taglish from './taglish.json'
import { I18nContext } from './I18nContext.js'

const dictionaries = { en, tl, taglish }

// Provides the selected language and a small dot-path translation helper.
export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('en')
  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key) => key.split('.').reduce((entry, part) => entry?.[part], dictionaries[language]) ?? key,
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
