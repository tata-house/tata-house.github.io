/**
 * Logo TATÁ Sushi — gema/origami em hexágono, traço geométrico
 * (versão vetorial da marca usada nas artes). Cor vem de `currentColor`.
 */
export function LogoTata({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="TATÁ Sushi"
      role="img"
    >
      {/* diamante do topo */}
      <polygon points="50,2 64,13 50,24 36,13" />
      {/* hexágono externo */}
      <polygon points="50,10 88,31 88,71 50,94 12,71 12,31" />
      {/* facetas da gema */}
      <polyline points="12,31 50,46 88,31" />
      <polyline points="12,71 50,46 88,71" />
      <polyline points="28,80 50,46 72,80" />
      <line x1="50" y1="24" x2="50" y2="46" />
    </svg>
  );
}
