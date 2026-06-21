'use client';

export function BotaoBaixarManual() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex w-full items-center justify-center gap-2 rounded-2xl border border-[#1a5c3a]/30 bg-white px-6 py-3.5 text-sm font-bold text-[#1a5c3a] shadow-sm transition hover:bg-[#1a5c3a] hover:text-white active:scale-[0.98]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Baixar manual em PDF
    </button>
  );
}
