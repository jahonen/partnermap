import { useQuery } from '@tanstack/react-query'

import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchInvites } from './use-invites.js'

export function useInvites() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['invites', companyId],
    queryFn: () => fetchInvites({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 10_000,
  })
}
