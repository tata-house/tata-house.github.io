'use client';

import { useState } from 'react';
import { AlternadorTema } from '@/components/AlternadorTema';
import { ToastHost } from '@/components/Toast';
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
import type { Etapa } from '@/lib/cardapio/tipos';

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
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('painel');
  const [posterAberto, setPosterAberto] = useState(false);

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
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-10 w-auto max-w-[120px] shrink-0 object-contain" />
            ) : (
              <span className="h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-ouro-300 to-ouro-500" aria-hidden />
            )}
            <div className="leading-tight">
              <div className="whitespace-nowrap font-display text-[17px] font-bold tracking-[0.18em] sm:text-[19px] sm:tracking-[0.26em]">
                TATÁ&nbsp;SUSHI
              </div>
              <div className="whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.3em] text-brand-200">
                Gestão de Alimentação
              </div>
            </div>
          </div>
          <AlternadorTema />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-5">
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
            <select
              value={semanaId}
              onChange={(e) => setSemanaId(e.target.value)}
              className="min-h-10 rounded-2xl border border-carvao-200 bg-white px-3 py-2 text-sm font-semibold dark:border-carvao-600 dark:bg-carvao-900"
            >
              {semanas.map((id, i) => (
                <option key={id} value={id}>
                  {rotuloSemana(id, i + 1)}
                  {i === 0 ? ' (atual)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => setPosterAberto(true)}
              className="min-h-10 whitespace-nowrap rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-white shadow-suave ring-1 ring-ouro-400/50 transition hover:from-brand-800 hover:to-brand-700"
            >
              🖼️ Pôster
            </button>
          </div>
        </div>

        {/* Papel (simulação dos setores no protótipo) */}
        <div className="flex flex-wrap items-center gap-1.5 print:hidden">
          <span className="text-[11px] font-bold uppercase tracking-wider text-carvao-400">Estou vendo como:</span>
          {PAPEIS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPapel(p.id)}
              title={p.descricao}
              className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wide transition ${
                papel === p.id
                  ? 'bg-brand-700 text-white shadow-suave'
                  : 'bg-white text-carvao-500 ring-1 ring-carvao-200 hover:bg-brand-50 hover:text-brand-700 dark:bg-carvao-800 dark:text-areia-200 dark:ring-carvao-600'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>

        {/* Abas */}
        <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-carvao-200 dark:bg-carvao-800 dark:ring-carvao-600 print:hidden">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-[12px] font-extrabold uppercase tracking-wide transition ${
                aba === a.id
                  ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-suave'
                  : 'text-carvao-500 hover:bg-brand-50 hover:text-brand-700 dark:text-areia-200 dark:hover:bg-carvao-700'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </nav>

        {!pronto ? (
          <p className="py-10 text-center text-sm text-carvao-400">Carregando semana…</p>
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
                irPara={(a) => setAba(a as (typeof ABAS)[number]['id'])}
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

      <Assistente contexto={{ estado, semanaId, precos, historico, fornecedores, aceitacao, estoque, fatores }} />
      <ToastHost />
    </>
  );
}
