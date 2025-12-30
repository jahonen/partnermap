import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../providers/AuthProvider/auth-context.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchUserResponses, saveUserResponses } from './responses.js'

export function useUserResponses() {
  const { user } = useAuth()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''
  const userId = user?.uid || ''

  return useQuery({
    queryKey: ['responses', companyId, userId],
    queryFn: () => fetchUserResponses({ companyId, userId }),
    enabled: Boolean(companyId && userId),
    staleTime: 10_000,
  })
}

export function useSaveUserResponses() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''
  const userId = user?.uid || ''

  return useMutation({
    mutationFn: ({ domains }) => saveUserResponses({ companyId, userId, domains }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['responses', companyId, userId] })
    },
  })
}
