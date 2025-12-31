import AppFooter from '../AppFooter/AppFooter.jsx'
import AppHeader from '../AppHeader/AppHeader.jsx'
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs.jsx'
import CookieConsentBanner from '../CookieConsentBanner/CookieConsentBanner.jsx'
import styles from './AppLayout.module.scss'

export default function AppLayout({ children }) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <Breadcrumbs />
      <div className={styles.main}>{children}</div>
      <AppFooter />
      <CookieConsentBanner />
    </div>
  )
}
