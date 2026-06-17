import React from "react";

interface SealProps {
  size?: number;
  color?: string;
  ink?: string;
  rotate?: number;
  distressed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

let _sealCounter = 0;

export function Seal({
  size = 160,
  color = "var(--brass-700)",
  ink = "var(--ink-900)",
  rotate = -3,
  distressed = true,
  className = "",
  style = {},
}: SealProps) {
  const uid = React.useRef(`seal${++_sealCounter}`).current;
  const top = `top-${uid}`;
  const bottom = `bottom-${uid}`;
  const bandR = 86;
  const innerR = 72;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 220 220"
      role="img"
      aria-label="Signuture seal"
      style={{ transform: `rotate(${rotate}deg)`, flexShrink: 0, ...style }}
    >
      <defs>
        <path id={top} d={`M 110,110 m -${bandR},0 a ${bandR},${bandR} 0 1,1 ${bandR * 2},0`} fill="none" />
        <path id={bottom} d={`M 110,110 m ${bandR},0 a ${bandR},${bandR} 0 1,1 -${bandR * 2},0`} fill="none" />
        {distressed && (
          <filter id={`rough-${uid}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={1.1} />
          </filter>
        )}
      </defs>

      <g filter={distressed ? `url(#rough-${uid})` : undefined}>
        <circle cx="110" cy="110" r="105" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <circle cx="110" cy="110" r="98" fill="none" stroke={color} strokeWidth="3" />
        <circle cx="110" cy="110" r={innerR} fill="none" stroke={color} strokeWidth="1.25" opacity="0.85" />

        <text fill={color} style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.13em" }}>
          <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
            CRAFTED AROUND WHO YOU ARE
          </textPath>
        </text>
        <text fill={color} style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.13em" }}>
          <textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">
            SIGNED FOR WHO YOU&apos;LL BECOME
          </textPath>
        </text>

        <text x="20" y="115" fill={color} style={{ fontSize: "13px" }} textAnchor="middle">✦</text>
        <text x="200" y="115" fill={color} style={{ fontSize: "13px" }} textAnchor="middle">✦</text>

        <text x="110" y="92" textAnchor="middle" fill={color} style={{ fontSize: "10px" }}>✦</text>
        <text x="110" y="122" textAnchor="middle" fill={ink}
          style={{ fontFamily: "var(--font-script)", fontSize: "34px" }}>
          Signuture
        </text>
        <line x1="90" y1="136" x2="130" y2="136" stroke={color} strokeWidth="1.25" opacity="0.85" />
      </g>
    </svg>
  );
}
