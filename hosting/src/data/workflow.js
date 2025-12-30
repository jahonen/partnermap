import { collection, doc, getDoc, getDocs } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

export async function fetchWorkflowState({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'workflow', 'state')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function fetchBlueprint({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = doc(firestoreDb, 'companies', companyId, 'blueprint', 'current')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function fetchAcceptance({ companyId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!companyId) {
    throw new Error('companyId is required')
  }

  const ref = collection(firestoreDb, 'companies', companyId, 'acceptance')
  const snap = await getDocs(ref)
  return snap.docs.map((d) => ({ userId: d.id, ...d.data() }))
}
