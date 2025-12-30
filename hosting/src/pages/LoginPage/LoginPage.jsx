import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { firebaseAuth } from '../../firebase/firebase.js'
import { useAuth } from '../../providers/AuthProvider/auth-context.js'
import styles from './LoginPage.module.scss'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      navigate(fromPath, { replace: true })
    }
  }, [user, fromPath, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!firebaseAuth) {
        throw new Error('Firebase is not configured')
      }
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
      navigate(fromPath, { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
      setIsSubmitting(false)
    }
  }

  async function onGoogleSignIn() {
    setError('')
    setIsSubmitting(true)

    try {
      if (!firebaseAuth) {
        throw new Error('Firebase is not configured')
      }
      const provider = new GoogleAuthProvider()
      await signInWithPopup(firebaseAuth, provider)
      navigate(fromPath, { replace: true })
    } catch (err) {
      setError(err?.message || 'Google sign-in failed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Login</h1>
      <p className={styles.note}>Use the credentials you registered with via your invite.</p>

      <form className={styles.form} onSubmit={onSubmit}>
        <button className={styles.secondaryButton} type="button" onClick={onGoogleSignIn} disabled={isSubmitting}>
          Continue with Google
        </button>

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
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <div className={styles.error}>{error}</div> : null}

        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className={styles.footerRow}>
          <Link className={styles.link} to="/reset-password">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  )
}
