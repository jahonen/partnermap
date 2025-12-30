import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { useUiStrings } from '../../content/use-ui-strings.js'
import { firebaseAuth, firestoreDb } from '../../firebase/firebase.js'
import { useAuth } from '../../providers/AuthProvider/auth-context.js'
import { useLanguage } from '../../providers/LanguageProvider/language-context.js'
import styles from './AppHeader.module.scss'

const languageOptions = [
  { value: 'en', label: 'EN' },
  { value: 'fi', label: 'FI' },
  { value: 'sv', label: 'SV' },
  { value: 'el', label: 'EL' },
  { value: 'de', label: 'DE' },
  { value: 'fr', label: 'FR' },
  { value: 'es', label: 'ES' },
]

export default function AppHeader() {
  const { language, setLanguage } = useLanguage()
  const { user, isAuthLoading } = useAuth()
  const ui = useUiStrings()

  async function onSignOut() {
    if (!firebaseAuth) {
      return
    }
    await signOut(firebaseAuth)
  }

  async function onChangeLanguage(nextLanguage) {
    setLanguage(nextLanguage)
    if (!firestoreDb) {
      return
    }
    if (!user?.uid) {
      return
    }
    const userRef = doc(firestoreDb, 'users', user.uid)
    await setDoc(userRef, {
      language: nextLanguage,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} to="/">
          <img
            className={styles.logoMark}
            src="/Partnermap_by_Outkomia_logo.png"
            alt="Outkomia Partnership Mapping"
          />
          <div className={styles.brandText}>
            <div className={styles.title}>Outkomia</div>
            <div className={styles.subtitle}>Partnership Mapping</div>
          </div>
        </Link>

        <div className={styles.actions}>
          <label className={styles.langLabel}>
            <span className={styles.langText}>{ui?.languageLabel || 'Language'}</span>
            <select
              className={styles.langSelect}
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
              aria-label="Language"
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {!isAuthLoading && user ? (
            <button className={styles.link} type="button" onClick={onSignOut}>
              {ui?.signOut || 'Log out'}
            </button>
          ) : (
            <Link className={styles.link} to="/login">
              {ui?.login || 'Login'}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
