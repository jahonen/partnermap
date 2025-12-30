import { useMemo } from 'react'

import { getDomainContent } from './get-domain-content.js'
import { useLanguage } from '../providers/LanguageProvider/language-context.js'

export function useDomainContent() {
  const { language } = useLanguage()

  return useMemo(() => {
    return getDomainContent(language)
  }, [language])
}
