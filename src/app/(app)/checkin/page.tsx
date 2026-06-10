'use client';

import { useMemo, useState } from 'react';
import { AcoesReserva } from '@/components/AcoesReserva';
import { SeletorTurno } from '@/components/SeletorTurno';
import { BadgeStatus, Botao, Cartao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { marcarChegou, marcarNoShow, moverMesa, sentarCliente } from '@/lib/actions';
import { AREA_LABEL, STATUS_ATIVOS } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { mesasLivres } from '@/lib/mesa-estado';
import type { Reserva, Turno } from '@/lib/types';

export default function CheckinPage() {
  const { reservas, mesas, carregando, recarregar } = useDados();
  const [turno, setTurno] = useState<Turno | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [movendo, setMovendo] = useState<Reserva | null>(null);
  const [novaMesa, setNovaMesa] = useState('');
  const [detalhe, setDetalhe] = useState<Reserva | null>(null);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return reservas
      .filter((r) => STATUS_ATIVOS.includes(r.status))
      .filter((r) => turno === 'todos' || r.turno === turno)
      .filter((r) => !termo || r.nome.toLowerCase().includes(termo) || (r.telefone ?? '').includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [reservas, turno, busca]);

  const livresParaMover = useMemo(
    () => (movendo ? mesasLivres(mesas, reservas, movendo.turno) : []),
    [mesas, reservas, movendo],
  );

  async function executar(id: string, acao: () => Promise<void>) {
    setOcupada(id);
    setErro('');
    try {
      await acao();
      await recarregar();
      setMovendo(null);
      setNovaMesa('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro na ação.');
    } finally {
      setOcupada(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Check-in da recepção</h1>
      <SeletorTurno valor={turno} aoMudar={setTurno} permitirTodos />
      <input
        className={`${estiloInput} text-lg`}
        placeholder="🔍 Nome ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        autoFocus
      />

      {erro && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="py-10 text-center text-gray-500">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="py-10 text-center text-gray-500">Nenhuma reserva ativa encontrada.</p>
      ) : (
        <div className="space-y-3">
          {lista.map((r) => (
            <Cartao key={r.id}>
              <button className="w-full text-left" onClick={() => setDetalhe(r)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">
                      {r.origem === 'passante' && '🚶 '}
                      {r.nome}
                    </div>
                    <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Turno {r.turno} · Mesa {r.mesa ? `${r.mesa.numero} (${AREA_LABEL[r.mesa.area]})` : '— sem mesa'}
                      {r.telefone ? ` · ${r.telefone}` : ''}
                    </div>
                    {r.observacao && (
                      <div className="mt-1 rounded-lg bg-yellow-50 px-2 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                        📝 {r.observacao}
                      </div>
                    )}
                  </div>
                  <BadgeStatus status={r.status} />
                </div>
              </button>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Botao
                  variante="alerta"
                  className="!px-1 text-sm"
                  disabled={ocupada === r.id || r.status === 'chegou' || r.status === 'sentado'}
                  onClick={() => executar(r.id, () => marcarChegou(r.id))}
                >
                  ✅ Chegou
                </Botao>
                <Botao
                  variante="perigo"
                  className="!px-1 text-sm"
                  disabled={ocupada === r.id || r.status === 'sentado' || !r.table_id}
                  onClick={() => executar(r.id, () => sentarCliente(r.id))}
                >
                  🪑 Sentar
                </Botao>
                <Botao
                  variante="secundario"
                  className="!px-1 text-sm"
                  disabled={ocupada === r.id}
                  onClick={() => {
                    setMovendo(r);
                    setNovaMesa('');
                  }}
                >
                  🔄 Mover
                </Botao>
                <Botao
                  variante="secundario"
                  className="!px-1 text-sm"
                  disabled={ocupada === r.id || r.status === 'sentado'}
                  onClick={() => {
                    if (window.confirm(`Marcar ${r.nome} como no-show?`)) {
                      void executar(r.id, () => marcarNoShow(r.id));
                    }
                  }}
                >
                  👻 No-show
                </Botao>
              </div>
            </Cartao>
          ))}
        </div>
      )}

      {/* Mover mesa */}
      <Modal titulo={`Mover ${movendo?.nome ?? ''}`} aberto={!!movendo} aoFechar={() => setMovendo(null)}>
        {movendo && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mesa atual: {movendo.mesa?.numero ?? 'sem mesa'} · Turno {movendo.turno}
            </p>
            <label className={estiloRotulo}>Nova mesa (livres no turno)</label>
            <select className={estiloInput} value={novaMesa} onChange={(e) => setNovaMesa(e.target.value)}>
              <option value="">Escolha...</option>
              {livresParaMover.map((m) => (
                <option key={m.id} value={m.id}>
                  Mesa {m.numero} — {AREA_LABEL[m.area]}
                </option>
              ))}
            </select>
            <Botao
              className="w-full"
              disabled={!novaMesa || ocupada === movendo.id}
              onClick={() => executar(movendo.id, () => moverMesa(movendo.id, novaMesa))}
            >
              Confirmar troca de mesa
            </Botao>
          </div>
        )}
      </Modal>

      <AcoesReserva reserva={detalhe} aberto={!!detalhe} aoFechar={() => setDetalhe(null)} />
    </div>
  );
}
