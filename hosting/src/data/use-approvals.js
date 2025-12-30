import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../providers/AuthProvider/auth-context.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchApprovals, fetchMyApproval, saveMyApproval } from './approvals.js'

export function useMyApproval() {
  const { user } = useAuth()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''
  const userId = user?.uid || ''

  return useQuery({
    queryKey: ['myApproval', companyId, userId],
    queryFn: () => fetchMyApproval({ companyId, userId }),
    enabled: Boolean(companyId && userId),
    staleTime: 5_000,
  })
}

export function useSaveMyApproval() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''
  const userId = user?.uid || ''

  return useMutation({
    mutationFn: ({ approved }) => saveMyApproval({ companyId, userId, approved }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myApproval', companyId, userId] })
      await queryClient.invalidateQueries({ queryKey: ['approvals', companyId] })
    },
  })
}

export function useApprovals() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['approvals', companyId],
    queryFn: () => fetchApprovals({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 5_000,
  })
}
