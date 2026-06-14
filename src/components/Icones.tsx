/* =====================================================================
   Set de ícones da casa — traço único, 24×24, herda a cor (currentColor).
   Sem dependência externa: unidade visual e bundle zero. Usado nos
   controles (navegação, steppers, botões); emojis seguem só no conteúdo
   com personalidade da marca.
   ===================================================================== */

import type { ReactNode, SVGProps } from 'react';

export type NomeIcone =
  | 'painel'
  | 'cardapio'
  | 'compras'
  | 'insights'
  | 'mais'
  | 'anterior'
  | 'proximo'
  | 'baixo'
  | 'imagem'
  | 'usuario'
  | 'fechar'
  | 'somar'
  | 'subtrair'
  | 'check'
  | 'alerta'
  | 'busca'
  | 'calendario'
  | 'raio';

const CAMINHOS: Record<NomeIcone, ReactNode> = {
  painel: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </>
  ),
  cardapio: (
    <>
      <path d="M5 3v7a2 2 0 0 0 4 0V3" />
      <path d="M7 10v11" />
      <path d="M17 3c-1.6 0-3 2-3 5s1.4 4 3 4v9" />
    </>
  ),
  compras: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </>
  ),
  insights: (
    <>
      <path d="M4 20V11" />
      <path d="M10 20V4" />
      <path d="M16 20v-6" />
      <path d="M21 20H3" />
    </>
  ),
  mais: (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
  anterior: <path d="M15 6l-6 6 6 6" />,
  proximo: <path d="M9 6l6 6-6 6" />,
  baixo: <path d="M6 9l6 6 6-6" />,
  imagem: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5L5 21" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  somar: <path d="M12 5v14M5 12h14" />,
  subtrair: <path d="M5 12h14" />,
  check: <path d="M5 13l4 4L19 7" />,
  alerta: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  raio: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
};

export function Icone({
  nome,
  tam = 22,
  className = '',
  ...props
}: { nome: NomeIcone; tam?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tam}
      height={tam}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
