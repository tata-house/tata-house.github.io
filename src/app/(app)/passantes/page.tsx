'use client';

import { useMemo, useState } from 'react';
import { AcoesReserva } from '@/components/AcoesReserva';
import { SeletorTurno } from '@/components/SeletorTurno';
import { BadgeStatus, Botao, Cartao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { criarReserva } from '@/lib/actions';
import { AREA_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { mesasLivres } from '@/lib/mesa-estado';
import type { Reserva, Turno } from '@/lib/types';

export default function PassantesPage() {
  const { reservas, mesas, carregando, recarregar } = useDados();
  const [turnoFiltro, setTurnoFiltro] = useState<Turno | 'todos'>('todos');
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<Reserva | null>(null);

  // formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [turno, setTurno] = useState<Turno>('19:00');
  const [tableId, setTableId] = useState('');
  const [pessoas, setPessoas] = useState('2');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const passantes = useMemo(
    () =>
      reservas
        .filter((r) => r.origem === 'passante')
        .filter((r) => turnoFiltro === 'todos' || r.turno === turnoFiltro),
    [reservas, turnoFiltro],
  );

  const livres = useMemo(() => mesasLivres(mesas, reservas, turno), [mesas, reservas, turno]);

  async function adicionar() {
    setSalvando(true);
    setErro('');
    try {
      await criarReserva({
        nome: nome.trim() || 'Passante',
        telefone: telefone.trim() || null,
        turno,
        table_id: tableId || null,
        status: tableId ? 'sentado' : 'chegou',
        origem: 'passante',
        pessoas: Number(pessoas) || 2,
        pix_status: 'isento',
      });
      await recarregar();
      setAberto(false);
      setNome('');
      setTelefone('');
      setTableId('');
      setPessoas('2');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar passante.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Passantes</h1>
        <Botao onClick={() => setAberto(true)}>+ Adicionar passante</Botao>
      </div>

      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
        ℹ️ Passantes não têm crédito de reserva (Pix) e entram conforme disponibilidade de mesa.
      </p>

      <SeletorTurno valor={turnoFiltro} aoMudar={setTurnoFiltro} permitirTodos />

      {carregando ? (
        <p className="py-10 text-center text-gray-500">Carregando...</p>
      ) : passantes.length === 0 ? (
        <p className="py-10 text-center text-gray-500">Nenhum passante registrado.</p>
      ) : (
        <div className="space-y-2">
          {passantes.map((r) => (
            <Cartao key={r.id} className="cursor-pointer transition hover:border-brand-500">
              <button className="w-full text-left" onClick={() => setDetalhe(r)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">🚶 {r.nome}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Turno {r.turno} · Mesa {r.mesa?.numero ?? '—'} · {r.pessoas} pessoa(s)
                      {r.telefone ? ` · ${r.telefone}` : ''}
                    </div>
                  </div>
                  <BadgeStatus status={r.status} />
                </div>
              </button>
            </Cartao>
          ))}
        </div>
      )}

      <Modal titulo="Adicionar passante" aberto={aberto} aoFechar={() => setAberto(false)}>
        <div className="space-y-4">
          <div>
            <label className={estiloRotulo}>Nome (opcional)</label>
            <input className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Casal da porta" />
          </div>
          <div>
            <label className={estiloRotulo}>Telefone (opcional)</label>
            <input className={estiloInput} value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={estiloRotulo}>Turno</label>
              <select className={estiloInput} value={turno} onChange={(e) => setTurno(e.target.value as Turno)}>
                <option value="19:00">19:00</option>
                <option value="21:00">21:00</option>
              </select>
            </div>
            <div>
              <label className={estiloRotulo}>Pessoas</label>
              <input className={estiloInput} value={pessoas} onChange={(e) => setPessoas(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <div>
            <label className={estiloRotulo}>Mesa</label>
            <select className={estiloInput} value={tableId} onChange={(e) => setTableId(e.target.value)}>
              <option value="">Sem mesa (aguardando)</option>
              {livres.map((m) => (
                <option key={m.id} value={m.id}>
                  Mesa {m.numero} — {AREA_LABEL[m.area]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Crédito Pix: R$ 0 (passante)</p>
          {erro && (
            <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">{erro}</p>
          )}
          <Botao className="w-full" onClick={adicionar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Adicionar passante'}
          </Botao>
        </div>
      </Modal>

      <AcoesReserva reserva={detalhe} aberto={!!detalhe} aoFechar={() => setDetalhe(null)} />
    </div>
  );
}
