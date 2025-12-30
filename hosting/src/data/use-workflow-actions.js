import { useMutation, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase/firebase.js'
import { useUserCompanyContext } from './use-user-company-context.js'

function requireFunctions() {
  if (!firebaseFunctions) {
    throw new Error('Firebase is not configured')
  }
  return firebaseFunctions
}

export function useWorkflowActions() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''

  return useMutation({
    mutationFn: async ({ action, payload }) => {
      if (!companyId) {
        throw new Error('companyId is required')
      }
      const fn = httpsCallable(requireFunctions(), 'generateBlueprint')
      const res = await fn({ companyId, action, ...(payload || {}) })
      return res?.data || null
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workflowState', companyId] })
      await queryClient.invalidateQueries({ queryKey: ['blueprint', companyId] })
      await queryClient.invalidateQueries({ queryKey: ['acceptance', companyId] })
      await queryClient.invalidateQueries({ queryKey: ['comments', companyId] })
      await queryClient.invalidateQueries({ queryKey: ['invites', companyId] })
      await queryClient.invalidateQueries({ queryKey: ['participants', companyId] })
    },
  })
}
