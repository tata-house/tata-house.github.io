'use client';

import { useMemo, useState } from 'react';
import { criarReserva, editarReserva } from '@/lib/actions';
import { AREA_LABEL, PIX_LABEL, STATUS_ATIVOS, STATUS_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { mesasLivres } from '@/lib/mesa-estado';
import type { Area, PixStatus, Reserva, ReservaStatus, Turno } from '@/lib/types';
import { Botao, Modal, estiloInput, estiloRotulo } from './ui';

export function FormularioReserva({
  aberto,
  aoFechar,
  reserva,
}: {
  aberto: boolean;
  aoFechar: () => void;
  reserva?: Reserva | null;
}) {
  const { mesas, reservas, recarregar } = useDados();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState(reserva?.nome ?? '');
  const [telefone, setTelefone] = useState(reserva?.telefone ?? '');
  const [turno, setTurno] = useState<Turno>(reserva?.turno ?? '19:00');
  const [area, setArea] = useState<Area | ''>(reserva?.area_preferida ?? '');
  const [tableId, setTableId] = useState(reserva?.table_id ?? '');
  const [status, setStatus] = useState<ReservaStatus>(reserva?.status ?? 'confirmada');
  const [pixStatus, setPixStatus] = useState<PixStatus>(reserva?.pix_status ?? 'pendente');
  const [observacao, setObservacao] = useState(reserva?.observacao ?? '');

  const livres = useMemo(
    () => mesasLivres(mesas, reservas, turno, reserva?.turno === turno ? reserva?.table_id : null),
    [mesas, reservas, turno, reserva],
  );

  async function salvar() {
    if (!nome.trim()) {
      setErro('Informe o nome.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const dados = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        turno,
        area_preferida: (area || null) as Area | null,
        table_id: tableId || null,
        status,
        pix_status: pixStatus,
        observacao: observacao.trim() || null,
      };
      if (reserva) {
        await editarReserva(reserva.id, dados);
      } else {
        await criarReserva({ ...dados, origem: 'reserva' });
      }
      await recarregar();
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={reserva ? 'Editar reserva' : 'Nova reserva'} aberto={aberto} aoFechar={aoFechar}>
      <div className="space-y-4">
        <div>
          <label className={estiloRotulo}>Nome do casal *</label>
          <input className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria e João" />
        </div>
        <div>
          <label className={estiloRotulo}>Telefone</label>
          <input className={estiloInput} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" />
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
            <label className={estiloRotulo}>Área preferida</label>
            <select className={estiloInput} value={area} onChange={(e) => setArea(e.target.value as Area | '')}>
              <option value="">Sem preferência</option>
              <option value="salao">{AREA_LABEL.salao}</option>
              <option value="varanda">{AREA_LABEL.varanda}</option>
            </select>
          </div>
        </div>
        <div>
          <label className={estiloRotulo}>Mesa (somente mesas livres no turno)</label>
          <select className={estiloInput} value={tableId} onChange={(e) => setTableId(e.target.value)}>
            <option value="">Sem mesa atribuída</option>
            {livres.map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.numero} — {AREA_LABEL[m.area]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={estiloRotulo}>Status</label>
            <select className={estiloInput} value={status} onChange={(e) => setStatus(e.target.value as ReservaStatus)}>
              {(reserva ? (Object.keys(STATUS_LABEL) as ReservaStatus[]) : STATUS_ATIVOS).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={estiloRotulo}>Pix (R$ 100)</label>
            <select className={estiloInput} value={pixStatus} onChange={(e) => setPixStatus(e.target.value as PixStatus)}>
              {(Object.keys(PIX_LABEL) as PixStatus[]).map((p) => (
                <option key={p} value={p}>
                  {PIX_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={estiloRotulo}>Observações</label>
          <textarea className={estiloInput} rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Aniversário, pedido especial, alergia..." />
        </div>
        {erro && <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">{erro}</p>}
        <div className="flex gap-3">
          <Botao variante="secundario" className="flex-1" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao className="flex-1" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
