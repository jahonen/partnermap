import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

export async function fetchUserResponses({ companyId, userId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }
  if (!userId) {
    throw new Error('userId is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'responses', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function saveUserResponses({ companyId, userId, domains }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }
  if (!userId) {
    throw new Error('userId is required')
  }
  if (!domains || typeof domains !== 'object') {
    throw new Error('domains map is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'responses', userId)
  await setDoc(
    ref,
    {
      domains,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
