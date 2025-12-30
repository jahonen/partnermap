import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

export async function fetchMyApproval({ companyId, userId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }
  if (!userId) {
    throw new Error('userId is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'approvals', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function saveMyApproval({ companyId, userId, approved }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }
  if (!userId) {
    throw new Error('userId is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'approvals', userId)
  await setDoc(
    ref,
    {
      approved: Boolean(approved),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function fetchApprovals({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = collection(firestoreDb, 'companies', companyId, 'approvals')
  const snap = await getDocs(ref)
  return snap.docs.map((d) => ({ userId: d.id, ...d.data() }))
}
