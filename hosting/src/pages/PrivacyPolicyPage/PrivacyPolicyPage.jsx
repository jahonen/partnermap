import styles from './PrivacyPolicyPage.module.scss'

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: 31 Dec 2025</p>

      <h2 className={styles.h2}>Who we are</h2>
      <p className={styles.p}>
        Partnership Mapping is operated by NxtStride Finland Oy (Helsinki, Finland).
      </p>
      <p className={styles.p}>
        If you have questions about privacy or want to exercise your data protection rights, contact our Data Protection
        Officer at{' '}
        <a className={styles.link} href="mailto:dpo@nxtstride.com">
          dpo@nxtstride.com
        </a>
        .
      </p>

      <h2 className={styles.h2}>What data we collect</h2>
      <p className={styles.p}>We only collect the data needed to provide the service:</p>
      <ul className={styles.ul}>
        <li className={styles.li}>
          Account data: your email address and display name (to let you sign in and collaborate).
        </li>
        <li className={styles.li}>
          Collaboration data: your company/workspace participation, your mapping responses, comments, and approvals.
        </li>
        <li className={styles.li}>
          Basic operational metadata: timestamps such as when you joined, last activity time, and reminder timestamps.
        </li>
      </ul>

      <h2 className={styles.h2}>How we use your data</h2>
      <ul className={styles.ul}>
        <li className={styles.li}>To run the Partnership Mapping workflow and show results to your team.</li>
        <li className={styles.li}>To send essential service emails (invites, reminders, workflow notifications).</li>
        <li className={styles.li}>To maintain security, prevent abuse, and troubleshoot issues.</li>
      </ul>
      <p className={styles.p}>
        We do not use your data for marketing purposes. NxtStride Finland Oy and Outkomia Agency do not sell your data and
        do not share it with third parties for advertising.
      </p>

      <h2 className={styles.h2}>Third parties</h2>
      <ul className={styles.ul}>
        <li className={styles.li}>
          Google Analytics (GA4) for aggregated traffic measurement. We use it only for general traffic monitoring and not
          for advertising.
        </li>
        <li className={styles.li}>
          Firebase (Google) for hosting, authentication, and database infrastructure.
        </li>
        <li className={styles.li}>
          SendGrid for sending essential service emails.
        </li>
      </ul>

      <h2 className={styles.h2}>Cookies and analytics</h2>
      <p className={styles.p}>
        We use a minimal cookie consent banner. Analytics cookies are only enabled after you consent. You can change your
        choice by clearing your site data in your browser.
      </p>

      <h2 className={styles.h2}>Data retention</h2>
      <p className={styles.p}>
        We retain data for as long as needed to provide the service to your team and meet legal/operational requirements.
        You can request deletion by contacting{' '}
        <a className={styles.link} href="mailto:dpo@nxtstride.com">
          dpo@nxtstride.com
        </a>
        .
      </p>

      <h2 className={styles.h2}>Your rights</h2>
      <p className={styles.p}>
        Depending on your situation, you may have the right to access, correct, delete, or restrict processing of your
        personal data, and to object to processing.
      </p>
    </div>
  )
}
