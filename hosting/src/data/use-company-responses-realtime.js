import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'

import { firestoreDb } from '../firebase/firebase.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchCompanyResponses } from './use-company-responses.js'

export function useCompanyResponsesRealtime() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  const queryRes = useQuery({
    queryKey: ['companyResponses', companyId],
    queryFn: () => fetchCompanyResponses({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 10_000,
  })

  useEffect(() => {
    if (!companyId) {
      return
    }
    if (!firestoreDb) {
      return
    }

    const ref = collection(firestoreDb, 'companies', companyId, 'responses')
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => ({ userId: d.id, ...d.data() }))
      queryClient.setQueryData(['companyResponses', companyId], data)
    })

    return () => unsub()
  }, [companyId, queryClient])

  return queryRes
}
