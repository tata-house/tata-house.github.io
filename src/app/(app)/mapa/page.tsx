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
  type MovimentoMesa,
} from '@/lib/actions';
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
import { MESAS_OPERACIONAIS } from '@/lib/mapa-layout';
import {
  comoRecebe,
  estadoMesa,
  LIBERADA_MS,
  type EstadoDaMesa,
  type Recebimento,
  type TurnoMapa,
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

export default function MapaPage() {
  const { mesas, reservas, carregando, erro, supabaseHost, recarregar } = useDados();
  const [turno, setTurno] = useState<TurnoMapa>('agora');
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
  const mesasFaltando = useMemo(
    () => MESAS_OPERACIONAIS.filter((n) => !porNumero.has(n)),
    [porNumero],
  );

  // Mesas antigas (fora do layout 1-24) que ainda têm casal ativo nelas —
  // aparecem numa seção à parte até serem esvaziadas.
  const mesasAntigasOcupadas = useMemo(
    () =>
      mesas.filter(
        (m) =>
          !MESAS_OPERACIONAIS.includes(m.numero) &&
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

  // Lista lateral: grupos sem sobreposição (cada casal aparece UMA vez).
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
    const mesa = event.over?.data.current?.mesa as Mesa | null | undefined;
    if (!arrastada || !mesa) return;
    // usa a versão mais recente da reserva (a do drag pode estar defasada)
    const reserva = reservas.find((r) => r.id === arrastada.id) ?? arrastada;
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

  if (carregando) return <p className="py-10 text-center text-gray-500">Carregando...</p>;

  const infoSelecionada = mesaSelecionada ? (estadoDe.get(mesaSelecionada.id) ?? BLOQUEADA) : null;
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
        {(erro || mesas.length === 0) && (
          <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm dark:bg-red-950/40">
            <p className="font-black text-red-700 dark:text-red-300">
              {erro
                ? `Erro ao ler o banco: ${erro}`
                : 'Nenhuma mesa cadastrada no banco — o SQL de correção ainda não rodou neste projeto.'}
            </p>
            <p className="mt-1 text-red-800 dark:text-red-200">
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-black">Mapa de mesas</h1>
          <div className="flex flex-wrap gap-2">
            <Botao
              variante="secundario"
              disabled={movimentos.length === 0 || desfazendo}
              onClick={desfazerUltimo}
            >
              ↩️ {desfazendo ? 'Desfazendo...' : 'Desfazer última ação'}
            </Botao>
            <Botao onClick={() => setNovoCasal(true)}>➕ Nova reserva</Botao>
            <Botao variante="secundario" onClick={() => setNovoPassante(true)}>
              🚶 Passante
            </Botao>
          </div>
        </div>

        {/* Filtro de turno (vale para o mapa e para a lista) */}
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
              {t === 'agora' ? '⚡ Todos / Agora' : TURNO_LABEL[t]}
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

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,380px)]">
          {/* ---------- MAPA: 24 MESAS SEQUENCIAIS ---------- */}
          <div className="space-y-3">
            {mesasFaltando.length > 0 && (
              <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                As mesas {mesasFaltando.join(', ')} ainda não existem no banco — execute{' '}
                <b>supabase/mesas-1-a-24.sql</b> no SQL Editor do Supabase (uma vez só).
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
              {MESAS_OPERACIONAIS.map((numero) => {
                const mesa = porNumero.get(numero) ?? null;
                const info = mesa ? (estadoDe.get(mesa.id) ?? BLOQUEADA) : BLOQUEADA;
                return (
                  <MesaCard
                    key={numero}
                    numero={numero}
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

            {mesasAntigasOcupadas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
          <div className="space-y-3">
            <input
              className={estiloInput}
              placeholder="🔍 Buscar casal..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FILTRO_LABEL) as FiltroLista[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroLista(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    filtroLista === f
                      ? 'bg-brand-600 text-white shadow'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {FILTRO_LABEL[f]}
                </button>
              ))}
            </div>
            <div className="max-h-[80vh] space-y-4 overflow-y-auto pb-24 pr-1 lg:pb-2">
              {filtroLista === 'todos' ? (
                <>
                  <GrupoCasais titulo="⏳ Aguardando mesa" cor="text-amber-600 dark:text-amber-400" reservas={lista.aguardando} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="📍 Na mesa (reservado)" cor="text-blue-600 dark:text-blue-400" reservas={lista.naMesa} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="🟠 Chegaram" cor="text-orange-600 dark:text-orange-400" reservas={lista.chegaram} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="🔴 Sentados" cor="text-red-600 dark:text-red-400" reservas={lista.sentados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="✓ Finalizados" cor="text-gray-500" reservas={lista.finalizados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  <GrupoCasais titulo="👻 No-show / cancelados" cor="text-gray-400" reservas={lista.encerrados} aoClicar={(r) => cliqueProtegido(() => setReservaSelecionada(r))} />
                  {lista.doTurno.length === 0 && (
                    <div className="space-y-3 py-8 text-center">
                      <p className="text-sm text-gray-400">Nenhum casal neste turno.</p>
                      <Botao onClick={() => setNovoCasal(true)}>➕ Cadastrar reserva</Botao>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1.5">
                  {listaFiltrada.map((r) => (
                    <CardCasal key={r.id} reserva={r} aoClicar={() => cliqueProtegido(() => setReservaSelecionada(r))} />
                  ))}
                  {listaFiltrada.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-400">
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
        aberto={!!mesaSelecionada && !reservaSelecionada && !novaReservaMesa}
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
              <p className="text-gray-500 dark:text-gray-400">Mesa fora do layout operacional — bloqueada para reservas.</p>
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
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Ou coloque um casal que está aguardando:
                    </p>
                    {aguardandoParaMesa.slice(0, 8).map((r) => (
                      <button
                        key={r.id}
                        className="flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-left font-semibold transition active:scale-95 dark:bg-gray-700"
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
                        <span className="text-sm text-gray-500 dark:text-gray-300">{TURNO_LABEL[r.turno]} →</span>
                      </button>
                    ))}
                  </>
                )}
                <p className="text-sm text-gray-400">
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
          turnoInicial={turno !== 'agora' ? turno : undefined}
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
          turnoInicial={turno !== 'agora' ? turno : undefined}
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

/* ---------- Card de mesa na grade (arrastável + alvo de soltura) ---------- */
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
      <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-2 text-center text-gray-400 dark:border-gray-600">
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
          <span>
            {TURNO_LABEL[reserva.turno]} · {reserva.mesa ? `Mesa ${reserva.mesa.numero}` : 'Sem mesa'} ·{' '}
            {statusCurto(reserva)}
          </span>
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
