export function BasketIcon({
  size = 32,
  color = '#111111',
  className = '',
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      fill={color}
      className={className}
      aria-hidden="true"
    >
      {/* Basket body */}
      <path d="M 10,44 L 70,44 L 64,74 Q 54,78 40,78 Q 26,78 16,74 Z" />
      {/* Rim */}
      <path d="M 8,41 L 72,41 Q 74,41 74,44 Q 74,47 72,47 L 8,47 Q 6,47 6,44 Q 6,41 8,41 Z" />
      {/* Bottle (left) */}
      <path d="M 18,44 L 18,37 Q 18,32 21,30 L 21,24 Q 21,19 24,19 Q 27,19 27,24 L 27,30 Q 30,32 30,37 L 30,44 Z" />
      {/* Apple (center) */}
      <circle cx="40" cy="34" r="10" />
      {/* Stem */}
      <rect x="39" y="22" width="2.5" height="4.5" rx="1.25" />
      {/* Leaf */}
      <path d="M 40.5,23.5 C 43,19 48,20 47,23.5 C 45,25 41.5,24.5 40.5,23.5 Z" />
      {/* Bread/loaf (right) */}
      <path d="M 50,44 L 50,36 Q 50,23 58,23 Q 66,23 66,36 L 66,44 Z" />
    </svg>
  )
}

export function Logo({
  height = 40,
  className = '',
}: {
  height?: number
  className?: string
}) {
  const width = (height * 230) / 60
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 230 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Empresa de Cestas"
    >
      {/* Icon */}
      <svg x="0" y="0" width="60" height="60" viewBox="0 0 80 80" fill="#111111">
        <path d="M 10,44 L 70,44 L 64,74 Q 54,78 40,78 Q 26,78 16,74 Z" />
        <path d="M 8,41 L 72,41 Q 74,41 74,44 Q 74,47 72,47 L 8,47 Q 6,47 6,44 Q 6,41 8,41 Z" />
        <path d="M 18,44 L 18,37 Q 18,32 21,30 L 21,24 Q 21,19 24,19 Q 27,19 27,24 L 27,30 Q 30,32 30,37 L 30,44 Z" />
        <circle cx="40" cy="34" r="10" />
        <rect x="39" y="22" width="2.5" height="4.5" rx="1.25" />
        <path d="M 40.5,23.5 C 43,19 48,20 47,23.5 C 45,25 41.5,24.5 40.5,23.5 Z" />
        <path d="M 50,44 L 50,36 Q 50,23 58,23 Q 66,23 66,36 L 66,44 Z" />
      </svg>
      {/* "EMPRESA DE" — orange */}
      <text
        x="68"
        y="23"
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="13"
        fill="#FF6B00"
        letterSpacing="2.5"
      >
        EMPRESA DE
      </text>
      {/* "CESTAS" — black */}
      <text
        x="67"
        y="52"
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#111111"
        letterSpacing="1"
      >
        CESTAS
      </text>
    </svg>
  )
}
