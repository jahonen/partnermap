import { useMemo } from 'react'

import styles from './ReviewProgressWheel.module.scss'

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function createSlicePath(centerX, centerY, startAngle, endAngle, innerR, outerR) {
  const start = polarToCartesian(centerX, centerY, outerR, endAngle)
  const end = polarToCartesian(centerX, centerY, outerR, startAngle)
  const innerStart = polarToCartesian(centerX, centerY, innerR, endAngle)
  const innerEnd = polarToCartesian(centerX, centerY, innerR, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M',
    start.x,
    start.y,
    'A',
    outerR,
    outerR,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'L',
    innerEnd.x,
    innerEnd.y,
    'A',
    innerR,
    innerR,
    0,
    largeArcFlag,
    1,
    innerStart.x,
    innerStart.y,
    'Z',
  ].join(' ')
}

export default function ReviewProgressWheel({ domainKeys, completedKeys, currentKey, onSelectKey, onHoverKey }) {
  const size = 220
  const center = size / 2
  const innerRadius = 44
  const outerRadius = 104
  const sliceAngle = domainKeys?.length ? 360 / domainKeys.length : 45

  const completedSet = useMemo(() => {
    return new Set(completedKeys || [])
  }, [completedKeys])

  const slices = useMemo(() => {
    const keys = domainKeys || []
    return keys.map((key, i) => {
      const startAngle = i * sliceAngle
      const endAngle = startAngle + sliceAngle
      const isCompleted = completedSet.has(key)
      const isCurrent = key === currentKey
      return {
        key,
        path: createSlicePath(center, center, startAngle, endAngle, innerRadius, outerRadius),
        isCompleted,
        isCurrent,
      }
    })
  }, [center, completedSet, currentKey, domainKeys, innerRadius, outerRadius, sliceAngle])

  return (
    <div className={styles.shell}>
      <svg className={styles.svg} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Review progress">
        {slices.map((slice) => (
          <path
            key={slice.key}
            d={slice.path}
            className={slice.isCompleted ? styles.sliceCompleted : styles.slice}
            stroke={slice.isCurrent ? 'rgba(107, 45, 62, 0.9)' : 'rgba(44, 53, 57, 0.18)'}
            strokeWidth={slice.isCurrent ? 2 : 1}
            role={onSelectKey ? 'button' : undefined}
            tabIndex={onSelectKey ? 0 : undefined}
            onMouseEnter={
              onHoverKey
                ? () => {
                    onHoverKey(slice.key)
                  }
                : undefined
            }
            onMouseLeave={
              onHoverKey
                ? () => {
                    onHoverKey(null)
                  }
                : undefined
            }
            onFocus={
              onHoverKey
                ? () => {
                    onHoverKey(slice.key)
                  }
                : undefined
            }
            onBlur={
              onHoverKey
                ? () => {
                    onHoverKey(null)
                  }
                : undefined
            }
            onClick={
              onSelectKey
                ? () => {
                    onSelectKey(slice.key)
                  }
                : undefined
            }
            onKeyDown={
              onSelectKey
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectKey(slice.key)
                    }
                  }
                : undefined
            }
          />
        ))}
        <circle
          cx={center}
          cy={center}
          r={innerRadius - 4}
          fill="#ffffff"
          stroke="rgba(44, 53, 57, 0.12)"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
