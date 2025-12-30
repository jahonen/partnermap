import { useQuery } from '@tanstack/react-query'

import { useAuth } from '../providers/AuthProvider/auth-context.js'
import { fetchCompanyContext } from './use-company-context.js'

export function useUserCompanyContext() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['companyContext', user?.uid],
    queryFn: () => fetchCompanyContext({ userId: user.uid }),
    enabled: Boolean(user?.uid),
    staleTime: 30_000,
  })
}
