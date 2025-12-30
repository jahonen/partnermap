import styles from './AppFooter.module.scss'

export default function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.text}>Partnership Mapping copyright 2025-2026 by NxtStride Finland Oy. All rights reserved.</div>
        <a href="https://nxtstride.com" target="_blank" rel="noopener" className={styles.nxtStrideLink}>
          <img className={styles.nxtStrideLogo} src="/Provided_by_Nxtstride.com-cutout.png" alt="Provided by NxtStride" />
        </a>
      </div>
    </footer>
  )
}
