import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

export async function fetchComments({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = collection(firestoreDb, 'companies', companyId, 'comments')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createComment({ companyId, domain, userId, userName, text }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }
  if (!domain) {
    throw new Error('domain is required')
  }
  if (!userId) {
    throw new Error('userId is required')
  }
  if (!userName) {
    throw new Error('userName is required')
  }
  if (!text || typeof text !== 'string') {
    throw new Error('text is required')
  }

  const ref = collection(firestoreDb, 'companies', companyId, 'comments')
  await addDoc(ref, {
    domain,
    userId,
    userName,
    text: text.trim().slice(0, 500),
    createdAt: serverTimestamp(),
  })
}

export async function deleteComment({ companyId, commentId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }
  if (!commentId) {
    throw new Error('commentId is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'comments', commentId)
  await deleteDoc(ref)
}
