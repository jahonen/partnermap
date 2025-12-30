import { collection, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

export async function fetchCompanyResponses({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = collection(firestoreDb, 'companies', companyId, 'responses')
  const snap = await getDocs(ref)

  return snap.docs.map((d) => ({ userId: d.id, ...d.data() }))
}
