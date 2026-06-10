'use client';

import { useMemo, useState } from 'react';
import { criarReserva, editarReserva } from '@/lib/actions';
import { PIX_LABEL, TURNOS, TURNO_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { mesasLivres } from '@/lib/mesa-estado';
import type { PixStatus, Reserva, Turno } from '@/lib/types';
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
  const [tableId, setTableId] = useState(reserva?.table_id ?? '');
  const [pixStatus, setPixStatus] = useState<PixStatus>(reserva?.pix_status ?? 'pendente');
  const [observacao, setObservacao] = useState(reserva?.observacao ?? '');

  const livres = useMemo(
    () => mesasLivres(mesas, reservas, turno, reserva?.turno === turno ? reserva?.table_id : null),
    [mesas, reservas, turno, reserva],
  );

  async function salvar() {
    if (!nome.trim()) {
      setErro('Informe o nome do casal.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const dados = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        turno,
        table_id: tableId || null,
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
    <Modal titulo={reserva ? 'Editar casal' : 'Novo casal'} aberto={aberto} aoFechar={aoFechar}>
      <div className="space-y-4">
        <div>
          <label className={estiloRotulo}>Nome do casal *</label>
          <input className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria e João" />
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
          <label className={estiloRotulo}>Mesa (opcional — dá para arrastar no mapa depois)</label>
          <select className={estiloInput} value={tableId} onChange={(e) => setTableId(e.target.value)}>
            <option value="">Sem mesa (aguardando)</option>
            {livres.map((m) => (
              <option key={m.id} value={m.id}>
                Mesa {m.numero}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={estiloRotulo}>Telefone (opcional)</label>
          <input className={estiloInput} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" />
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
