import { m } from 'framer-motion'
import { useMemo, useState } from 'react'

import styles from './LandingWheel.module.scss'

void m

const domains = [
  'Equity Ownership',
  'Capital Contribution',
  'Time/Effort Expectation',
  'Compensation Structure',
  'Profit Distribution',
  'Decision Authority',
  'Voting Control',
  'Exit Mechanism',
]

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

export default function LandingWheel({ onSpin }) {
  const size = 520
  const center = size / 2
  const innerRadius = 86
  const outerRadius = 240
  const sliceAngle = 360 / domains.length

  const [spinTurns, setSpinTurns] = useState(0)

  const slices = useMemo(() => {
    return domains.map((name, i) => {
      const startAngle = i * sliceAngle
      const endAngle = startAngle + sliceAngle
      const midAngle = startAngle + sliceAngle / 2
      const labelPos = polarToCartesian(center, center, innerRadius + 58, midAngle)
      const fillAlpha = i % 2 === 0 ? 0.06 : 0.12
      const isEquityOwnership = i === 0

      return {
        key: name,
        name,
        path: createSlicePath(center, center, startAngle, endAngle, innerRadius, outerRadius),
        label: {
          x: labelPos.x,
          y: labelPos.y,
        },
        fill: isEquityOwnership ? 'rgba(232, 98, 52, 0.22)' : `rgba(44, 53, 57, ${fillAlpha})`,
      }
    })
  }, [center, innerRadius, outerRadius, sliceAngle])

  function handleSpin() {
    const nextStep = Math.floor(Math.random() * domains.length)
    const extraTurns = 2
    const nextTurns = spinTurns + extraTurns + nextStep / domains.length
    setSpinTurns(nextTurns)
    onSpin?.()
  }

  return (
    <button className={styles.wheelButton} type="button" onClick={handleSpin} aria-label="Spin the wheel">
      <div className={styles.wheelFrame}>
        <svg className={styles.svg} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
          <m.g
            style={{ originX: `${center}px`, originY: `${center}px` }}
            animate={{ rotate: 360 * spinTurns }}
            transition={{ type: 'spring', stiffness: 50, damping: 12 }}
          >
            {slices.map((slice) => (
              <g key={slice.key}>
                <path
                  d={slice.path}
                  fill={slice.fill}
                  stroke="rgba(44, 53, 57, 0.18)"
                  strokeWidth="1"
                />
                <text
                  x={slice.label.x}
                  y={slice.label.y}
                  className={styles.domainLabel}
                >
                  {slice.name}
                </text>
              </g>
            ))}
          </m.g>

          <circle
            cx={center}
            cy={center}
            r={innerRadius - 6}
            fill="#ffffff"
            stroke="rgba(107, 45, 62, 0.8)"
            strokeWidth="2"
          />
          <text x={center} y={center - 6} className={styles.centerText}>
            PARTNERSHIP
          </text>
          <text x={center} y={center + 14} className={styles.centerText}>
            MAPPING
          </text>
        </svg>
      </div>
    </button>
  )
}
