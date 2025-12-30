import { collectionGroup, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore'

import { firestoreDb } from '../firebase/firebase.js'

async function resolveFromCompanyId({ companyId, userId }) {
  const participantRef = doc(firestoreDb, 'companies', companyId, 'participants', userId)
  const participantSnap = await getDoc(participantRef)
  if (!participantSnap.exists()) {
    return { companyId: '', company: null, participant: null }
  }

  const companyRef = doc(firestoreDb, 'companies', companyId)
  let companySnap
  try {
    companySnap = await getDoc(companyRef)
  } catch {
    return { companyId, company: null, participant: participantSnap.data() }
  }

  return {
    companyId,
    company: companySnap.exists() ? { id: companySnap.id, ...companySnap.data() } : null,
    participant: participantSnap.data(),
  }
}

export async function fetchCompanyContext({ userId }) {
  if (!firestoreDb) {
    throw new Error('Firestore is not configured')
  }
  if (!userId) {
    throw new Error('userId is required')
  }

  const userRef = doc(firestoreDb, 'users', userId)
  const userSnap = await getDoc(userRef)
  const activeCompanyId = userSnap.exists() ? (userSnap.data()?.activeCompanyId || '') : ''

  if (activeCompanyId) {
    const resolved = await resolveFromCompanyId({ companyId: activeCompanyId, userId })
    if (resolved.companyId) {
      return resolved
    }
  }

  const participantsQuery = query(
    collectionGroup(firestoreDb, 'participants'),
    where('userId', '==', userId),
    limit(1),
  )

  const participantSnap = await getDocs(participantsQuery)
  const participantDoc = participantSnap.docs[0]

  if (!participantDoc) {
    return { companyId: '', company: null, participant: null }
  }

  const companyId = participantDoc.ref.parent.parent?.id || ''
  if (!companyId) {
    return { companyId: '', company: null, participant: participantDoc.data() }
  }

  const backfilled = await resolveFromCompanyId({ companyId, userId })

  try {
    // best-effort backfill
    // users/{uid} rules allow self write
    await setDoc(userRef, { activeCompanyId: companyId }, { merge: true })
  } catch {
    // ignore
  }

  return {
    companyId,
    company: backfilled.company,
    participant: backfilled.participant || participantDoc.data(),
  }
}
