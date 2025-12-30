import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import { useUserCompanyContext } from '../../data/use-user-company-context.js'
import styles from './RequireCompany.module.scss'

export default function RequireCompany({ children }) {
  const location = useLocation()
  const { data, isLoading, error, refetch, isFetching } = useUserCompanyContext()
  const hasRetriedRef = useRef(false)
  const [shouldRetry, setShouldRetry] = useState(false)

  useEffect(() => {
    if (!shouldRetry) {
      return
    }

    Promise.resolve(refetch()).finally(() => setShouldRetry(false))
  }, [shouldRetry, refetch])

  if (isLoading) {
    return <div className={styles.loading} />
  }

  if (isFetching || shouldRetry) {
    return <div className={styles.loading} />
  }

  if (error) {
    return <Navigate to="/register" replace state={{ from: location }} />
  }

  if (!data?.companyId) {
    if (!hasRetriedRef.current) {
      hasRetriedRef.current = true
      setShouldRetry(true)
      return <div className={styles.loading} />
    }

    return <Navigate to="/register" replace state={{ from: location }} />
  }

  return children
}
