/** The auth screens' iL mark + wordmark lockup (SVG so it can take white ink on the dark panel). */
const LAVENDER = "#9b8ce8";

export function BrandLogo({ size = 32, ink }: { size?: number; ink: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round(size * 4.15)}
      height={size}
      viewBox="0 0 190 44"
      role="img"
      aria-label="ilovelawyer"
    >
      <g transform="translate(0, 4)">
        <rect x="1.5" y="1.5" width="33" height="33" rx="5" ry="5" fill="none" stroke={LAVENDER} strokeWidth="1.5" />
        <text
          x="18"
          y="24.5"
          textAnchor="middle"
          fill={ink}
          style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 400 }}
        >
          iL
        </text>
      </g>
      <text x="44" y="22" fill={ink} style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 400 }}>
        ilovelawyer
      </text>
      <text
        x="44"
        y="36"
        fill={ink}
        opacity={0.85}
        style={{ fontFamily: "var(--font-sans)", fontSize: "7.5px", fontWeight: 500, letterSpacing: "0.22em" }}
      >
        LEGAL INTELLIGENCE
      </text>
    </svg>
  );
}
