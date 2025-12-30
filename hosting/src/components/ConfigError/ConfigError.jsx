import styles from './ConfigError.module.scss'

export default function ConfigError({ title, details }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>{title}</div>
        <div className={styles.details}>{details}</div>
      </div>
    </div>
  )
}
