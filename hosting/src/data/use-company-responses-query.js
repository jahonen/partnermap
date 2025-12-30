import { useQuery } from '@tanstack/react-query'

import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchCompanyResponses } from './use-company-responses.js'

export function useCompanyResponses() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['companyResponses', companyId],
    queryFn: () => fetchCompanyResponses({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 10_000,
  })
}
