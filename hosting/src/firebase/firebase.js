import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingFirebaseConfigKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k)

export const hasFirebaseConfig = missingFirebaseConfigKeys.length === 0
export const firebaseConfigErrorDetails = missingFirebaseConfigKeys.length
  ? `Missing Firebase config keys: ${missingFirebaseConfigKeys.join(', ')}`
  : ''

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const firestoreDb = firebaseApp ? getFirestore(firebaseApp) : null
export const firebaseFunctions = firebaseApp ? getFunctions(firebaseApp, 'europe-west1') : null
