import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

export async function fetchInvites({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = collection(firestoreDb, 'companies', companyId, 'invites')
  const snap = await getDocs(ref)

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
