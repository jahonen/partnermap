import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'

import { firestoreDb } from '../firebase/firebase.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchAcceptance } from './workflow.js'

export function useAcceptanceRealtime() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  const queryRes = useQuery({
    queryKey: ['acceptance', companyId],
    queryFn: () => fetchAcceptance({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 3_000,
  })

  useEffect(() => {
    if (!companyId) {
      return
    }
    if (!firestoreDb) {
      return
    }

    const ref = collection(firestoreDb, 'companies', companyId, 'acceptance')
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => ({ userId: d.id, ...d.data() }))
      queryClient.setQueryData(['acceptance', companyId], data)
    })

    return () => unsub()
  }, [companyId, queryClient])

  return queryRes
}
