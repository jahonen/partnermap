import { useEffect, useState } from 'react'

import styles from './CookieConsentBanner.module.scss'

const storageKey = 'pm_cookie_consent_v1'

function setAnalyticsConsent(isGranted) {
  if (typeof window === 'undefined') {
    return
  }
  if (typeof window.gtag !== 'function') {
    return
  }

  window.gtag('consent', 'update', {
    analytics_storage: isGranted ? 'granted' : 'denied',
  })
}

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'accepted') {
      setAnalyticsConsent(true)
      setIsVisible(false)
      return
    }
    if (stored === 'rejected') {
      setAnalyticsConsent(false)
      setIsVisible(false)
      return
    }

    setAnalyticsConsent(false)
    setIsVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(storageKey, 'accepted')
    setAnalyticsConsent(true)
    setIsVisible(false)
  }

  function reject() {
    localStorage.setItem(storageKey, 'rejected')
    setAnalyticsConsent(false)
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={styles.wrap} role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className={styles.card}>
        <div className={styles.text}>
          We use cookies for basic analytics (Google Analytics) to understand general traffic. We do not use cookies for
          advertising.
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryButton} type="button" onClick={reject}>
            Reject
          </button>
          <button className={styles.primaryButton} type="button" onClick={accept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
