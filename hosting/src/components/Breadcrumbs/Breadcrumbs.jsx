import { Link, useLocation } from 'react-router-dom'

import { useUiStrings } from '../../content/use-ui-strings.js'
import { useAuth } from '../../providers/AuthProvider/auth-context.js'
import styles from './Breadcrumbs.module.scss'

function labelForPathSegment(segment, ui) {
  if (segment === 'dashboard') return ui?.dashboardTitle || 'Dashboard'
  if (segment === 'assess') return ui?.assessmentTitle || 'Assessment'
  if (segment === 'review') return ui?.reviewTitle || 'Review'
  if (segment === 'final') return ui?.finalTitle || 'Final'
  if (segment === 'login') return ui?.login || 'Login'
  if (segment === 'register') return 'Register'
  return segment
}

export default function Breadcrumbs() {
  const location = useLocation()
  const ui = useUiStrings()
  const { user, isAuthLoading } = useAuth()

  const parts = location.pathname.split('/').filter(Boolean)

  const isAuthed = Boolean(user) && !isAuthLoading
  const isPublic = ['login', 'register', 'reset-password', 'verify-email'].includes(parts[0] || '')

  const crumbs = []

  if (isAuthed && !isPublic) {
    crumbs.push({ to: '/dashboard', label: 'Home' })
    crumbs.push({ to: '/dashboard', label: ui?.dashboardTitle || 'Dashboard' })
    if (parts[0] && parts[0] !== 'dashboard') {
      crumbs.push({ to: location.pathname, label: labelForPathSegment(parts[0], ui) })
    }
  } else {
    const base = parts.length ? `/${parts[0]}` : '/'
    crumbs.push({ to: '/', label: 'Home' })
    if (parts.length) {
      crumbs.push({ to: base, label: labelForPathSegment(parts[0], ui) })
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {crumbs.map((c, idx) => (
          <span key={c.to} className={styles.crumb}>
            {idx === crumbs.length - 1 ? (
              <span className={styles.current}>{c.label}</span>
            ) : (
              <Link className={styles.link} to={c.to}>
                {c.label}
              </Link>
            )}
            {idx < crumbs.length - 1 ? <span className={styles.sep}>/</span> : null}
          </span>
        ))}
      </div>
    </div>
  )
}
