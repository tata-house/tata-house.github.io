'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlternadorTema } from '@/components/AlternadorTema';
import { BottomNav, GRUPOS } from '@/components/BottomNav';
import { ToastHost, toast } from '@/components/Toast';
import { Icone } from '@/components/Icones';
import { BottomSheet, Skeleton } from '@/components/ui';
import { AbaAceitacao } from '@/components/cardapio/AbaAceitacao';
import { AbaCardapio } from '@/components/cardapio/AbaCardapio';
import { AbaCompras } from '@/components/cardapio/AbaCompras';
import { AbaCotacao } from '@/components/cardapio/AbaCotacao';
import { AbaDashboard } from '@/components/cardapio/AbaDashboard';
import { AbaDesperdicio } from '@/components/cardapio/AbaDesperdicio';
import { AbaEstoque } from '@/components/cardapio/AbaEstoque';
import { AbaFluxo } from '@/components/cardapio/AbaFluxo';
import { AbaPrecos } from '@/components/cardapio/AbaPrecos';
import { AbaRadar } from '@/components/cardapio/AbaRadar';
import { CentralGerencial } from '@/components/cardapio/CentralGerencial';
import { Assistente } from '@/components/cardapio/Assistente';
import { InteligenciaCard } from '@/components/cardapio/InteligenciaCard';
import { PosterSemana } from '@/components/cardapio/PosterSemana';
import {
  deslocarSemana,
  idSemanaIso,
  lerSemana,
  periodoSemana,
  rotuloSemana,
  semanasComConteudo,
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
import { useLogin, abasDoPapel } from '@/lib/cardapio/login';
import { Login } from '@/components/Login';
import { pode } from '@/lib/cardapio/org';
import type { Etapa } from '@/lib/cardapio/tipos';

const ABAS = [
  { id: 'painel', rotulo: '📊 Painel' },
  { id: 'cotacao', rotulo: '📋 Cotação' },
  { id: 'cardapio', rotulo: '🍽️ Cardápio' },
  { id: 'compras', rotulo: '🛒 Compras' },
  { id: 'feedback', rotulo: '👍 Feedback' },
  { id: 'gerencial', rotulo: '📈 Gerencial' },
] as const;

type AbaId = (typeof ABAS)[number]['id'];
type SecaoCompras = 'comprar' | 'estoque' | 'precos' | 'radar';

const SECOES_COMPRAS: { id: SecaoCompras; rotulo: string }[] = [
  { id: 'comprar', rotulo: 'Comprar' },
  { id: 'estoque', rotulo: 'Estoque' },
  { id: 'precos', rotulo: 'Preços' },
  { id: 'radar', rotulo: 'Radar' },
];

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
  const [secaoCompras, setSecaoCompras] = useState<SecaoCompras>('comprar');

  const { estado, atualizar, pronto } = useSemana(semanaId);
  const { precos, definirPreco } = usePrecos();
  const { fornecedores, definirFornecedor } = useFornecedores();
  const { itensExtras, cadastrarItem } = useItensExtras();
  const { fatores, aprenderDeSemana } = useAprendizado();
  const { papel } = usePapel();
  const { perfil, perfilId, pronto: loginPronto, sair } = useLogin();
  const { logo } = useLogo();
  const { estoque, movimentar, definirMinimo, definirSaldo } = useEstoque();
  const { aceitacao, avaliar } = useAceitacao();
  const { eventos, adicionar: addEvento, remover: rmEvento } = useEventos();
  const { registros: desperdicio, adicionar: addDesperdicio, remover: rmDesperdicio } = useDesperdicio(semanaId);
  const historico = useHistoricoPrecos();

  const semanaAtualId = idSemanaIso(new Date());

  const abasPermitidas = useMemo(() => abasDoPapel(papel), [papel]);
  const gruposVisiveis = useMemo(
    () => GRUPOS.filter((g) => g.abas.some((a) => abasPermitidas.includes(a as AbaId))),
    [abasPermitidas],
  );
  const grupoAtivo = GRUPOS.find((g) => g.abas.includes(aba)) ?? GRUPOS[0];

  const irSemana = (delta: number) => setSemanaId(deslocarSemana(semanaId, delta));

  // lista de semanas para o seletor: janela ao redor de hoje + as que têm cardápio
  const listaSemanas = useMemo(() => {
    const set = new Set<string>();
    for (let i = -2; i <= 8; i++) set.add(deslocarSemana(semanaAtualId, i));
    semanasComConteudo().forEach((id) => set.add(id));
    set.add(semanaId);
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaId, semanaAtualId, semanaSheet]);

  const duplicarSemanaAnterior = () => {
    const origem = lerSemana(deslocarSemana(semanaId, -1));
    if (!origem.dias.some((d) => d.principal)) {
      toast('A semana anterior está vazia', 'erro');
      return;
    }
    atualizar((e) => ({
      ...e,
      dias: e.dias.map((d, i) => ({
        ...d,
        principal: origem.dias[i]?.principal ?? '',
        guarnicaoFixa: origem.dias[i]?.guarnicaoFixa ?? d.guarnicaoFixa,
        guarnicao: origem.dias[i]?.guarnicao ?? '',
        salada: origem.dias[i]?.salada ?? '',
        sobremesa: origem.dias[i]?.sobremesa ?? '',
      })),
      ajustes: {},
    }));
    toast('Cardápio duplicado da semana anterior');
    setSemanaSheet(false);
  };

  const podeEditarCardapio = pode(papel, 'cardapio:editar') && (estado.etapa === 'rascunho' || estado.etapa === 'cozinha');
  const podeEstoque = pode(papel, 'estoque:gerenciar');
  const podeAvaliar = pode(papel, 'cardapio:editar');

  // se a aba atual não é permitida ao perfil, vai para a primeira liberada
  useEffect(() => {
    if (!abasPermitidas.includes(aba)) setAba(abasPermitidas[0] as AbaId);
  }, [abasPermitidas, aba]);

  if (!loginPronto) return null;
  if (!perfilId) return <Login />;

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
                TATÁ&nbsp;HOUSE
              </div>
              <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.3em] text-brand-200">
                Refeitório do Tatá Sushi
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/15 py-1.5 pl-3 pr-3 text-xs font-semibold text-white ring-1 ring-white/25 sm:flex">
              <Icone nome="usuario" tam={14} className="text-white/70" />
              {perfil?.rotulo ?? 'Perfil'}
            </span>
            <button
              onClick={() => {
                sair();
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              Sair
            </button>
            <AlternadorTema />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pb-28 pt-5 lg:pb-8">
        {/* Cabeçalho do módulo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-800 dark:text-brand-300 sm:text-3xl">
              {periodoSemana(semanaId)}
              <span
                className={`ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${COR_ETAPA[estado.etapa]}`}
              >
                {ROTULO_ETAPA[estado.etapa]}
              </span>
            </h1>
            <p className="text-sm font-semibold text-carvao-500 dark:text-carvao-300">
              {semanaId === semanaAtualId ? 'Semana atual' : 'Semana planejada'}{' '}
              <span className="font-normal text-carvao-400">· segunda a domingo</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Stepper de semana — navegação por polegar; toque no rótulo abre a lista */}
            <div className="flex items-center rounded-2xl border border-carvao-200 bg-white p-1 dark:border-carvao-600 dark:bg-carvao-900">
              <button
                onClick={() => irSemana(-1)}
                aria-label="Semana anterior"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-carvao-500 transition hover:bg-carvao-100 dark:hover:bg-carvao-800"
              >
                <Icone nome="anterior" tam={18} />
              </button>
              <button
                onClick={() => setSemanaSheet(true)}
                className="flex min-w-[104px] items-center justify-center gap-1.5 rounded-xl px-1 py-1 text-sm font-bold tabular-nums transition hover:bg-carvao-100 dark:hover:bg-carvao-800"
              >
                <Icone nome="calendario" tam={15} className="text-carvao-400" />
                {periodoSemana(semanaId)}
              </button>
              <button
                onClick={() => irSemana(1)}
                aria-label="Próxima semana"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-carvao-500 transition hover:bg-carvao-100 dark:hover:bg-carvao-800"
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
          {ABAS.filter((a) => abasPermitidas.includes(a.id)).map((a) => (
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
            {/* PAINEL — visão geral + acompanhar (etapa + contagem) + auditoria resumida */}
            {aba === 'painel' && (
              <div className="space-y-6">
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
                <InteligenciaCard
                  estado={estado}
                  semanaId={semanaId}
                  precos={precos}
                  aceitacao={aceitacao}
                  estoque={estoque}
                  historico={historico}
                  fornecedores={fornecedores}
                />
                <AbaFluxo
                  estado={estado}
                  atualizar={atualizar}
                  papel={papel}
                  precos={precos}
                  fatores={fatores}
                  aprenderDeSemana={aprenderDeSemana}
                />
              </div>
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

            {aba === 'gerencial' && (
              <CentralGerencial
                estado={estado}
                semanaId={semanaId}
                precos={precos}
                historico={historico}
                aceitacao={aceitacao}
                fornecedores={fornecedores}
                fatores={fatores}
              />
            )}

            {/* COMPRAS — comprar/receber · estoque · preços · radar (seções) */}
            {aba === 'compras' && (
              <div className="space-y-4">
                <div className="flex gap-1 overflow-x-auto rounded-2xl bg-carvao-100/70 p-1 dark:bg-carvao-800/70">
                  {SECOES_COMPRAS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSecaoCompras(s.id)}
                      className={`min-h-9 flex-1 whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition ${
                        secaoCompras === s.id
                          ? 'bg-white text-brand-700 shadow-suave dark:bg-carvao-700 dark:text-brand-300'
                          : 'text-carvao-500 dark:text-areia-200'
                      }`}
                    >
                      {s.rotulo}
                    </button>
                  ))}
                </div>
                {secaoCompras === 'comprar' && (
                  <AbaCompras
                    estado={estado}
                    atualizar={atualizar}
                    papel={papel}
                    precos={precos}
                    fornecedores={fornecedores}
                    fatores={fatores}
                  />
                )}
                {secaoCompras === 'estoque' && (
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
                {secaoCompras === 'precos' && (
                  <AbaPrecos
                    precos={precos}
                    definirPreco={definirPreco}
                    fornecedores={fornecedores}
                    itensExtras={itensExtras}
                  />
                )}
                {secaoCompras === 'radar' && (
                  <AbaRadar precos={precos} historico={historico} fornecedores={fornecedores} />
                )}
              </div>
            )}

            {/* FEEDBACK — aceitação dos pratos + desperdício + QR */}
            {aba === 'feedback' && (
              <div className="space-y-6">
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
                <AbaDesperdicio
                  estado={estado}
                  precos={precos}
                  fatores={fatores}
                  registros={desperdicio}
                  adicionar={addDesperdicio}
                  remover={rmDesperdicio}
                  podeEditar={podeEstoque}
                />
              </div>
            )}
          </>
        )}
      </main>

      <BottomSheet titulo="Escolher semana" aberto={semanaSheet} aoFechar={() => setSemanaSheet(false)}>
        <div className="mb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={duplicarSemanaAnterior}
              disabled={!podeEditarCardapio}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-brand-50 px-3 py-2.5 text-[13px] font-bold text-brand-700 ring-1 ring-brand-500/30 transition hover:bg-brand-100 disabled:opacity-40 dark:bg-carvao-700 dark:text-brand-300"
            >
              <Icone nome="somar" tam={16} /> Duplicar anterior
            </button>
            <button
              onClick={() => {
                setSemanaId(deslocarSemana(semanaId, 1));
                setSemanaSheet(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-carvao-100 px-3 py-2.5 text-[13px] font-bold text-carvao-600 transition hover:bg-carvao-200 dark:bg-carvao-700 dark:text-areia-200"
            >
              <Icone nome="proximo" tam={16} /> Próxima semana
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-carvao-200 px-3 py-2 dark:border-carvao-600">
            <Icone nome="calendario" tam={16} className="shrink-0 text-carvao-400" />
            <span className="shrink-0 text-[13px] font-semibold text-carvao-500">Ir para a semana de</span>
            <input
              type="date"
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split('-').map(Number);
                setSemanaId(idSemanaIso(new Date(y, m - 1, d)));
                setSemanaSheet(false);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none dark:[color-scheme:dark]"
            />
          </label>
        </div>
        <div className="space-y-1">
          {listaSemanas.map((id) => (
            <button
              key={id}
              onClick={() => {
                setSemanaId(id);
                setSemanaSheet(false);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold tabular-nums transition ${
                id === semanaId
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30 dark:bg-carvao-700 dark:text-brand-300'
                  : 'hover:bg-carvao-50 dark:hover:bg-carvao-800'
              }`}
            >
              <span>{rotuloSemana(id)}</span>
              {id === semanaAtualId && <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">atual</span>}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomNav grupos={gruposVisiveis} grupoAtivo={grupoAtivo.id} aoSelecionar={(g) => setAba((GRUPOS.find((x) => x.id === g) ?? GRUPOS[0]).abas[0] as AbaId)} />
      <Assistente contexto={{ estado, semanaId, precos, historico, fornecedores, aceitacao, estoque, fatores }} />
      <ToastHost />
    </>
  );
}
