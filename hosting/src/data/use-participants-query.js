import { useQuery } from '@tanstack/react-query'

import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchParticipants } from './use-participants.js'

export function useParticipants() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['participants', companyId],
    queryFn: () => fetchParticipants({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 10_000,
  })
}
