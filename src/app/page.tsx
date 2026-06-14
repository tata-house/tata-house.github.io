'use client';

import { useState } from 'react';
import { AlternadorTema } from '@/components/AlternadorTema';
import { BottomNav, GRUPOS } from '@/components/BottomNav';
import { ToastHost } from '@/components/Toast';
import { Icone } from '@/components/Icones';
import { BottomSheet, Skeleton } from '@/components/ui';
import { AbaAceitacao } from '@/components/cardapio/AbaAceitacao';
import { AbaAuditoria } from '@/components/cardapio/AbaAuditoria';
import { AbaCardapio } from '@/components/cardapio/AbaCardapio';
import { AbaCompras } from '@/components/cardapio/AbaCompras';
import { AbaCotacao } from '@/components/cardapio/AbaCotacao';
import { AbaDashboard } from '@/components/cardapio/AbaDashboard';
import { AbaDesperdicio } from '@/components/cardapio/AbaDesperdicio';
import { AbaEstoque } from '@/components/cardapio/AbaEstoque';
import { AbaFluxo } from '@/components/cardapio/AbaFluxo';
import { AbaPrecos } from '@/components/cardapio/AbaPrecos';
import { AbaRadar } from '@/components/cardapio/AbaRadar';
import { AbaSimulador } from '@/components/cardapio/AbaSimulador';
import { Assistente } from '@/components/cardapio/Assistente';
import { PosterSemana } from '@/components/cardapio/PosterSemana';
import {
  idSemanaIso,
  idsSemanas,
  periodoSemana,
  rotuloSemana,
  useAceitacao,
  useAprendizado,
  useDesperdicio,
  useEstoque,
  useEventos,
  useFornecedores,
  useHistoricoPrecos,
  useItensExtras,
  usePapel,
  usePrecos,
  useSemana,
} from '@/lib/cardapio/estado';
import { useLogo } from '@/lib/cardapio/logo';
import { PAPEIS, pode } from '@/lib/cardapio/org';
import type { Etapa, Papel } from '@/lib/cardapio/tipos';

const ABAS = [
  { id: 'painel', rotulo: '📊 Painel' },
  { id: 'cotacao', rotulo: '📋 Cotação' },
  { id: 'cardapio', rotulo: '🍽️ Cardápio' },
  { id: 'simulador', rotulo: '⚖️ Simulador' },
  { id: 'estoque', rotulo: '📦 Estoque' },
  { id: 'compras', rotulo: '🛒 Compras' },
  { id: 'fluxo', rotulo: '🚦 Acompanhar' },
  { id: 'desperdicio', rotulo: '♻️ Desperdício' },
  { id: 'aceitacao', rotulo: '👍 Aceitação' },
  { id: 'precos', rotulo: '💰 Preços' },
  { id: 'radar', rotulo: '📡 Radar' },
  { id: 'auditoria', rotulo: '🛡️ Auditoria' },
] as const;

type AbaId = (typeof ABAS)[number]['id'];

const ABA_LABEL: Record<string, string> = {
  painel: 'Painel',
  cotacao: 'Cotação',
  cardapio: 'Cardápio',
  simulador: 'Simulador',
  estoque: 'Estoque',
  compras: 'Compras',
  fluxo: 'Acompanhar',
  desperdicio: 'Desperdício',
  aceitacao: 'Aceitação',
  precos: 'Preços',
  radar: 'Radar',
  auditoria: 'Auditoria',
};

const ROTULO_ETAPA: Record<Etapa, string> = {
  rascunho: 'Rascunho',
  cozinha: 'Na cozinha',
  compras: 'Em compra',
  recebimento: 'Recebendo',
  concluido: 'Concluída',
};

const COR_ETAPA: Record<Etapa, string> = {
  rascunho: 'bg-carvao-400/10 text-carvao-500 ring-carvao-400/25',
  cozinha: 'bg-[#b07c1e]/10 text-[#9a6c17] ring-[#b07c1e]/25 dark:text-[#e3b45c]',
  compras: 'bg-[#2d6f8e]/10 text-[#2d6f8e] ring-[#2d6f8e]/25 dark:text-[#7cb8d4]',
  recebimento: 'bg-ouro-400/10 text-ouro-600 ring-ouro-400/25 dark:text-ouro-300',
  concluido: 'bg-brand-500/10 text-brand-600 ring-brand-500/25',
};

export default function PaginaCardapios() {
  const [semanaId, setSemanaId] = useState(() => idSemanaIso(new Date()));
  const [aba, setAba] = useState<AbaId>('painel');
  const [posterAberto, setPosterAberto] = useState(false);
  const [semanaSheet, setSemanaSheet] = useState(false);

  const { estado, atualizar, pronto } = useSemana(semanaId);
  const { precos, definirPreco } = usePrecos();
  const { fornecedores, definirFornecedor } = useFornecedores();
  const { itensExtras, cadastrarItem } = useItensExtras();
  const { fatores, aprenderDeSemana } = useAprendizado();
  const { papel, setPapel } = usePapel();
  const { logo } = useLogo();
  const { estoque, movimentar, definirMinimo, definirSaldo } = useEstoque();
  const { aceitacao, avaliar } = useAceitacao();
  const { eventos, adicionar: addEvento, remover: rmEvento } = useEventos();
  const { registros: desperdicio, adicionar: addDesperdicio, remover: rmDesperdicio } = useDesperdicio(semanaId);
  const historico = useHistoricoPrecos();

  const semanas = idsSemanas();
  const idxSemana = semanas.indexOf(semanaId);

  const grupoAtivo = GRUPOS.find((g) => g.abas.includes(aba)) ?? GRUPOS[0];
  const subAbas = grupoAtivo.abas;

  const irSemana = (delta: number) => {
    const i = idxSemana + delta;
    if (i >= 0 && i < semanas.length) setSemanaId(semanas[i]);
  };

  const podeEditarCardapio = pode(papel, 'cardapio:editar') && (estado.etapa === 'rascunho' || estado.etapa === 'cozinha');
  const podeEstoque = pode(papel, 'estoque:gerenciar');
  const podeAvaliar = pode(papel, 'cardapio:editar');

  if (posterAberto) {
    return <PosterSemana estado={estado} semanaId={semanaId} aoFechar={() => setPosterAberto(false)} />;
  }

  return (
    <>
      {/* Cabeçalho da marca */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-800 via-brand-600 to-brand-800 text-white shadow-media print:hidden">
        <div className="h-1 w-full bg-gradient-to-r from-ouro-600 via-ouro-300 to-ouro-600" />
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-10 w-auto max-w-[120px] shrink-0 object-contain" />
            ) : (
              <span className="h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-ouro-300 to-ouro-500" aria-hidden />
            )}
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-[17px] font-bold tracking-[0.18em] sm:text-[19px] sm:tracking-[0.26em]">
                TATÁ&nbsp;SUSHI
              </div>
              <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.3em] text-brand-200">
                Gestão de Alimentação
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="relative flex items-center">
              <span className="sr-only">Papel</span>
              <Icone nome="usuario" tam={15} className="pointer-events-none absolute left-2.5 text-white/70" />
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as Papel)}
                className="appearance-none rounded-full bg-white/15 py-1.5 pl-8 pr-7 text-xs font-semibold text-white ring-1 ring-white/25 focus:outline-none focus:ring-2 focus:ring-ouro-300"
              >
                {PAPEIS.map((p) => (
                  <option key={p.id} value={p.id} className="text-carvao-900">
                    {p.rotulo}
                  </option>
                ))}
              </select>
              <Icone nome="baixo" tam={14} className="pointer-events-none absolute right-2 text-white/70" />
            </label>
            <AlternadorTema />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pb-28 pt-5 lg:pb-8">
        {/* Cabeçalho do módulo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-800 dark:text-brand-300 sm:text-3xl">
              Semana {idxSemana >= 0 ? idxSemana + 1 : ''}
              <span
                className={`ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${COR_ETAPA[estado.etapa]}`}
              >
                {ROTULO_ETAPA[estado.etapa]}
              </span>
            </h1>
            <p className="text-sm font-semibold text-carvao-500 dark:text-carvao-300">
              📅 {periodoSemana(semanaId)} <span className="font-normal text-carvao-400">(segunda a domingo)</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Stepper de semana — navegação por polegar; toque no rótulo abre a lista */}
            <div className="flex items-center rounded-2xl border border-carvao-200 bg-white p-1 dark:border-carvao-600 dark:bg-carvao-900">
              <button
                onClick={() => irSemana(-1)}
                disabled={idxSemana <= 0}
                aria-label="Semana anterior"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-carvao-500 transition hover:bg-carvao-100 disabled:opacity-30 dark:hover:bg-carvao-800"
              >
                <Icone nome="anterior" tam={18} />
              </button>
              <button
                onClick={() => setSemanaSheet(true)}
                className="flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl px-1 py-1 text-sm font-bold transition hover:bg-carvao-100 dark:hover:bg-carvao-800"
              >
                <Icone nome="calendario" tam={15} className="text-carvao-400" />
                {idxSemana >= 0 ? `Semana ${idxSemana + 1}` : '—'}
              </button>
              <button
                onClick={() => irSemana(1)}
                disabled={idxSemana >= semanas.length - 1}
                aria-label="Próxima semana"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-carvao-500 transition hover:bg-carvao-100 disabled:opacity-30 dark:hover:bg-carvao-800"
              >
                <Icone nome="proximo" tam={18} />
              </button>
            </div>
            <button
              onClick={() => setPosterAberto(true)}
              className="flex h-11 min-h-11 items-center gap-1.5 whitespace-nowrap rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 text-sm font-bold text-white shadow-suave ring-1 ring-ouro-400/50 transition hover:from-brand-800 hover:to-brand-700"
            >
              <Icone nome="imagem" tam={18} /> <span className="hidden sm:inline">Pôster</span>
            </button>
          </div>
        </div>

        {/* Navegação completa — desktop */}
        <nav className="hidden gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-carvao-200 lg:flex dark:bg-carvao-800 dark:ring-carvao-600 print:hidden">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-[12px] font-bold tracking-tight transition ${
                aba === a.id
                  ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-suave'
                  : 'text-carvao-500 hover:bg-brand-50 hover:text-brand-700 dark:text-areia-200 dark:hover:bg-carvao-700'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </nav>

        {/* Sub-navegação da área — mobile */}
        {subAbas.length > 1 && (
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-carvao-100/70 p-1 lg:hidden dark:bg-carvao-800/70 print:hidden">
            {subAbas.map((id) => (
              <button
                key={id}
                onClick={() => setAba(id as AbaId)}
                className={`min-h-9 flex-1 whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition ${
                  aba === id
                    ? 'bg-white text-brand-700 shadow-suave dark:bg-carvao-700 dark:text-brand-300'
                    : 'text-carvao-500 dark:text-areia-200'
                }`}
              >
                {ABA_LABEL[id]}
              </button>
            ))}
          </div>
        )}

        {!pronto ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <>
            {aba === 'painel' && (
              <AbaDashboard
                estado={estado}
                semanaId={semanaId}
                precos={precos}
                fatores={fatores}
                estoque={estoque}
                historico={historico}
                aceitacao={aceitacao}
                fornecedores={fornecedores}
                irPara={(a) => setAba(a as AbaId)}
              />
            )}
            {aba === 'cotacao' && (
              <AbaCotacao
                definirPreco={definirPreco}
                definirFornecedor={definirFornecedor}
                cadastrarItem={cadastrarItem}
                itensExtras={itensExtras}
              />
            )}
            {aba === 'cardapio' && (
              <AbaCardapio
                estado={estado}
                atualizar={atualizar}
                podeEditar={podeEditarCardapio}
                precos={precos}
                definirPreco={definirPreco}
              />
            )}
            {aba === 'simulador' && (
              <AbaSimulador
                estado={estado}
                atualizar={atualizar}
                precos={precos}
                fatores={fatores}
                podeEditar={podeEditarCardapio}
              />
            )}
            {aba === 'estoque' && (
              <AbaEstoque
                estado={estado}
                fatores={fatores}
                estoque={estoque}
                movimentar={movimentar}
                definirMinimo={definirMinimo}
                definirSaldo={definirSaldo}
                podeEditar={podeEstoque}
              />
            )}
            {aba === 'compras' && (
              <AbaCompras
                estado={estado}
                atualizar={atualizar}
                papel={papel}
                precos={precos}
                fornecedores={fornecedores}
                fatores={fatores}
              />
            )}
            {aba === 'fluxo' && (
              <AbaFluxo
                estado={estado}
                atualizar={atualizar}
                papel={papel}
                precos={precos}
                fatores={fatores}
                aprenderDeSemana={aprenderDeSemana}
              />
            )}
            {aba === 'desperdicio' && (
              <AbaDesperdicio
                estado={estado}
                precos={precos}
                fatores={fatores}
                registros={desperdicio}
                adicionar={addDesperdicio}
                remover={rmDesperdicio}
                podeEditar={podeEstoque}
              />
            )}
            {aba === 'aceitacao' && (
              <AbaAceitacao
                estado={estado}
                aceitacao={aceitacao}
                avaliar={avaliar}
                eventos={eventos}
                addEvento={addEvento}
                rmEvento={rmEvento}
                desperdicio={desperdicio}
                podeEditar={podeAvaliar}
              />
            )}
            {aba === 'precos' && (
              <AbaPrecos
                precos={precos}
                definirPreco={definirPreco}
                fornecedores={fornecedores}
                itensExtras={itensExtras}
              />
            )}
            {aba === 'radar' && <AbaRadar precos={precos} historico={historico} fornecedores={fornecedores} />}
            {aba === 'auditoria' && <AbaAuditoria papel={papel} />}
          </>
        )}
      </main>

      <BottomSheet titulo="Escolher semana" aberto={semanaSheet} aoFechar={() => setSemanaSheet(false)}>
        <div className="space-y-1">
          {semanas.map((id, i) => (
            <button
              key={id}
              onClick={() => {
                setSemanaId(id);
                setSemanaSheet(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                id === semanaId
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30 dark:bg-carvao-700 dark:text-brand-300'
                  : 'hover:bg-carvao-50 dark:hover:bg-carvao-800'
              }`}
            >
              <span>{rotuloSemana(id, i + 1)}</span>
              {i === 0 && <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">atual</span>}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomNav grupoAtivo={grupoAtivo.id} aoSelecionar={(g) => setAba((GRUPOS.find((x) => x.id === g) ?? GRUPOS[0]).abas[0] as AbaId)} />
      <Assistente contexto={{ estado, semanaId, precos, historico, fornecedores, aceitacao, estoque, fatores }} />
      <ToastHost />
    </>
  );
}
