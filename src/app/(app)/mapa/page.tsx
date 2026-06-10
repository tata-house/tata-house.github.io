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
import { criarReserva, moverMesa } from '@/lib/actions';
import {
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
import { estadoMesa, mesaPodeReceber, LIBERADA_MS, type TurnoMapa } from '@/lib/mesa-estado';
import type { Mesa, Reserva, Turno } from '@/lib/types';

const LEGENDA: MesaEstado[] = ['livre', 'reservada', 'chegou', 'ocupada', 'limpeza', 'bloqueada'];

export default function MapaPage() {
  const { mesas, reservas, carregando, recarregar } = useDados();
  const [turno, setTurno] = useState<TurnoMapa>('agora');
  const [busca, setBusca] = useState('');
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [reservaSelecionada, setReservaSelecionada] = useState<Reserva | null>(null);
  const [arrastando, setArrastando] = useState<Reserva | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [novoCasal, setNovoCasal] = useState(false);
  const [novoPassante, setNovoPassante] = useState(false);
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

  // "tique" força recálculo periódico: mesa cinza ("liberada") volta a livre sozinha.
  const estadoDe = useMemo(() => {
    const mapa = new Map<string, ReturnType<typeof estadoMesa>>();
    mesas.forEach((m) => mapa.set(m.id, estadoMesa(m, reservas, turno)));
    return mapa;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesas, reservas, turno, tique]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const doTurno = reservas
      .filter((r) => turno === 'agora' || r.turno === turno)
      .filter((r) => !termo || r.nome.toLowerCase().includes(termo))
      .sort(
        (a, b) =>
          TURNOS.indexOf(a.turno) - TURNOS.indexOf(b.turno) || a.nome.localeCompare(b.nome, 'pt-BR'),
      );
    return {
      aguardando: doTurno.filter((r) => STATUS_ATIVOS.includes(r.status) && !r.table_id && r.status !== 'sentado'),
      naMesa: doTurno.filter(
        (r) => r.table_id && STATUS_ATIVOS.includes(r.status) && r.status !== 'chegou' && r.status !== 'sentado',
      ),
      chegaram: doTurno.filter((r) => r.status === 'chegou'),
      sentados: doTurno.filter((r) => r.status === 'sentado'),
      finalizados: doTurno.filter((r) => r.status === 'finalizada'),
      encerrados: doTurno.filter((r) => r.status === 'no_show' || r.status === 'cancelada'),
    };
  }, [reservas, turno, busca]);

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

  async function aoSoltar(event: DragEndEvent) {
    setArrastando(null);
    marcarArraste();
    const arrastada = event.active.data.current?.reserva as Reserva | undefined;
    const mesa = event.over?.data.current?.mesa as Mesa | undefined;
    if (!arrastada || !mesa) return;
    // usa a versão mais recente da reserva (a do drag pode estar defasada)
    const reserva = reservas.find((r) => r.id === arrastada.id) ?? arrastada;
    if (mesa.id === reserva.table_id) return;
    if (!mesa.ativa) {
      setAviso({ tipo: 'erro', texto: `Mesa ${mesa.numero} está bloqueada.` });
      return;
    }
    if (!mesaPodeReceber(mesa, reservas, reserva)) {
      setAviso({ tipo: 'erro', texto: 'Mesa já ocupada. Libere a mesa ou escolha outra.' });
      return;
    }
    try {
      await moverMesa(reserva.id, mesa.id);
      await recarregar();
      setAviso({
        tipo: 'ok',
        texto: reserva.mesa
          ? `${reserva.nome}: mesa ${reserva.mesa.numero} → mesa ${mesa.numero} ✓`
          : `${reserva.nome} → mesa ${mesa.numero} ✓`,
      });
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao mover.' });
      await recarregar();
    }
  }

  if (carregando) return <p className="py-10 text-center text-gray-500">Carregando...</p>;

  const infoSelecionada = mesaSelecionada ? estadoDe.get(mesaSelecionada.id) : null;
  const aguardandoParaMesa = mesaSelecionada
    ? reservas.filter(
        (r) =>
          STATUS_ATIVOS.includes(r.status) &&
          !r.table_id &&
          (turno === 'agora' || r.turno === turno),
      )
    : [];

  return (
    <DndContext sensors={sensores} onDragStart={aoIniciarArraste} onDragEnd={aoSoltar} onDragCancel={aoCancelar}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-black">Mapa de mesas</h1>
          <div className="flex gap-2">
            <Botao className="text-sm" onClick={() => setNovoCasal(true)}>
              + Casal
            </Botao>
            <Botao variante="secundario" className="text-sm" onClick={() => setNovoPassante(true)}>
              + Passante
            </Botao>
          </div>
        </div>

        {/* Filtro de turno do mapa */}
        <div className="flex gap-2">
          {([...TURNOS, 'agora'] as TurnoMapa[]).map((t) => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`min-h-12 flex-1 rounded-xl px-3 text-base font-bold transition ${
                turno === t
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {t === 'agora' ? '⚡ Agora' : TURNO_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
          {LEGENDA.map((e) => (
            <span key={e} className="flex items-center gap-1">
              <span className={`inline-block h-3.5 w-3.5 rounded ${MESA_COR[e].split(' ')[0]}`} />
              {MESA_ESTADO_LABEL[e]}
            </span>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* ---------- PLANTA DO RESTAURANTE ---------- */}
          <div className="mx-auto w-full max-w-[600px]">
            <div className="relative aspect-[10/16] w-full select-none overflow-hidden rounded-2xl border-4 border-gray-800 shadow-lg dark:border-gray-600">
              {/* piso do salão (madeira) */}
              <div className="absolute inset-x-0 top-0 h-[65%] bg-[#cfa86b] dark:bg-[#6b5337]" />
              {/* piso da varanda */}
              <div className="absolute inset-x-0 bottom-0 h-[35%] bg-stone-300 dark:bg-stone-600" />
              {/* divisória salão/varanda */}
              <div className="absolute inset-x-0 top-[65%] border-t-4 border-gray-800/70 dark:border-gray-300/40" />
              <span className="absolute left-2 top-[65.5%] rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                ÁREA EXTERNA
              </span>
              <span className="absolute left-2 top-1 rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                SALÃO PRINCIPAL
              </span>

              {/* balcão do bar (topo) */}
              <div className="absolute left-[30%] top-[1.2%] h-[2.6%] w-[46%] rounded-md bg-red-950/90">
                <span className="flex h-full items-center justify-center text-[9px] font-black tracking-widest text-red-200">
                  BAR
                </span>
              </div>
              {/* barra fria / sushi */}
              <div className="absolute left-[20%] top-[36%] h-[25%] w-[7%] rounded-lg border border-gray-400 bg-gray-200 dark:bg-gray-400">
                <span className="flex h-full items-center justify-center text-[9px] font-black tracking-widest text-gray-600 [writing-mode:vertical-lr]">
                  SUSHI
                </span>
              </div>
              {/* sofás (faixas) */}
              <div className="absolute left-[85%] top-[9%] h-[24%] w-[2.5%] rounded bg-slate-700/80" />
              <div className="absolute left-[85%] top-[34.5%] h-[30%] w-[2.5%] rounded bg-slate-700/80" />
              <div className="absolute left-[10%] top-[11%] h-[19%] w-[2.5%] rounded bg-slate-700/80" />
              <div className="absolute left-[73%] top-[69%] h-[26%] w-[2.5%] rounded bg-slate-700/80" />

              {/* mesas */}
              {mesas.map((m) => (
                <MesaChip
                  key={m.id}
                  mesa={m}
                  info={estadoDe.get(m.id)!}
                  podeReceber={arrastando ? mesaPodeReceber(m, reservas, arrastando) : false}
                  arrastandoAlgo={!!arrastando}
                  aoClicar={() => cliqueProtegido(() => setMesaSelecionada(m))}
                />
              ))}
            </div>
          </div>

          {/* ---------- LISTA DE CASAIS ---------- */}
          <div className="space-y-3">
            <input
              className={estiloInput}
              placeholder="🔍 Buscar casal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="max-h-[75vh] space-y-4 overflow-y-auto pb-24 pr-1 lg:pb-2">
              <GrupoCasais titulo="⏳ Aguardando mesa" cor="text-amber-600 dark:text-amber-400" reservas={lista.aguardando} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
              <GrupoCasais titulo="📍 Na mesa (reservado)" cor="text-blue-600 dark:text-blue-400" reservas={lista.naMesa} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
              <GrupoCasais titulo="🟠 Chegaram" cor="text-orange-600 dark:text-orange-400" reservas={lista.chegaram} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
              <GrupoCasais titulo="🔴 Sentados" cor="text-red-600 dark:text-red-400" reservas={lista.sentados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
              <GrupoCasais titulo="✓ Finalizados" cor="text-gray-500" reservas={lista.finalizados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
              <GrupoCasais titulo="👻 No-show / cancelados" cor="text-gray-400" reservas={lista.encerrados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
              {Object.values(lista).every((g) => g.length === 0) && (
                <p className="py-8 text-center text-sm text-gray-400">Nenhum casal neste turno.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* fantasma que segue o dedo durante o arraste */}
      <DragOverlay dropAnimation={null}>
        {arrastando && (
          <div className="rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-2xl ring-4 ring-brand-300">
            {arrastando.nome}
            <span className="ml-2 rounded bg-white/20 px-1.5 text-xs">{TURNO_LABEL[arrastando.turno]}</span>
          </div>
        )}
      </DragOverlay>

      {/* aviso (toast) */}
      {aviso && (
        <div
          className={`fixed bottom-24 left-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 rounded-2xl px-5 py-4 text-center text-base font-bold text-white shadow-2xl md:bottom-8 ${
            aviso.tipo === 'ok' ? 'bg-brand-600' : 'bg-red-600'
          }`}
        >
          {aviso.texto}
        </div>
      )}

      {/* ---------- MODAL DA MESA ---------- */}
      <Modal
        titulo={mesaSelecionada ? `Mesa ${mesaSelecionada.numero}` : ''}
        aberto={!!mesaSelecionada && !reservaSelecionada}
        aoFechar={() => setMesaSelecionada(null)}
      >
        {mesaSelecionada && infoSelecionada && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-5 w-5 rounded ${MESA_COR[infoSelecionada.estado].split(' ')[0]}`} />
              <span className="text-lg font-black">{MESA_ESTADO_LABEL[infoSelecionada.estado]}</span>
              {turno !== 'agora' && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold dark:bg-gray-700">
                  {TURNO_LABEL[turno]}
                </span>
              )}
            </div>
            {mesaSelecionada.observacao && (
              <p className="text-sm text-gray-500 dark:text-gray-400">📍 {mesaSelecionada.observacao}</p>
            )}

            {infoSelecionada.reserva ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="text-lg font-bold">{infoSelecionada.reserva.nome}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold dark:bg-gray-700">
                      {TURNO_LABEL[infoSelecionada.reserva.turno]}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold dark:bg-gray-700">
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
              <p className="text-gray-500 dark:text-gray-400">Mesa de apoio/balcão — bloqueada para uso.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-500 dark:text-gray-400">
                  Mesa livre. Arraste um casal da lista até ela, ou escolha abaixo:
                </p>
                {aguardandoParaMesa.slice(0, 8).map((r) => (
                  <button
                    key={r.id}
                    className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-left font-semibold transition active:scale-95 dark:bg-gray-700"
                    onClick={async () => {
                      try {
                        await moverMesa(r.id, mesaSelecionada.id);
                        await recarregar();
                        setMesaSelecionada(null);
                        setAviso({ tipo: 'ok', texto: `${r.nome} → mesa ${mesaSelecionada.numero} ✓` });
                      } catch (e) {
                        setAviso({ tipo: 'erro', texto: e instanceof Error ? e.message : 'Erro ao atribuir.' });
                      }
                    }}
                  >
                    <span>{r.nome}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-300">{TURNO_LABEL[r.turno]} →</span>
                  </button>
                ))}
                {aguardandoParaMesa.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum casal aguardando mesa neste turno.</p>
                )}
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

      {/* novo casal */}
      {novoCasal && <FormularioReserva aberto={novoCasal} aoFechar={() => setNovoCasal(false)} />}

      {/* novo passante */}
      <PassanteModal
        aberto={novoPassante}
        aoFechar={() => setNovoPassante(false)}
        aoSalvar={() => setAviso({ tipo: 'ok', texto: 'Passante adicionado ✓' })}
      />
    </DndContext>
  );
}

/* ---------- Chip de mesa (arrastável + alvo de soltura) ---------- */
function MesaChip({
  mesa,
  info,
  podeReceber,
  arrastandoAlgo,
  aoClicar,
}: {
  mesa: Mesa;
  info: ReturnType<typeof estadoMesa>;
  podeReceber: boolean;
  arrastandoAlgo: boolean;
  aoClicar: () => void;
}) {
  const reservaArrastavel = info.reserva && STATUS_ATIVOS.includes(info.reserva.status) ? info.reserva : null;
  const droppable = useDroppable({ id: `mesa-${mesa.id}`, data: { mesa }, disabled: !mesa.ativa });
  const draggable = useDraggable({
    id: `mesa-res-${mesa.id}`,
    data: { reserva: reservaArrastavel },
    disabled: !reservaArrastavel,
  });

  const destaque =
    arrastandoAlgo && podeReceber
      ? droppable.isOver
        ? 'ring-4 ring-white scale-125 z-20'
        : 'ring-4 ring-brand-300/90 animate-pulse'
      : droppable.isOver
        ? 'ring-4 ring-red-400'
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
      className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-lg text-sm font-black shadow-md transition sm:h-14 sm:w-14 ${MESA_COR[info.estado]} ${destaque} ${draggable.isDragging ? 'opacity-30' : ''}`}
      style={{ left: `${mesa.pos_x}%`, top: `${mesa.pos_y}%`, touchAction: 'manipulation' }}
      title={`Mesa ${mesa.numero} — ${MESA_ESTADO_LABEL[info.estado]}`}
    >
      <span className="text-base leading-none sm:text-lg">{mesa.numero}</span>
      {info.reserva && (
        <span className="max-w-full truncate px-0.5 text-[8px] font-semibold leading-tight sm:text-[9px]">
          {info.reserva.nome.split(' ')[0]}
        </span>
      )}
    </button>
  );
}

/* ---------- Card de casal na lista lateral (arrastável) ---------- */
function GrupoCasais({
  titulo,
  cor,
  reservas,
  aoClicar,
}: {
  titulo: string;
  cor: string;
  reservas: Reserva[];
  aoClicar: (r: Reserva) => void;
}) {
  if (reservas.length === 0) return null;
  return (
    <div>
      <h3 className={`mb-1.5 text-xs font-black uppercase tracking-wide ${cor}`}>
        {titulo} · {reservas.length}
      </h3>
      <div className="space-y-1.5">
        {reservas.map((r) => (
          <CardCasal key={r.id} reserva={r} aoClicar={() => aoClicar(r)} />
        ))}
      </div>
    </div>
  );
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
      className={`flex cursor-grab items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800 ${
        isDragging ? 'opacity-30' : ''
      } ${arrastavel ? '' : 'opacity-60'}`}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="min-w-0">
        <div className="truncate font-bold">
          {reserva.origem === 'passante' && '🚶 '}
          {reserva.nome}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span>{TURNO_LABEL[reserva.turno]}</span>
          <span>· {reserva.mesa ? `Mesa ${reserva.mesa.numero}` : 'sem mesa'}</span>
          {reserva.origem === 'reserva' && (
            <span className={`rounded-full px-2 py-0.5 ${PIX_BADGE[reserva.pix_status]}`}>
              Pix {PIX_LABEL[reserva.pix_status]}
            </span>
          )}
          {reserva.observacao && <span title={reserva.observacao}>📝</span>}
        </div>
      </div>
      {arrastavel && <span className="shrink-0 text-lg text-gray-300 dark:text-gray-500">⠿</span>}
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
    () => mesas.filter((m) => m.ativa && estadoMesa(m, reservas, turno).estado === 'livre'),
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
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          Passante não tem crédito Pix (R$ 0).
        </p>
        {erro && (
          <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">
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
