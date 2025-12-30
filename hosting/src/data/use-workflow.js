import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'

import { useAuth } from '../providers/AuthProvider/auth-context.js'
import { firestoreDb } from '../firebase/firebase.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchAcceptance, fetchBlueprint, fetchWorkflowState } from './workflow.js'

export function useWorkflowState() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  const queryRes = useQuery({
    queryKey: ['workflowState', companyId],
    queryFn: () => fetchWorkflowState({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 5_000,
  })

  useEffect(() => {
    if (!companyId) {
      return
    }
    if (!firestoreDb) {
      return
    }
    const ref = doc(firestoreDb, 'companies', companyId, 'workflow', 'state')
    const unsub = onSnapshot(ref, (snap) => {
      queryClient.setQueryData(['workflowState', companyId], snap.exists() ? snap.data() : null)
    })
    return () => unsub()
  }, [companyId, queryClient])

  return queryRes
}

export function useBlueprintRealtime() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  const queryRes = useQuery({
    queryKey: ['blueprint', companyId],
    queryFn: () => fetchBlueprint({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 5_000,
  })

  useEffect(() => {
    if (!companyId) {
      return
    }
    if (!firestoreDb) {
      return
    }
    const ref = doc(firestoreDb, 'companies', companyId, 'blueprint', 'current')
    const unsub = onSnapshot(ref, (snap) => {
      queryClient.setQueryData(['blueprint', companyId], snap.exists() ? snap.data() : null)
    })
    return () => unsub()
  }, [companyId, queryClient])

  return queryRes
}

export function useBlueprint() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['blueprint', companyId],
    queryFn: () => fetchBlueprint({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 5_000,
  })
}

export function useAcceptance() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['acceptance', companyId],
    queryFn: () => fetchAcceptance({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 3_000,
  })
}

export function useMyAcceptance() {
  const { user } = useAuth()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''
  const userId = user?.uid || ''

  return useQuery({
    queryKey: ['myAcceptance', companyId, userId],
    queryFn: async () => {
      const all = await fetchAcceptance({ companyId })
      return all.find((a) => a.userId === userId) || null
    },
    enabled: Boolean(companyId && userId),
    staleTime: 3_000,
  })
}
