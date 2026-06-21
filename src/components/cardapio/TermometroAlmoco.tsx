'use client';

/* =====================================================================
   Termômetro do Almoço — painel em tempo real da satisfação do dia:
   - Placar geral (bom/ok/ruim) dos votos coletados no /avaliar hoje
   - Tendência dos últimos 30 min: alerta se ≥35% negativos com ≥3 votos
   - Atualiza sozinho a cada 30 s; botão para forçar atualização
   Fica oculto se ainda não há votos no dia.
   ===================================================================== */

import { useState, useEffect, useCallback } from 'react';
import { lerVotosDia } from '@/lib/cardapio/termometro';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

function hojeIdx(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function horaMinAgora(): number {
  const t = new Date();
  return t.getHours() * 60 + t.getMinutes();
}

export function TermometroAlmoco({ estado }: { estado: EstadoSemana }) {
  const [votos, setVotos] = useState(() => lerVotosDia());
  const [horaAtualiz, setHoraAtualiz] = useState('');

  const atualizar = useCallback(() => {
    setVotos(lerVotosDia());
    const t = new Date();
    setHoraAtualiz(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    atualizar();
    const id = setInterval(atualizar, 30_000);
    return () => clearInterval(id);
  }, [atualizar]);

  const di = hojeIdx();
  const prato = estado.dias[di]?.principal;

  if (!prato || votos.length === 0) return null;

  const bom = votos.filter((v) => v.voto === 'bom').length;
  const ok = votos.filter((v) => v.voto === 'ok').length;
  const ruim = votos.filter((v) => v.voto === 'ruim').length;
  const total = votos.length;

  const agora = horaMinAgora();
  const janela = votos.filter((v) => agora - v.horaMin >= 0 && agora - v.horaMin <= 30);
  const ruimRecente = janela.filter((v) => v.voto === 'ruim').length;
  const taxaRuimRecente = janela.length >= 3 ? ruimRecente / janela.length : 0;
  const alerta = taxaRuimRecente >= 0.35;

  const barBom = total > 0 ? `${Math.round((bom / total) * 100)}%` : '0%';
  const barOk = total > 0 ? `${Math.round((ok / total) * 100)}%` : '0%';
  const barRuim = total > 0 ? `${Math.round((ruim / total) * 100)}%` : '0%';

  return (
    <div
      className={`space-y-3 rounded-2xl p-4 ring-1 ${
        alerta
          ? 'bg-perigo/10 ring-perigo/30'
          : 'bg-brand-500/8 ring-brand-400/20'
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-caption font-extrabold uppercase tracking-[0.2em] ${
            alerta ? 'text-perigo' : 'text-brand-600 dark:text-brand-300'
          }`}
        >
          🌡️ Termômetro do almoço
        </p>
        <button
          type="button"
          onClick={atualizar}
          className="text-micro font-bold text-carvao-400 hover:text-carvao-600 dark:hover:text-areia-200"
          aria-label="Atualizar"
        >
          ↺ {horaAtualiz}
        </button>
      </div>

      {/* Alerta de tendência negativa */}
      {alerta && (
        <div className="flex items-start gap-2 rounded-xl bg-perigo/10 px-3 py-2.5 ring-1 ring-perigo/25">
          <span aria-hidden className="mt-0.5 text-base">⚠️</span>
          <p className="text-sm font-bold text-perigo">
            {Math.round(taxaRuimRecente * 100)}% de "Não gostei" nos últimos 30 min ({janela.length} votos) — verifique o prato antes do próximo serviço
          </p>
        </div>
      )}

      {/* Placar */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-brand-500/10 py-2.5">
          <p className="font-display text-xl font-black text-brand-600 dark:text-brand-300">{bom}</p>
          <p className="text-caption font-bold text-brand-600 dark:text-brand-400">😋 Gostei</p>
        </div>
        <div className="rounded-xl bg-ouro-400/10 py-2.5">
          <p className="font-display text-xl font-black text-ouro-600 dark:text-ouro-300">{ok}</p>
          <p className="text-caption font-bold text-ouro-600 dark:text-ouro-400">😐 Ok</p>
        </div>
        <div className="rounded-xl bg-perigo/10 py-2.5">
          <p className="font-display text-xl font-black text-perigo">{ruim}</p>
          <p className="text-caption font-bold text-perigo">👎 Não gostei</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="flex items-center gap-3">
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-800">
          <div className="bg-brand-500 transition-all duration-500" style={{ width: barBom }} />
          <div className="bg-ouro-400 transition-all duration-500" style={{ width: barOk }} />
          <div className="bg-perigo transition-all duration-500" style={{ width: barRuim }} />
        </div>
        <p className="text-xs font-semibold tabular-nums text-carvao-400">{total} votos</p>
      </div>

      {/* Janela dos últimos 30 min */}
      {janela.length > 0 && (
        <p className="text-caption text-carvao-400">
          Últimos 30 min:{' '}
          <span className="font-semibold text-brand-600 dark:text-brand-300">{janela.filter((v) => v.voto === 'bom').length} 😋</span>
          {' · '}
          <span className="font-semibold text-ouro-600">{janela.filter((v) => v.voto === 'ok').length} 😐</span>
          {' · '}
          <span className="font-semibold text-perigo">{ruimRecente} 👎</span>
          {' '}({janela.length} votos)
        </p>
      )}
    </div>
  );
}
