import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { firebaseAuth, firebaseFunctions } from '../../firebase/firebase.js'
import { useUserCompanyContext } from '../../data/use-user-company-context.js'
import { useAuth } from '../../providers/AuthProvider/auth-context.js'
import { fetchCompanyContext } from '../../data/use-company-context.js'
import styles from './RegisterPage.module.scss'

export default function RegisterPage() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: companyCtx, isLoading: isCompanyCtxLoading, error: companyCtxError } = useUserCompanyContext()

  const initialMode = useMemo(() => {
    return inviteCode ? 'join' : 'create'
  }, [inviteCode])

  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [code, setCode] = useState(inviteCode || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (inviteCode) {
      setMode('join')
      setCode(inviteCode)
    }
  }, [inviteCode])

  useEffect(() => {
    if (!user) {
      return
    }
    if (isCompanyCtxLoading) {
      return
    }
    if (companyCtx?.companyId) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, companyCtx?.companyId, isCompanyCtxLoading, navigate])

  useEffect(() => {
    if (!user) {
      return
    }
    if (user.displayName && !fullName) {
      setFullName(user.displayName)
    }
    if (user.email && !email) {
      setEmail(user.email)
    }
  }, [user, fullName, email])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!firebaseAuth || !firebaseFunctions) {
        throw new Error('Firebase is not configured')
      }

      const isLoggedIn = Boolean(user)

      if (!isLoggedIn) {
        const userCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          email.trim(),
          password,
        )

        const createdUser = userCredential.user
        if (!createdUser) {
          throw new Error('Account creation failed')
        }
      }

      if (mode === 'create') {
        const createCompany = httpsCallable(firebaseFunctions, 'createCompany')
        const result = await createCompany({ companyName, userName: fullName })

        if (isLoggedIn && result?.data?.companyId && user?.uid) {
          queryClient.setQueryData(['companyContext', user.uid], (prev) => ({
            ...(prev || {}),
            companyId: result.data.companyId,
          }))
        }
      } else {
        const joinCompany = httpsCallable(firebaseFunctions, 'joinCompany')
        const result = await joinCompany({ inviteCode: code, userName: fullName })

        if (isLoggedIn && result?.data?.companyId && user?.uid) {
          queryClient.setQueryData(['companyContext', user.uid], (prev) => ({
            ...(prev || {}),
            companyId: result.data.companyId,
          }))
        }
      }

      if (!isLoggedIn) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const continueUrl = origin ? `${origin}/verify-email` : 'https://partnership-mapping.web.app/verify-email'
        await sendEmailVerification(firebaseAuth.currentUser, {
          url: continueUrl,
          handleCodeInApp: true,
        })
        navigate('/verify-email', { replace: true })
        return
      }

      if (user?.uid) {
        await queryClient.invalidateQueries({ queryKey: ['companyContext', user.uid] })
        await queryClient.refetchQueries({ queryKey: ['companyContext', user.uid] })

        const ctx = queryClient.getQueryData(['companyContext', user.uid])
        if (!ctx?.companyId) {
          const fresh = await fetchCompanyContext({ userId: user.uid })
          queryClient.setQueryData(['companyContext', user.uid], fresh)
        }
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err?.code === 'auth/operation-not-allowed') {
        setError(
          'Email/password sign-up is disabled for this Firebase project. Enable Authentication → Sign-in method → Email/Password in the Firebase Console, or use Google Sign-In.',
        )
      } else {
        setError(err?.message || 'Registration failed')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Register</h1>

      {user ? (
        <div className={styles.note}>
          You are signed in as {user.email || 'current user'}. Create or join a company to continue.
        </div>
      ) : null}

      {user && isCompanyCtxLoading ? (
        <div className={styles.note}>Checking company…</div>
      ) : null}

      {user && companyCtxError ? (
        <div className={styles.error}>{companyCtxError?.message || 'Failed to load company context'}</div>
      ) : null}

      <div className={styles.modeRow}>
        <button
          type="button"
          className={mode === 'join' ? styles.modeButtonActive : styles.modeButton}
          onClick={() => setMode('join')}
          disabled={Boolean(inviteCode)}
        >
          Join with invite code
        </button>
        <button
          type="button"
          className={mode === 'create' ? styles.modeButtonActive : styles.modeButton}
          onClick={() => setMode('create')}
        >
          Create a new company
        </button>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        {mode === 'join' ? (
          <label className={styles.label}>
            Invite code
            <input
              className={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              inputMode="text"
              required
            />
          </label>
        ) : (
          <label className={styles.label}>
            Company name
            <input
              className={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="organization"
              required
            />
          </label>
        )}

        <label className={styles.label}>
          Full name
          <input
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>

        {!user ? (
          <>
            <label className={styles.label}>
              Email
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          </>
        ) : null}

        {error ? <div className={styles.error}>{error}</div> : null}

        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? (user ? 'Saving…' : 'Creating account…') : (user ? 'Continue' : 'Create account')}
        </button>
      </form>
    </div>
  )
}
