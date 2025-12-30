import { useEffect, useMemo, useState } from 'react'

import { LanguageContext } from './language-context.js'

const defaultLanguage = 'en'
const storageKey = 'outkomia_language'

export default function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(defaultLanguage)

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored) {
      setLanguage(stored)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(storageKey, language)
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
