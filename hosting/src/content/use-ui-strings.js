import { useMemo } from 'react'

import { useDomainContent } from './use-domain-content.js'

export function useUiStrings() {
  const content = useDomainContent()

  return useMemo(() => {
    return content?.ui || {}
  }, [content])
}
