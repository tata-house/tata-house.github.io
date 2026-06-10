'use client';

import { useEffect, useMemo, useState } from 'react';
import { SeletorTurno } from '@/components/SeletorTurno';
import { Botao, Cartao } from '@/components/ui';
import { AREA_LABEL, PIX_LABEL, STATUS_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { baixarCsv } from '@/lib/csv';
import { brl, dataHora } from '@/lib/format';
import { getSupabase } from '@/lib/supabase/client';
import type { CashClosure, Turno } from '@/lib/types';

type Aba = 'chegada' | 'caixa' | 'passantes' | 'noshow';

export default function RelatoriosPage() {
  const { reservas, carregando } = useDados();
  const [aba, setAba] = useState<Aba>('chegada');
  const [turno, setTurno] = useState<Turno | 'todos'>('todos');
  const [fechamentos, setFechamentos] = useState<CashClosure[]>([]);

  useEffect(() => {
    getSupabase()
      .from('cash_closures')
      .select('*')
      .order('fechado_em', { ascending: true })
      .then(({ data }) => {
        if (data) setFechamentos(data as CashClosure[]);
      });
  }, [reservas]);

  const filtroTurno = (t: Turno) => turno === 'todos' || t === turno;

  const chegada = useMemo(
    () =>
      reservas
        .filter((r) => r.origem === 'reserva' && !['cancelada'].includes(r.status))
        .filter((r) => filtroTurno(r.turno))
        .sort(
          (a, b) =>
            a.turno.localeCompare(b.turno) ||
            (a.mesa?.numero ?? '').localeCompare(b.mesa?.numero ?? '', 'pt-BR', { numeric: true }),
        ),
    [reservas, turno],
  );

  const caixa = useMemo(() => {
    const porReserva = new Map(fechamentos.map((f) => [f.reservation_id, f]));
    return reservas
      .filter((r) => filtroTurno(r.turno))
      .filter((r) => r.credito_aplicado || porReserva.has(r.id))
      .map((r) => ({ reserva: r, fechamento: porReserva.get(r.id) ?? null }));
  }, [reservas, fechamentos, turno]);

  const passantes = useMemo(
    () => reservas.filter((r) => r.origem === 'passante').filter((r) => filtroTurno(r.turno)),
    [reservas, turno],
  );

  const noShow = useMemo(
    () => reservas.filter((r) => r.status === 'no_show').filter((r) => filtroTurno(r.turno)),
    [reservas, turno],
  );

  function exportar() {
    if (aba === 'chegada') {
      baixarCsv(
        `lista-chegada-${turno}.csv`,
        ['Turno', 'Mesa', 'Área', 'Nome', 'Telefone', 'Pessoas', 'Status', 'Pix', 'Observações'],
        chegada.map((r) => [
          r.turno,
          r.mesa?.numero ?? '',
          r.mesa ? AREA_LABEL[r.mesa.area] : '',
          r.nome,
          r.telefone,
          r.pessoas,
          STATUS_LABEL[r.status],
          PIX_LABEL[r.pix_status],
          r.observacao,
        ]),
      );
    } else if (aba === 'caixa') {
      baixarCsv(
        `caixa-creditos-${turno}.csv`,
        ['Turno', 'Mesa', 'Nome', 'Origem', 'Pix', 'Crédito aplicado', 'Aplicado em', 'Valor conta', 'Crédito usado', 'Valor pago', 'Fechado em'],
        caixa.map(({ reserva: r, fechamento: f }) => [
          r.turno,
          r.mesa?.numero ?? '',
          r.nome,
          r.origem,
          PIX_LABEL[r.pix_status],
          r.credito_aplicado ? 'Sim' : 'Não',
          r.credito_aplicado_em ? dataHora(r.credito_aplicado_em) : '',
          f ? f.valor_conta : '',
          f ? f.credito_aplicado_valor : '',
          f ? f.valor_pago : '',
          f ? dataHora(f.fechado_em) : '',
        ]),
      );
    } else if (aba === 'passantes') {
      baixarCsv(
        `passantes-${turno}.csv`,
        ['Turno', 'Mesa', 'Nome', 'Telefone', 'Pessoas', 'Status', 'Criado em'],
        passantes.map((r) => [
          r.turno,
          r.mesa?.numero ?? '',
          r.nome,
          r.telefone,
          r.pessoas,
          STATUS_LABEL[r.status],
          dataHora(r.data_criacao),
        ]),
      );
    } else {
      baixarCsv(
        `no-show-${turno}.csv`,
        ['Turno', 'Mesa', 'Nome', 'Telefone', 'Pix', 'Observações'],
        noShow.map((r) => [
          r.turno,
          r.mesa?.numero ?? '',
          r.nome,
          r.telefone,
          PIX_LABEL[r.pix_status],
          r.observacao,
        ]),
      );
    }
  }

  const abas: { id: Aba; rotulo: string }[] = [
    { id: 'chegada', rotulo: '📋 Lista de chegada' },
    { id: 'caixa', rotulo: '💰 Caixa / créditos' },
    { id: 'passantes', rotulo: '🚶 Passantes' },
    { id: 'noshow', rotulo: '👻 No-show' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-black">Relatórios</h1>
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={() => window.print()}>
            🖨️ Imprimir
          </Botao>
          <Botao onClick={exportar}>⬇️ Exportar CSV</Botao>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold ${
              aba === a.id
                ? 'bg-brand-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div className="print:hidden">
        <SeletorTurno valor={turno} aoMudar={setTurno} permitirTodos />
      </div>

      {/* Cabeçalho de impressão */}
      <div className="hidden print:block">
        <h1 className="text-xl font-black">
          TATA SUSHI — Dia dos Namorados — {abas.find((a) => a.id === aba)?.rotulo}
          {turno !== 'todos' ? ` — Turno ${turno}` : ''}
        </h1>
      </div>

      {carregando ? (
        <p className="py-10 text-center text-gray-500">Carregando...</p>
      ) : (
        <Cartao className="overflow-x-auto print:border-0 print:p-0 print:shadow-none">
          {aba === 'chegada' && (
            <Tabela
              cabecalho={['Turno', 'Mesa', 'Nome', 'Telefone', 'Status', 'Pix', 'Obs.', 'Chegou ☐']}
              linhas={chegada.map((r) => [
                r.turno,
                r.mesa?.numero ?? '—',
                r.nome,
                r.telefone ?? '—',
                STATUS_LABEL[r.status],
                PIX_LABEL[r.pix_status],
                r.observacao ?? '',
                '☐',
              ])}
            />
          )}
          {aba === 'caixa' && (
            <Tabela
              cabecalho={['Turno', 'Mesa', 'Nome', 'Crédito', 'Aplicado em', 'Conta', 'Pago', 'Fechado em']}
              linhas={caixa.map(({ reserva: r, fechamento: f }) => [
                r.turno,
                r.mesa?.numero ?? '—',
                r.nome,
                r.credito_aplicado ? `✓ ${brl(r.credito_disponivel)}` : '—',
                r.credito_aplicado_em ? dataHora(r.credito_aplicado_em) : '—',
                f ? brl(f.valor_conta) : '—',
                f ? brl(f.valor_pago) : '—',
                f ? dataHora(f.fechado_em) : '—',
              ])}
            />
          )}
          {aba === 'passantes' && (
            <Tabela
              cabecalho={['Turno', 'Mesa', 'Nome', 'Telefone', 'Pessoas', 'Status', 'Registrado em']}
              linhas={passantes.map((r) => [
                r.turno,
                r.mesa?.numero ?? '—',
                r.nome,
                r.telefone ?? '—',
                String(r.pessoas),
                STATUS_LABEL[r.status],
                dataHora(r.data_criacao),
              ])}
            />
          )}
          {aba === 'noshow' && (
            <Tabela
              cabecalho={['Turno', 'Mesa', 'Nome', 'Telefone', 'Pix', 'Obs.']}
              linhas={noShow.map((r) => [
                r.turno,
                r.mesa?.numero ?? '—',
                r.nome,
                r.telefone ?? '—',
                PIX_LABEL[r.pix_status],
                r.observacao ?? '',
              ])}
            />
          )}
        </Cartao>
      )}
    </div>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: (string | null)[][] }) {
  if (linhas.length === 0) {
    return <p className="py-6 text-center text-gray-500">Nenhum registro.</p>;
  }
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="border-b-2 border-gray-300 text-left dark:border-gray-600">
          {cabecalho.map((c) => (
            <th key={c} className="py-2 pr-3 font-bold">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha, i) => (
          <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
            {linha.map((celula, j) => (
              <td key={j} className="py-2 pr-3">
                {celula}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
