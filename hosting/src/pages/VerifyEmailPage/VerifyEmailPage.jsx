import { sendEmailVerification, signOut } from 'firebase/auth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { firebaseAuth } from '../../firebase/firebase.js'
import { useAuth } from '../../providers/AuthProvider/auth-context.js'
import styles from './VerifyEmailPage.module.scss'

export default function VerifyEmailPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isSending, setIsSending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const email = user?.email || ''

  async function onResend() {
    if (!user) {
      return
    }

    setError('')
    setMessage('')
    setIsSending(true)

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const continueUrl = origin ? `${origin}/verify-email` : 'https://partnership-mapping.web.app/verify-email'
      await sendEmailVerification(user, {
        url: continueUrl,
        handleCodeInApp: true,
      })
      setMessage('Verification email sent.')
    } catch (err) {
      setError(err?.message || 'Failed to send verification email')
    } finally {
      setIsSending(false)
    }
  }

  async function onIHaveVerified() {
    if (!user) {
      return
    }

    setError('')
    setMessage('')
    setIsChecking(true)

    try {
      await user.reload()
      const refreshed = firebaseAuth?.currentUser
      if (refreshed?.emailVerified) {
        navigate('/dashboard', { replace: true })
        return
      }

      setError('Still not verified. Please check your email and try again.')
    } catch (err) {
      setError(err?.message || 'Failed to refresh verification status')
    } finally {
      setIsChecking(false)
    }
  }

  async function onSignOut() {
    if (!firebaseAuth) {
      return
    }
    await signOut(firebaseAuth)
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Verify your email</h1>
      <p className={styles.note}>
        We sent a verification email to <span className={styles.email}>{email || '(unknown email)'}</span>.
      </p>

      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" onClick={onIHaveVerified} disabled={isChecking}>
          {isChecking ? 'Checking…' : "I've verified"}
        </button>
        <button className={styles.secondaryButton} type="button" onClick={onResend} disabled={isSending}>
          {isSending ? 'Sending…' : 'Resend email'}
        </button>
      </div>

      {message ? <div className={styles.message}>{message}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      <button className={styles.linkButton} type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  )
}
