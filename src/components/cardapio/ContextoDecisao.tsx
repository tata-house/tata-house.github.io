'use client';

import { useState } from 'react';
import { BottomSheet } from '@/components/ui';
import type { ContextoDecisao as TContexto, MotivoDecisao } from '@/lib/cardapio/tipos';

const MOTIVOS: { valor: MotivoDecisao; rotulo: string; icone: string }[] = [
  { valor: 'preco_subiu',     rotulo: 'Preço subiu',      icone: '📈' },
  { valor: 'preco_caiu',      rotulo: 'Preço caiu',       icone: '📉' },
  { valor: 'falta_estoque',   rotulo: 'Falta de estoque', icone: '📦' },
  { valor: 'qualidade_ruim',  rotulo: 'Qualidade ruim',   icone: '⚠️' },
  { valor: 'baixa_aceitacao', rotulo: 'Baixa aceitação',  icone: '👎' },
  { valor: 'sazonalidade',    rotulo: 'Sazonalidade',     icone: '📅' },
  { valor: 'variedade',       rotulo: 'Variedade',        icone: '🔄' },
  { valor: 'outro',           rotulo: 'Outro motivo',     icone: '💬' },
];

export interface DialogoContextoProps {
  aberto: boolean;
  titulo?: string;
  fechar: () => void;
  onConfirmar: (contexto: TContexto) => void;
}

export function DialogoContexto({ aberto, titulo, fechar, onConfirmar }: DialogoContextoProps) {
  const [motivo, setMotivo] = useState<MotivoDecisao | null>(null);
  const [obs, setObs] = useState('');

  const confirmar = () => {
    if (!motivo) return;
    onConfirmar({ motivo, obs: obs.trim() || undefined });
    setMotivo(null);
    setObs('');
    fechar();
  };

  const pular = () => {
    setMotivo(null);
    setObs('');
    fechar();
  };

  return (
    <BottomSheet aberto={aberto} aoFechar={pular} titulo={titulo ?? 'Por que essa mudança?'}>
      <div className="space-y-3 px-5 pb-6">
        <p className="text-xs text-carvao-500 dark:text-areia-400">
          Registrar o motivo ajuda a aprender com as decisões e melhorar recomendações futuras.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {MOTIVOS.map((m) => (
            <button
              key={m.valor}
              onClick={() => setMotivo(m.valor)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left transition ring-1 ${
                motivo === m.valor
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : 'bg-areia-100 text-carvao-700 ring-carvao-200 hover:bg-areia-200 dark:bg-carvao-700 dark:text-areia-100 dark:ring-carvao-600'
              }`}
            >
              <span className="text-base leading-none">{m.icone}</span>
              <span className="text-xs font-semibold">{m.rotulo}</span>
            </button>
          ))}
        </div>

        {motivo === 'outro' && (
          <textarea
            rows={2}
            placeholder="Descreva o motivo…"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            className="w-full rounded-xl border border-carvao-200 bg-white px-3 py-2 text-sm dark:border-carvao-600 dark:bg-carvao-900 dark:text-areia-100"
          />
        )}

        <button
          onClick={confirmar}
          disabled={!motivo}
          className="w-full rounded-2xl bg-brand-600 py-3 text-sm font-bold text-white transition disabled:opacity-40"
        >
          Confirmar motivo
        </button>
        <button
          onClick={pular}
          className="w-full py-2 text-sm text-carvao-400 hover:text-carvao-600"
        >
          Pular por agora
        </button>
      </div>
    </BottomSheet>
  );
}
