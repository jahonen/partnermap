import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { firebaseAuth, firestoreDb } from '../../firebase/firebase.js'
import { AuthContext } from './auth-context.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    if (!firebaseAuth) {
      setUser(null)
      setIsAuthLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setIsAuthLoading(false)

      if (nextUser?.uid && firestoreDb) {
        const userRef = doc(firestoreDb, 'users', nextUser.uid)
        setDoc(userRef, {
          email: nextUser.email || '',
          name: nextUser.displayName || '',
          updatedAt: serverTimestamp(),
        }, { merge: true }).catch(() => {})
      }
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo(() => ({ user, isAuthLoading }), [user, isAuthLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
