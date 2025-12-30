import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { firebaseAuth } from '../../firebase/firebase.js'
import styles from './ResetPasswordPage.module.scss'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim())
      setMessage('If an account exists for this email, a password reset link has been sent.')
    } catch (err) {
      setError(err?.message || 'Failed to send password reset email')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Reset password</h1>
      <p className={styles.note}>Enter your email and we’ll send you a reset link.</p>

      <form className={styles.form} onSubmit={onSubmit}>
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

        {message ? <div className={styles.message}>{message}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}

        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset email'}
        </button>

        <div className={styles.backRow}>
          <Link className={styles.link} to="/login">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  )
}
