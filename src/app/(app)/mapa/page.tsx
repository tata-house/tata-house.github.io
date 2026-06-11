'use client';

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AcoesReserva } from '@/components/AcoesReserva';
import { FormularioReserva } from '@/components/FormularioReserva';
import { Botao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import {
  criarReserva,
  desfazerMovimento,
  moverMesaComTroca,
  tirarDaMesa,
  type MovimentoMesa,
} from '@/lib/actions';
import {
  CASAL_ACENTO,
  MESA_COR,
  MESA_ESTADO_LABEL,
  PIX_BADGE,
  PIX_LABEL,
  STATUS_ATIVOS,
  STATUS_LABEL,
  TURNOS,
  TURNO_LABEL,
  type MesaEstado,
} from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { MESAS_OPERACIONAIS, ORDEM_MAPA, POSICAO_MESA, type PosMesa } from '@/lib/mapa-layout';
import {
  comoRecebe,
  estadoMesa,
  LIBERADA_MS,
  type EstadoDaMesa,
  type Recebimento,
} from '@/lib/mesa-estado';
import type { Mesa, Reserva, Turno } from '@/lib/types';

const LEGENDA: MesaEstado[] = ['livre', 'reservada', 'chegou', 'ocupada', 'limpeza', 'bloqueada'];
const BLOQUEADA: EstadoDaMesa = { estado: 'bloqueada', reserva: null };

type FiltroLista = 'todos' | 'sem_mesa' | 'na_mesa' | 'sentados' | 'finalizados';

const FILTRO_LABEL: Record<FiltroLista, string> = {
  todos: 'Todos',
  sem_mesa: 'Sem mesa',
  na_mesa: 'Na mesa',
  sentados: 'Sentados',
  finalizados: 'Finalizados',
};

/** Status curto exibido nos cards (mesa e lista lateral). */
function statusCurto(r: Reserva): string {
  if (r.status === 'sentado') return 'Sentado';
  if (r.status === 'chegou') return 'Chegou';
  if (r.status === 'finalizada') return 'Finalizado';
  if (r.status === 'cancelada') return 'Cancelado';
  if (r.status === 'no_show') return 'No-show';
  return r.table_id ? 'Mesa definida' : 'Aguardando';
}

/** Turno sugerido pelo relógio: antes das 21h → 19h; antes das 22h → 21h. */
function turnoPeloRelogio(): Turno {
  const h = new Date().getHours();
  if (h >= 22) return '22:00';
  if (h >= 21) return '21:00';
  return '19:00';
}

export default function MapaPage() {
  const { mesas, reservas, carregando, erro, supabaseHost, recarregar } = useDados();
  // Cada horário tem o SEU mapa — nunca misturados. Começa no turno do relógio.
  const [turno, setTurno] = useState<Turno>('19:00');
  useEffect(() => {
    setTurno(turnoPeloRelogio());
  }, []);
  const [busca, setBusca] = useState('');
  const [filtroLista, setFiltroLista] = useState<FiltroLista>('todos');
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [reservaSelecionada, setReservaSelecionada] = useState<Reserva | null>(null);
  const [arrastando, setArrastando] = useState<Reserva | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [novoCasal, setNovoCasal] = useState(false);
  const [novaReservaMesa, setNovaReservaMesa] = useState<Mesa | null>(null);
  const [novoPassante, setNovoPassante] = useState(false);
  const [movimentos, setMovimentos] = useState<MovimentoMesa[]>([]);
  const [desfazendo, setDesfazendo] = useState(false);
  const [tique, setTique] = useState(0);

  // Re-renderiza periodicamente para a mesa cinza ("liberada") voltar a livre sozinha.
  useEffect(() => {
    const id = setInterval(() => setTique((t) => t + 1), Math.min(3000, LIBERADA_MS / 2));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(id);
  }, [aviso]);

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  );

  const porNumero = useMemo(() => new Map(mesas.map((m) => [m.numero, m])), [mesas]);
  // Mesas operacionais (salão 1-24 + varanda) que faltam ou estão inativas
  // no banco — sinal de que o SQL de layout ainda não rodou.
  const mesasFaltando = useMemo(
    () =>
      MESAS_OPERACIONAIS.filter((n) => {
        const m = porNumero.get(n);
        return !m || !m.ativa;
      }),
    [porNumero],
  );

  // Mesas que não constam no mapa de chão (ex.: V1/V2) mas ainda têm casal
  // ativo nelas — aparecem numa seção à parte até serem esvaziadas.
  const mesasAntigasOcupadas = useMemo(
    () =>
      mesas.filter(
        (m) =>
          !(m.numero in POSICAO_MESA) &&
          reservas.some((r) => r.table_id === m.id && STATUS_ATIVOS.includes(r.status)),
      ),
    [mesas, reservas],
  );

  // "tique" força recálculo periódico: mesa cinza ("liberada") volta a livre sozinha.
  const estadoDe = useMemo(() => {
    const mapa = new Map<string, EstadoDaMesa>();
    mesas.forEach((m) => mapa.set(m.id, estadoMesa(m, reservas, turno)));
    // Mesas antigas inativas com casal ativo: mostra o ocupante mesmo assim.
    mesasAntigasOcupadas.forEach((m) => {
      const ocupante = reservas.find(
        (r) => r.table_id === m.id && STATUS_ATIVOS.includes(r.status),
      );
      if (ocupante) {
        const estado: MesaEstado =
          ocupante.status === 'sentado' ? 'ocupada' : ocupante.status === 'chegou' ? 'chegou' : 'reservada';
        mapa.set(m.id, { estado, reserva: ocupante });
      }
    });
    return mapa;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesas, reservas, turno, mesasAntigasOcupadas, tique]);

  // Lista lateral: SÓ os casais do horário selecionado, em grupos sem
  // sobreposição (cada casal aparece UMA vez).
  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const doTurno = reservas
      .filter((r) => r.turno === turno)
      .filter((r) => !termo || r.nome.toLowerCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return {
      doTurno,
      aguardando: doTurno.filter((r) => STATUS_ATIVOS.includes(r.status) && !r.table_id),
      naMesa: doTurno.filter(
        (r) => r.table_id && STATUS_ATIVOS.includes(r.status) && r.status !== 'chegou' && r.status !== 'sentado',
      ),
      chegaram: doTurno.filter((r) => r.status === 'chegou' && r.table_id),
      sentados: doTurno.filter((r) => r.status === 'sentado'),
      finalizados: doTurno.filter((r) => r.status === 'finalizada'),
      encerrados: doTurno.filter((r) => r.status === 'no_show' || r.status === 'cancelada'),
    };
  }, [reservas, turno, busca]);

  const listaFiltrada = useMemo(() => {
    switch (filtroLista) {
      case 'sem_mesa':
        return lista.doTurno.filter((r) => STATUS_ATIVOS.includes(r.status) && !r.table_id);
      case 'na_mesa':
        return lista.doTurno.filter((r) => STATUS_ATIVOS.includes(r.status) && r.table_id);
      case 'sentados':
        return lista.doTurno.filter((r) => r.status === 'sentado');
      case 'finalizados':
        return lista.doTurno.filter((r) => r.status === 'finalizada');
      default:
        return [];
    }
  }, [lista, filtroLista]);

  // Após um arraste, o navegador ainda dispara um "click" no elemento de origem;
  // este guarda evita que o modal abra sem querer logo depois de soltar.
  const arrastouAgora = useRef(false);
  function marcarArraste() {
    arrastouAgora.current = true;
    setTimeout(() => {
      arrastouAgora.current = false;
    }, 350);
  }
  function cliqueProtegido(acao: () => void) {
    if (arrastouAgora.current) return;
    acao();
  }

  function aoIniciarArraste(event: DragStartEvent) {
    const r = event.active.data.current?.reserva as Reserva | undefined;
    setArrastando(r ?? null);
  }

  function aoCancelar() {
    setArrastando(null);
    marcarArraste();
  }

  async function moverComRegistro(reserva: Reserva, mesa: Mesa) {
    const mov = await moverMesaComTroca(reserva, mesa);
    setMovimentos((s) => [...s.slice(-9), mov]);
    await recarregar();
    const trocado = mov.retiradas[0];
    setAviso({
      tipo: 'ok',
      texto: trocado
        ? `${reserva.nome} → mesa ${mesa.numero} · ${trocado.nome} voltou para a lista ✓`
        : `${reserva.nome} → mesa ${mesa.numero} ✓`,
    });
  }

  async function aoSoltar(event: DragEndEvent) {
    setArrastando(null);
    marcarArraste();
    const arrastada = event.active.data.current?.reserva as Reserva | undefined;
    const destino = event.over?.data.current as
      | { mesa?: Mesa | null; semMesa?: boolean }
      | undefined;
    if (!arrastada || !destino) return;
    // usa a versão mais recente da reserva (a do drag pode estar defasada)
    const reserva = reservas.find((r) => r.id === arrastada.id) ?? arrastada;

    // Soltou na lista lateral: tira da mesa e devolve para "aguardando"
    if (destino.semMesa) {
      if (!reserva.table_id) return;
      try {
        const mov = await tirarDaMesa(reserva);
        setMovimentos((s) => [...s.slice(-9), mov]);
        await recarregar();
        setAviso({
          tipo: 'ok',
          texto: `${reserva.nome} saiu da mesa ${reserva.mesa?.numero ?? ''} — mesa livre ✓`,
        });
      } catch (e) {
        setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao tirar da mesa.' });
        await recarregar();
      }
      return;
    }

    const mesa = destino.mesa;
    if (!mesa) return;
    if (mesa.id === reserva.table_id) return;
    const como = comoRecebe(mesa, reservas, reserva);
    if (como === 'bloqueado') {
      setAviso({
        tipo: 'erro',
        texto: !mesa.ativa
          ? `Mesa ${mesa.numero} está bloqueada.`
          : `Mesa ${mesa.numero} está com um casal de outro turno que já chegou/sentou.`,
      });
      return;
    }
    try {
      await moverComRegistro(reserva, mesa);
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao mover.' });
      await recarregar();
    }
  }

  async function desfazerUltimo() {
    const ultimo = movimentos[movimentos.length - 1];
    if (!ultimo || desfazendo) return;
    setDesfazendo(true);
    try {
      await desfazerMovimento(ultimo);
      setMovimentos((s) => s.slice(0, -1));
      await recarregar();
      setAviso({ tipo: 'ok', texto: `Desfeito: ${ultimo.movida.nome} voltou para onde estava ↩` });
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao desfazer.' });
      await recarregar();
    } finally {
      setDesfazendo(false);
    }
  }

  if (carregando) return <p className="py-10 text-center text-carvao-400">Carregando...</p>;

  const infoSelecionada = mesaSelecionada ? (estadoDe.get(mesaSelecionada.id) ?? BLOQUEADA) : null;
  const aguardandoParaMesa = mesaSelecionada
    ? reservas.filter(
        (r) => STATUS_ATIVOS.includes(r.status) && !r.table_id && r.turno === turno,
      )
    : [];

  return (
    <DndContext sensors={sensores} onDragStart={aoIniciarArraste} onDragEnd={aoSoltar} onDragCancel={aoCancelar}>
      <div className="space-y-3">
        {(erro || mesas.length === 0) && (
          <div className="rounded-2xl border border-[#b04c41]/40 bg-[#f5e2df] p-4 text-sm shadow-suave dark:bg-[#3e2421]">
            <p className="font-bold text-[#8e3a31] dark:text-[#e3a49c]">
              {erro
                ? `Erro ao ler o banco: ${erro}`
                : 'Nenhuma mesa cadastrada no banco — o SQL de correção ainda não rodou neste projeto.'}
            </p>
            <p className="mt-1 text-[#7a352d] dark:text-[#dcb3ac]">
              {erro?.toLowerCase().includes('permission denied') ? (
                <>
                  As tabelas existem, mas faltam as permissões (GRANT). Abra o SQL Editor do projeto{' '}
                  <b className="break-all">{supabaseHost}</b> e execute de novo o arquivo{' '}
                  <b>supabase/fix-operacao-namorados.sql</b> na versão mais recente — ela inclui a
                  seção de GRANTs que resolve este erro. Pode rodar quantas vezes precisar.
                </>
              ) : (
                <>
                  Este site está conectado ao Supabase <b className="break-all">{supabaseHost}</b>.
                  Confira se é o MESMO projeto onde você executou o SQL. Para corrigir, abra o SQL
                  Editor desse projeto e execute o arquivo <b>supabase/fix-operacao-namorados.sql</b>.
                </>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Mapa de mesas</h1>
            <p className="mt-0.5 text-sm text-carvao-400 dark:text-carvao-300">
              Arraste um casal da lista para a mesa — ou de uma mesa para outra.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Botao
              variante="secundario"
              disabled={movimentos.length === 0 || desfazendo}
              onClick={desfazerUltimo}
            >
              ↩ {desfazendo ? 'Desfazendo...' : 'Desfazer'}
            </Botao>
            <Botao variante="secundario" onClick={() => setNovoPassante(true)}>
              Passante
            </Botao>
            <Botao onClick={() => setNovoCasal(true)}>＋ Nova reserva</Botao>
          </div>
        </div>

        {/* Seletor de turno — cada horário tem o SEU mapa, nunca misturados */}
        <div className="flex w-full rounded-2xl bg-white p-1.5 shadow-suave ring-1 ring-carvao-200/70 dark:bg-carvao-850 dark:ring-carvao-700">
          {TURNOS.map((t) => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`min-h-12 flex-1 rounded-xl text-base font-bold tracking-tight transition-all duration-150 ${
                turno === t
                  ? 'bg-carvao-900 text-areia-50 shadow-media dark:bg-areia-100 dark:text-carvao-900'
                  : 'text-carvao-400 hover:text-carvao-700 dark:text-carvao-300 dark:hover:text-areia-100'
              }`}
            >
              {TURNO_LABEL[t]}
              <span
                className={`ml-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  turno === t ? 'text-brand-400 dark:text-brand-600' : 'text-carvao-300 dark:text-carvao-500'
                }`}
              >
                turno
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-carvao-400 dark:text-carvao-300">
          Cada horário tem seu próprio mapa: as mesas mostram só as reservas de{' '}
          <b className="text-carvao-600 dark:text-areia-200">{TURNO_LABEL[turno]}</b>. Casais ainda
          sentados de outro horário aparecem na mesa até o caixa liberar.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {LEGENDA.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-carvao-500 ring-1 ring-carvao-200/70 dark:bg-carvao-850 dark:text-carvao-200 dark:ring-carvao-700"
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${MESA_COR[e].split(' ')[0]}`} />
              {MESA_ESTADO_LABEL[e]}
            </span>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,380px)]">
          {/* ---------- MAPA DE CHÃO (salão 1-24 + varanda) ---------- */}
          <div className="space-y-3">
            {mesasFaltando.length > 0 && (
              <p className="rounded-2xl bg-[#f6ecd8] px-4 py-3 text-sm font-semibold text-[#8a6420] shadow-suave dark:bg-[#3d321a] dark:text-[#e3c987]">
                As mesas {mesasFaltando.join(', ')} ainda não existem (ou estão inativas) no banco —
                execute a versão atual de <b>supabase/mesas-1-a-24.sql</b> no SQL Editor do Supabase.
              </p>
            )}
            <div className="mx-auto w-full max-w-[500px] rounded-[28px] bg-white p-2.5 shadow-media ring-1 ring-carvao-200/60 dark:bg-carvao-850 dark:ring-carvao-700 lg:mx-0">
              <div className="relative aspect-[43/100] w-full select-none overflow-hidden rounded-3xl ring-1 ring-carvao-900/10">
                {/* piso do salão (madeira) */}
                <div className="absolute inset-x-0 top-0 h-[74.5%] bg-[#c0a075] dark:bg-[#6b5941]" />
                {/* textura sutil de tábuas */}
                <div className="absolute inset-x-0 top-0 h-[74.5%] bg-[repeating-linear-gradient(90deg,transparent,transparent_28px,rgba(0,0,0,0.025)_28px,rgba(0,0,0,0.025)_29px)]" />
                {/* piso da varanda */}
                <div className="absolute inset-x-0 bottom-0 top-[74.5%] bg-[#dcd8d1] dark:bg-stone-600" />
                {/* divisória salão/varanda */}
                <div className="absolute inset-x-0 top-[74.2%] h-[0.4%] bg-carvao-900/70" />

                {/* porta/serviço (topo direita) */}
                <div className="absolute right-[16%] top-0 h-[2.4%] w-[10%] bg-white/60" />
                {/* bar em L (topo) com tampo de mármore */}
                <div className="absolute left-[19%] top-[2.6%] h-[7.6%] w-[7%] rounded-[3px] bg-[#54221f]" />
                <div className="absolute left-[25%] top-[6.6%] h-[3.6%] w-[56%] rounded-[3px] bg-[#54221f]">
                  <div className="absolute inset-x-[1%] top-[12%] h-[55%] rounded-[2px] bg-areia-100" />
                </div>

                {/* sofás (azul-escuro como na planta) */}
                <div className="absolute left-[0.5%] top-[16%] h-[14%] w-[7%] rounded-md bg-[#3e4659]/90" />
                <div className="absolute left-[0.5%] top-[30.5%] h-[14.5%] w-[7%] rounded-md bg-[#3e4659]/90" />
                <div className="absolute right-[0.5%] top-[16%] h-[14.5%] w-[7%] rounded-md bg-[#3e4659]/90" />
                <div className="absolute right-[0.5%] top-[31%] h-[15%] w-[7%] rounded-md bg-[#3e4659]/90" />
                <div className="absolute right-[0.5%] top-[47%] h-[26.5%] w-[7%] rounded-md bg-[#3e4659]/90" />
                <div className="absolute right-[0.5%] top-[76%] h-[21%] w-[7%] rounded-md bg-[#3e4659]/90" />

                {/* barra fria do sushi */}
                <div className="absolute left-[4%] top-[57%] h-[15.5%] w-[20%] rounded-md border border-carvao-300 bg-areia-100 shadow-inner dark:bg-areia-200">
                  <span className="flex h-full items-center justify-center text-[9px] font-bold tracking-[0.28em] text-carvao-400 [writing-mode:vertical-lr]">
                    SUSHI
                  </span>
                </div>

                {/* varanda: planta e banco claro */}
                <span className="absolute left-[4%] top-[75.5%] text-xl">🪴</span>
                <div className="absolute bottom-0 left-0 top-[84%] w-[5%] bg-sky-100/80 dark:bg-sky-200/50" />

                {/* rótulos das áreas */}
                <span className="absolute left-[2.5%] top-[0.8%] rounded-full bg-carvao-950/60 px-2.5 py-1 text-[9px] font-bold tracking-[0.22em] text-areia-100 backdrop-blur-sm">
                  SALÃO
                </span>
                <span className="absolute left-[28%] top-[75.5%] rounded-full bg-carvao-950/60 px-2.5 py-1 text-[9px] font-bold tracking-[0.22em] text-areia-100 backdrop-blur-sm">
                  ÁREA EXTERNA
                </span>

                {/* mesas — posições do mapa de chão oficial */}
                {ORDEM_MAPA.map((numero) => {
                  const mesa = porNumero.get(numero) ?? null;
                  const info = mesa ? (estadoDe.get(mesa.id) ?? BLOQUEADA) : BLOQUEADA;
                  return (
                    <MesaChip
                      key={numero}
                      numero={numero}
                      pos={POSICAO_MESA[numero]}
                      mesa={mesa}
                      info={info}
                      recebimento={mesa && arrastando ? comoRecebe(mesa, reservas, arrastando) : 'bloqueado'}
                      arrastandoAlgo={!!arrastando}
                      aoClicar={() => {
                        if (mesa) cliqueProtegido(() => setMesaSelecionada(mesa));
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {mesasAntigasOcupadas.length > 0 && (
              <div className="space-y-2">
                <h3 className="px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-carvao-400 dark:text-carvao-300">
                  Mesas antigas ainda ocupadas — arraste o casal para uma mesa 1-24
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                  {mesasAntigasOcupadas.map((m) => (
                    <MesaCard
                      key={m.id}
                      numero={m.numero}
                      mesa={m}
                      info={estadoDe.get(m.id) ?? BLOQUEADA}
                      recebimento="bloqueado"
                      arrastandoAlgo={!!arrastando}
                      aoClicar={() => cliqueProtegido(() => setMesaSelecionada(m))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---------- LISTA DE CASAIS ---------- */}
          <div className="space-y-3 rounded-[28px] bg-white/70 p-3 shadow-suave ring-1 ring-carvao-200/60 backdrop-blur-sm dark:bg-carvao-850/70 dark:ring-carvao-700">
            <div className="flex items-baseline justify-between px-1 pt-1">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Casais · {TURNO_LABEL[turno]}
              </h2>
              <span className="text-xs font-semibold text-carvao-400 dark:text-carvao-300">
                {lista.doTurno.length} no turno
              </span>
            </div>
            <input
              className={estiloInput}
              placeholder="Buscar casal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FILTRO_LABEL) as FiltroLista[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroLista(f)}
                  className={`min-h-10 rounded-full px-4 text-[13px] font-semibold transition ${
                    filtroLista === f
                      ? 'bg-carvao-900 text-areia-50 shadow-suave dark:bg-areia-100 dark:text-carvao-900'
                      : 'bg-white text-carvao-500 ring-1 ring-carvao-200 hover:text-carvao-800 dark:bg-carvao-800 dark:text-carvao-300 dark:ring-carvao-600'
                  }`}
                >
                  {FILTRO_LABEL[f]}
                </button>
              ))}
            </div>
            <ZonaSemMesa ativa={!!arrastando?.table_id} />
            <div className="max-h-[76vh] space-y-5 overflow-y-auto pb-24 pr-1 lg:pb-2">
              {filtroLista === 'todos' ? (
                <>
                  <GrupoCasais titulo="Aguardando mesa" cor={CASAL_ACENTO.aguardando} reservas={lista.aguardando} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="Na mesa (reservado)" cor={CASAL_ACENTO.definida} reservas={lista.naMesa} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="Chegaram" cor={CASAL_ACENTO.chegou} reservas={lista.chegaram} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="Sentados" cor={CASAL_ACENTO.sentado} reservas={lista.sentados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="Finalizados" cor={CASAL_ACENTO.finalizada} reservas={lista.finalizados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="No-show / cancelados" cor={CASAL_ACENTO.encerrada} reservas={lista.encerrados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  {lista.doTurno.length === 0 && (
                    <div className="space-y-3 py-10 text-center">
                      <p className="text-sm text-carvao-400">Nenhum casal neste turno.</p>
                      <Botao onClick={() => setNovoCasal(true)}>＋ Cadastrar reserva</Botao>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  {listaFiltrada.map((r) => (
                    <CardCasal key={r.id} reserva={r} aoClicar={() => cliqueProtegido(() => setReservaSelecionada(r))} />
                  ))}
                  {listaFiltrada.length === 0 && (
                    <p className="py-10 text-center text-sm text-carvao-400">
                      Nenhum casal em &quot;{FILTRO_LABEL[filtroLista]}&quot;.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* fantasma que segue o dedo durante o arraste */}
      <DragOverlay dropAnimation={null}>
        {arrastando && (
          <div className="rotate-1 rounded-2xl bg-carvao-900/95 px-5 py-3.5 text-sm font-bold text-areia-50 shadow-flutuante ring-2 ring-brand-500/60 backdrop-blur">
            {arrastando.nome}
            <span className="ml-2 rounded-md bg-white/15 px-1.5 py-0.5 text-xs font-semibold">
              {TURNO_LABEL[arrastando.turno]}
            </span>
          </div>
        )}
      </DragOverlay>

      {/* aviso (toast) */}
      {aviso && (
        <div
          className={`fixed bottom-24 left-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 rounded-2xl px-6 py-4 text-center text-[15px] font-bold shadow-flutuante ring-1 ring-white/10 backdrop-blur animate-subir md:bottom-8 ${
            aviso.tipo === 'ok' ? 'bg-carvao-900/95 text-areia-50' : 'bg-[#7e342c]/95 text-areia-50'
          }`}
        >
          <span className={`mr-2 ${aviso.tipo === 'ok' ? 'text-brand-400' : 'text-[#f0b5ad]'}`}>
            {aviso.tipo === 'ok' ? '✓' : '✕'}
          </span>
          {aviso.texto}
        </div>
      )}

      {/* ---------- MODAL DA MESA ---------- */}
      <Modal
        titulo={mesaSelecionada ? `Mesa ${mesaSelecionada.numero}` : ''}
        aberto={!!mesaSelecionada && !reservaSelecionada && !novaReservaMesa}
        aoFechar={() => setMesaSelecionada(null)}
      >
        {mesaSelecionada && infoSelecionada && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-5 w-5 rounded ${MESA_COR[infoSelecionada.estado].split(' ')[0]}`} />
              <span className="text-lg font-black">{MESA_ESTADO_LABEL[infoSelecionada.estado]}</span>
              <span className="rounded-full bg-areia-100 px-3 py-1 text-sm font-semibold text-carvao-600 dark:bg-carvao-700 dark:text-areia-200">
                Mapa {TURNO_LABEL[turno]}
              </span>
            </div>
            {mesaSelecionada.observacao && (
              <p className="text-sm text-carvao-400 dark:text-carvao-300">📍 {mesaSelecionada.observacao}</p>
            )}

            {infoSelecionada.reserva ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-areia-50 p-4 ring-1 ring-carvao-200/70 dark:bg-carvao-800 dark:ring-carvao-600">
                  <div className="text-lg font-bold">{infoSelecionada.reserva.nome}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-carvao-600 ring-1 ring-carvao-200/70 dark:bg-carvao-700 dark:text-areia-200 dark:ring-carvao-600">
                      {TURNO_LABEL[infoSelecionada.reserva.turno]}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 font-semibold text-carvao-600 ring-1 ring-carvao-200/70 dark:bg-carvao-700 dark:text-areia-200 dark:ring-carvao-600">
                      {STATUS_LABEL[infoSelecionada.reserva.status]}
                    </span>
                    {infoSelecionada.reserva.origem === 'reserva' && (
                      <span className={`rounded-full px-3 py-1 font-semibold ${PIX_BADGE[infoSelecionada.reserva.pix_status]}`}>
                        Pix: {PIX_LABEL[infoSelecionada.reserva.pix_status]}
                      </span>
                    )}
                  </div>
                  {infoSelecionada.reserva.observacao && (
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      📝 {infoSelecionada.reserva.observacao}
                    </div>
                  )}
                </div>
                <Botao className="w-full" onClick={() => setReservaSelecionada(infoSelecionada.reserva)}>
                  Abrir ações (chegou, sentar, fechar conta...)
                </Botao>
              </div>
            ) : infoSelecionada.estado === 'bloqueada' ? (
              <p className="text-carvao-400 dark:text-carvao-300">Mesa fora do layout operacional — bloqueada para reservas.</p>
            ) : (
              <div className="space-y-3">
                <Botao
                  className="w-full"
                  onClick={() => setNovaReservaMesa(mesaSelecionada)}
                >
                  ➕ Nova reserva nesta mesa
                </Botao>
                {aguardandoParaMesa.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-carvao-400 dark:text-carvao-300">
                      Ou coloque um casal que está aguardando:
                    </p>
                    {aguardandoParaMesa.slice(0, 8).map((r) => (
                      <button
                        key={r.id}
                        className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-areia-100 px-4 py-3 text-left font-semibold transition hover:bg-areia-200 active:scale-[0.98] dark:bg-carvao-700 dark:hover:bg-carvao-600"
                        onClick={async () => {
                          try {
                            await moverComRegistro(r, mesaSelecionada);
                            setMesaSelecionada(null);
                          } catch (e) {
                            setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao atribuir.' });
                          }
                        }}
                      >
                        <span>{r.nome}</span>
                        <span className="text-sm text-carvao-400 dark:text-carvao-300">{TURNO_LABEL[r.turno]} →</span>
                      </button>
                    ))}
                  </>
                )}
                <p className="text-sm text-carvao-300 dark:text-carvao-500">
                  Dica: dá para arrastar um casal da lista direto para a mesa.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ações da reserva */}
      <AcoesReserva
        reserva={reservaSelecionada}
        aberto={!!reservaSelecionada}
        aoFechar={() => {
          setReservaSelecionada(null);
          setMesaSelecionada(null);
        }}
      />

      {/* nova reserva (botão do topo) */}
      {novoCasal && (
        <FormularioReserva
          aberto={novoCasal}
          aoFechar={() => setNovoCasal(false)}
          turnoInicial={turno}
        />
      )}

      {/* nova reserva já na mesa clicada */}
      {novaReservaMesa && (
        <FormularioReserva
          aberto={!!novaReservaMesa}
          aoFechar={() => {
            setNovaReservaMesa(null);
            setMesaSelecionada(null);
          }}
          turnoInicial={turno}
          mesaInicial={novaReservaMesa.id}
        />
      )}

      {/* novo passante */}
      <PassanteModal
        aberto={novoPassante}
        aoFechar={() => setNovoPassante(false)}
        aoSalvar={() => setAviso({ tipo: 'ok', texto: 'Passante adicionado ✓' })}
      />
    </DndContext>
  );
}

/* ---------- Zona "tirar da mesa": solte um casal aqui e a mesa fica livre ---------- */
function ZonaSemMesa({ ativa }: { ativa: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'sem-mesa', data: { semMesa: true } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-dashed px-4 py-2.5 text-center text-xs font-semibold transition-all duration-150 ${
        ativa
          ? isOver
            ? 'scale-[1.02] border-[#d3a445] bg-[#f6ecd8] text-[#8a6420] ring-4 ring-[#d3a445]/30 dark:bg-[#3d321a] dark:text-[#e3c987]'
            : 'animate-pulse border-[#d3a445]/80 bg-[#f6ecd8]/70 text-[#8a6420] dark:bg-[#3d321a]/60 dark:text-[#e3c987]'
          : 'border-carvao-200 text-carvao-300 dark:border-carvao-600 dark:text-carvao-500'
      }`}
    >
      {ativa
        ? '⬇ Solte aqui para tirar da mesa — a mesa fica livre'
        : 'Arraste um casal até aqui para tirá-lo da mesa'}
    </div>
  );
}

/* ---------- Chip de mesa no mapa de chão (arrastável + alvo de soltura) ---------- */
function MesaChip({
  numero,
  pos,
  mesa,
  info,
  recebimento,
  arrastandoAlgo,
  aoClicar,
}: {
  numero: string;
  pos: PosMesa;
  mesa: Mesa | null;
  info: EstadoDaMesa;
  recebimento: Recebimento;
  arrastandoAlgo: boolean;
  aoClicar: () => void;
}) {
  const reservaArrastavel = info.reserva && STATUS_ATIVOS.includes(info.reserva.status) ? info.reserva : null;
  const droppable = useDroppable({
    id: `mesa-${numero}`,
    data: { mesa },
    disabled: !mesa || !mesa.ativa || !!pos.pequena,
  });
  const draggable = useDraggable({
    id: `mesa-res-${numero}`,
    data: { reserva: reservaArrastavel },
    disabled: !reservaArrastavel,
  });

  // Banquetas de apoio (bar/barra fria): grafite, sem arrastar nem soltar.
  if (pos.pequena) {
    return (
      <button
        onClick={aoClicar}
        className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md text-[9px] font-bold shadow-sm ring-1 ring-white/10 ${MESA_COR.bloqueada}`}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        title={`Mesa ${numero} — apoio (bloqueada)`}
      >
        {numero}
      </button>
    );
  }

  if (!mesa) {
    return (
      <div
        className="absolute flex h-12 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/70 text-center text-white sm:w-24"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        title={`Mesa ${numero} — não cadastrada no banco`}
      >
        <span className="text-[11px] font-extrabold leading-none">{numero}</span>
        <span className="text-[8px] font-semibold leading-tight">falta no banco</span>
      </div>
    );
  }

  const destaque = arrastandoAlgo
    ? recebimento === 'livre'
      ? droppable.isOver
        ? 'ring-4 ring-white scale-110 z-20'
        : 'ring-2 ring-white/80 animate-pulse z-10'
      : recebimento === 'troca'
        ? droppable.isOver
          ? 'ring-4 ring-[#e8c573] scale-110 z-20'
          : 'ring-2 ring-[#e8c573]/90 z-10'
        : 'opacity-35 saturate-50'
    : '';

  return (
    <button
      ref={(el) => {
        droppable.setNodeRef(el);
        draggable.setNodeRef(el);
      }}
      {...draggable.listeners}
      {...draggable.attributes}
      onClick={aoClicar}
      className={`absolute flex h-12 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl px-1 shadow-[0_2px_8px_rgba(14,16,19,0.28)] ring-1 ring-black/10 transition-all duration-150 sm:w-24 ${MESA_COR[info.estado]} ${destaque} ${draggable.isDragging ? 'opacity-30' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, touchAction: 'manipulation' }}
      title={`Mesa ${numero} — ${MESA_ESTADO_LABEL[info.estado]}`}
    >
      <span className="text-[11px] font-extrabold leading-none drop-shadow-sm">{numero}</span>
      {info.reserva ? (
        <>
          <span className="w-full truncate text-center text-[8px] font-bold leading-tight">
            {info.reserva.origem === 'passante' && '🚶 '}
            {info.reserva.nome}
          </span>
          <span className="text-[7.5px] font-semibold uppercase leading-none tracking-wide opacity-85">
            {TURNO_LABEL[info.reserva.turno]} · {MESA_ESTADO_LABEL[info.estado]}
          </span>
        </>
      ) : (
        <span className="text-[7.5px] font-semibold uppercase leading-none tracking-wide opacity-85">
          {MESA_ESTADO_LABEL[info.estado]}
        </span>
      )}
      {arrastandoAlgo && recebimento === 'troca' && (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-[#e8c573] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#5c4310] shadow-sm">
          troca
        </span>
      )}
    </button>
  );
}

/* ---------- Card de mesa fora do layout (grade auxiliar) ---------- */
function MesaCard({
  numero,
  mesa,
  info,
  recebimento,
  arrastandoAlgo,
  aoClicar,
}: {
  numero: string;
  mesa: Mesa | null;
  info: EstadoDaMesa;
  recebimento: Recebimento;
  arrastandoAlgo: boolean;
  aoClicar: () => void;
}) {
  const reservaArrastavel = info.reserva && STATUS_ATIVOS.includes(info.reserva.status) ? info.reserva : null;
  const droppable = useDroppable({ id: `mesa-${numero}`, data: { mesa }, disabled: !mesa || !mesa.ativa });
  const draggable = useDraggable({
    id: `mesa-res-${numero}`,
    data: { reserva: reservaArrastavel },
    disabled: !reservaArrastavel,
  });

  if (!mesa) {
    return (
      <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-carvao-200 p-2 text-center text-carvao-300 dark:border-carvao-600 dark:text-carvao-500">
        <span className="text-lg font-black">{numero}</span>
        <span className="text-[10px] font-semibold leading-tight">falta no banco</span>
      </div>
    );
  }

  const destaque = arrastandoAlgo
    ? recebimento === 'livre'
      ? droppable.isOver
        ? 'ring-4 ring-white scale-105 z-10'
        : 'ring-2 ring-brand-300/90 animate-pulse'
      : recebimento === 'troca'
        ? droppable.isOver
          ? 'ring-4 ring-amber-300 scale-105 z-10'
          : 'ring-2 ring-amber-400/90'
        : 'opacity-40'
    : '';

  return (
    <button
      ref={(el) => {
        droppable.setNodeRef(el);
        draggable.setNodeRef(el);
      }}
      {...draggable.listeners}
      {...draggable.attributes}
      onClick={aoClicar}
      className={`relative flex min-h-[92px] flex-col items-start justify-start rounded-xl p-2 text-left shadow-md transition ${MESA_COR[info.estado]} ${destaque} ${draggable.isDragging ? 'opacity-30' : ''}`}
      style={{ touchAction: 'manipulation' }}
      title={`Mesa ${numero} — ${MESA_ESTADO_LABEL[info.estado]}`}
    >
      <span className="text-lg font-black leading-none">{numero}</span>
      {info.reserva ? (
        <>
          <span className="mt-1 w-full text-[11px] font-bold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {info.reserva.origem === 'passante' && '🚶 '}
            {info.reserva.nome}
          </span>
          <span className="mt-auto text-[10px] font-semibold opacity-90">
            {TURNO_LABEL[info.reserva.turno]} · {statusCurto(info.reserva)}
          </span>
        </>
      ) : (
        <span className="mt-auto text-[10px] font-semibold opacity-90">{MESA_ESTADO_LABEL[info.estado]}</span>
      )}
      {arrastandoAlgo && recebimento === 'troca' && (
        <span className="absolute right-1 top-1 rounded bg-amber-400 px-1 text-[9px] font-black text-amber-950">
          troca
        </span>
      )}
    </button>
  );
}

/* ---------- Grupo + card de casal na lista lateral (arrastável) ---------- */
function GrupoCasais({
  titulo,
  cor,
  reservas,
  aoClicar,
}: {
  titulo: string;
  /** Classe bg-* do ponto de acento do grupo. */
  cor: string;
  reservas: Reserva[];
  aoClicar: (r: Reserva) => void;
}) {
  if (reservas.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-carvao-400 dark:text-carvao-300">
        <span className={`h-2 w-2 rounded-full ${cor}`} aria-hidden />
        {titulo}
        <span className="rounded-full bg-carvao-100 px-2 py-0.5 text-[10px] font-bold text-carvao-500 dark:bg-carvao-700 dark:text-carvao-200">
          {reservas.length}
        </span>
      </h3>
      <div className="space-y-2">
        {reservas.map((r) => (
          <CardCasal key={r.id} reserva={r} aoClicar={() => aoClicar(r)} />
        ))}
      </div>
    </div>
  );
}

/** Acento do card conforme a situação do casal. */
function acentoCasal(r: Reserva): string {
  if (r.status === 'sentado') return CASAL_ACENTO.sentado;
  if (r.status === 'chegou') return CASAL_ACENTO.chegou;
  if (r.status === 'finalizada') return CASAL_ACENTO.finalizada;
  if (r.status === 'cancelada' || r.status === 'no_show') return CASAL_ACENTO.encerrada;
  return r.table_id ? CASAL_ACENTO.definida : CASAL_ACENTO.aguardando;
}

function CardCasal({ reserva, aoClicar }: { reserva: Reserva; aoClicar: () => void }) {
  const arrastavel = STATUS_ATIVOS.includes(reserva.status);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `card-${reserva.id}`,
    data: { reserva },
    disabled: !arrastavel,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={aoClicar}
      role="button"
      className={`flex cursor-grab items-center gap-3 rounded-2xl bg-white p-3 shadow-suave ring-1 ring-carvao-200/70 transition-all duration-150 hover:ring-carvao-300 active:cursor-grabbing active:scale-[0.99] dark:bg-carvao-800 dark:ring-carvao-600/70 ${
        isDragging ? 'opacity-30' : ''
      } ${arrastavel ? '' : 'opacity-55'}`}
      style={{ touchAction: 'manipulation' }}
    >
      <span className={`h-10 w-1 shrink-0 rounded-full ${acentoCasal(reserva)}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold leading-snug text-carvao-900 dark:text-areia-50">
          {reserva.origem === 'passante' && <span title="Passante">🚶 </span>}
          {reserva.nome}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-carvao-400 dark:text-carvao-300">
          <span className="rounded-md bg-areia-100 px-1.5 py-0.5 font-bold text-carvao-600 dark:bg-carvao-700 dark:text-areia-200">
            {TURNO_LABEL[reserva.turno]}
          </span>
          <span>{reserva.mesa ? `Mesa ${reserva.mesa.numero}` : 'Sem mesa'}</span>
          <span className="text-carvao-300 dark:text-carvao-500">·</span>
          <span>{statusCurto(reserva)}</span>
          {reserva.origem === 'reserva' && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${PIX_BADGE[reserva.pix_status]}`}>
              Pix {PIX_LABEL[reserva.pix_status]}
            </span>
          )}
          {reserva.observacao && <span title={reserva.observacao}>📝</span>}
        </div>
      </div>
      {arrastavel && (
        <span className="shrink-0 text-lg text-carvao-200 dark:text-carvao-500" aria-hidden>
          ⠿
        </span>
      )}
    </div>
  );
}

/* ---------- Modal de passante ---------- */
function PassanteModal({
  aberto,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const { mesas, reservas, recarregar } = useDados();
  const [nome, setNome] = useState('');
  const [turno, setTurno] = useState<Turno>('19:00');
  const [tableId, setTableId] = useState('');
  const [pessoas, setPessoas] = useState('2');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const livres = useMemo(
    () =>
      mesas
        .filter((m) => m.ativa && estadoMesa(m, reservas, turno).estado === 'livre')
        .sort((a, b) => a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true })),
    [mesas, reservas, turno],
  );

  async function adicionar() {
    setSalvando(true);
    setErro('');
    try {
      await criarReserva({
        nome: nome.trim() || 'Passante',
        turno,
        table_id: tableId || null,
        status: tableId ? 'sentado' : 'chegou',
        origem: 'passante',
        pessoas: Number(pessoas) || 2,
        pix_status: 'isento',
      });
      await recarregar();
      setNome('');
      setTableId('');
      setPessoas('2');
      aoFechar();
      aoSalvar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar passante.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Adicionar passante" aberto={aberto} aoFechar={aoFechar}>
      <div className="space-y-4">
        <div>
          <label className={estiloRotulo}>Nome (opcional)</label>
          <input className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Casal da porta" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={estiloRotulo}>Turno</label>
            <select className={estiloInput} value={turno} onChange={(e) => setTurno(e.target.value as Turno)}>
              {TURNOS.map((t) => (
                <option key={t} value={t}>
                  {TURNO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={estiloRotulo}>Pessoas</label>
            <input className={estiloInput} value={pessoas} onChange={(e) => setPessoas(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div>
          <label className={estiloRotulo}>Mesa (opcional — pode arrastar depois)</label>
          <select className={estiloInput} value={tableId} onChange={(e) => setTableId(e.target.value)}>
            <option value="">Sem mesa (aguardando)</option>
            {livres.map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.numero}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm font-semibold text-carvao-400 dark:text-carvao-300">
          Passante não tem crédito Pix (R$ 0).
        </p>
        {erro && (
          <p className="rounded-2xl bg-[#f5e2df] px-4 py-3 text-sm font-semibold text-[#8e3a31] dark:bg-[#3e2421] dark:text-[#e3a49c]">
            {erro}
          </p>
        )}
        <Botao className="w-full" onClick={adicionar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Adicionar passante'}
        </Botao>
      </div>
    </Modal>
  );
}
