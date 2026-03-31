/**
 * QuroLogo — SVG brand mark
 * The "Q" letterform with the Soft Apricot accent
 */

interface QuroLogoProps {
  size?: number;
  className?: string;
}

export function QuroLogo({ size = 40, className }: QuroLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Quro logo"
    >
      {/* Background rounded square */}
      <rect width="40" height="40" rx="11" fill="#FFA488" />

      {/* Stylized "Q" */}
      <circle
        cx="20"
        cy="19"
        r="9"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />
      {/* Q tail */}
      <line
        x1="26"
        y1="25"
        x2="31"
        y2="31"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
