import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect } from 'react'

import { useAuth } from '../providers/AuthProvider/auth-context.js'
import { firestoreDb } from '../firebase/firebase.js'
import { useUserCompanyContext } from './use-user-company-context.js'
import { createComment, deleteComment, fetchComments } from './comments.js'

export function useComments() {
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useQuery({
    queryKey: ['comments', companyId],
    queryFn: () => fetchComments({ companyId }),
    enabled: Boolean(companyId),
    staleTime: 5_000,
  })
}

export function useCommentsRealtime() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  const queryRes = useQuery({
    queryKey: ['comments', companyId],
    queryFn: () => fetchComments({ companyId }),
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
    const ref = collection(firestoreDb, 'companies', companyId, 'comments')
    const q = query(ref, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      queryClient.setQueryData(['comments', companyId], list)
    })
    return () => unsub()
  }, [companyId, queryClient])

  return queryRes
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: companyCtx } = useUserCompanyContext()

  const companyId = companyCtx?.companyId || ''
  const userId = user?.uid || ''
  const userName = companyCtx?.participant?.name || user?.email || 'Participant'

  return useMutation({
    mutationFn: ({ domain, text }) => createComment({ companyId, domain, userId, userName, text }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments', companyId] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  const { data: companyCtx } = useUserCompanyContext()
  const companyId = companyCtx?.companyId || ''

  return useMutation({
    mutationFn: ({ commentId }) => deleteComment({ companyId, commentId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments', companyId] })
    },
  })
}
