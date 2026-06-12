/**
 * Logo TATÁ Sushi — cubo isométrico dentro de hexágono (marca oficial).
 * Cor vem de `currentColor`.
 */
export function LogoTata({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="TATÁ Sushi"
      role="img"
    >
      {/* hexágono externo */}
      <polygon points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" />
      {/* cubo isométrico central */}
      <polygon points="50,26 71,38 71,62 50,74 29,62 29,38" />
      <line x1="29" y1="38" x2="50" y2="50" />
      <line x1="71" y1="38" x2="50" y2="50" />
      <line x1="50" y1="50" x2="50" y2="74" />
      {/* diamante de encaixe no topo */}
      <polygon points="50,12 59,17.5 50,23 41,17.5" />
      {/* apoios inferiores ligando o cubo ao hexágono */}
      <polyline points="29,62 38,75 50,74 62,75 71,62" />
    </svg>
  );
}
