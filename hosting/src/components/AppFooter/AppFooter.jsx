import styles from './AppFooter.module.scss'

export default function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.text}>Partnership Mapping copyright 2025-2026 by NxtStride Finland Oy. All rights reserved.</div>
        <div className={styles.links}>
          <a
            href="https://opensource.org/licenses/BSD-3-Clause"
            target="_blank"
            rel="noopener"
            className={styles.badgeLink}
            aria-label="License: BSD 3-Clause"
          >
            <img
              className={styles.badge}
              src="https://img.shields.io/badge/License-BSD%203--Clause-blue.svg"
              alt="License: BSD 3-Clause"
            />
          </a>
          <a
            href="https://fazier.com"
            target="_blank"
            rel="noopener"
            className={styles.fazierLink}
            aria-label="Fazier"
          >
            <img
              className={styles.fazierBadge}
              src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=neutral"
              width={120}
              alt="Fazier badge"
            />
          </a>
          <a href="/privacypolicy" className={styles.privacyLink}>
            Privacy Policy
          </a>
          <a href="https://github.com/jahonen/partnermap" target="_blank" rel="noopener" className={styles.githubLink}>
            GitHub
          </a>
        </div>
        <a href="https://nxtstride.com" target="_blank" rel="noopener" className={styles.nxtStrideLink}>
          <img className={styles.nxtStrideLogo} src="/Provided_by_Nxtstride.com-cutout.png" alt="Provided by NxtStride" />
        </a>
      </div>
    </footer>
  )
}
