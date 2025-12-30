import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'

import { firestoreDb } from '../firebase/firebase.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { fetchInvites } from './use-invites.js'

export function useInvitesRealtime() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  const queryRes = useQuery({
    queryKey: ['invites', companyId],
    queryFn: () => fetchInvites({ companyId }),
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

    const ref = collection(firestoreDb, 'companies', companyId, 'invites')
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      queryClient.setQueryData(['invites', companyId], data)
    })

    return () => unsub()
  }, [companyId, queryClient])

  return queryRes
}
