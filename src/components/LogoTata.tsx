/**
 * Logo TATÁ Sushi — marca geométrica (hexágono com "tartaruga": cabeça
 * hexagonal, pilares laterais e cauda em X). Cor vem de `currentColor`.
 */
export function LogoTata({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.3"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-label="TATÁ Sushi"
      role="img"
    >
      {/* hexágono externo */}
      <polygon points="50,11 84,31.5 84,68.5 50,89 16,68.5 16,31.5" />
      {/* hexágono central */}
      <polygon points="50,34 65,43.5 65,59.5 50,69 35,59.5 35,43.5" />
      {/* cabeça (hexágono pequeno no topo) */}
      <polygon points="50,15 55,18 55,24 50,27 45,24 45,18" />
      {/* pescoço */}
      <line x1="45" y1="24" x2="50" y2="34" />
      <line x1="55" y1="24" x2="50" y2="34" />
      {/* braços para os pilares */}
      <line x1="45" y1="20" x2="25" y2="38" />
      <line x1="55" y1="20" x2="75" y2="38" />
      {/* pilares laterais */}
      <polygon points="24,38 30,41.5 30,58.5 24,55" />
      <polygon points="76,38 70,41.5 70,58.5 76,55" />
      {/* conectores pilar → centro */}
      <line x1="30" y1="44" x2="35" y2="46" />
      <line x1="70" y1="44" x2="65" y2="46" />
      {/* cauda em X */}
      <line x1="35" y1="59.5" x2="60" y2="78.5" />
      <line x1="65" y1="59.5" x2="40" y2="78.5" />
    </svg>
  );
}
