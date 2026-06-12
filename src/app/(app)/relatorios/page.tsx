'use client';

import { useEffect, useMemo, useState } from 'react';
import { SeletorTurno } from '@/components/SeletorTurno';
import { Botao, Cartao } from '@/components/ui';
import { AREA_LABEL, PIX_LABEL, STATUS_LABEL, TURNOS, TURNO_LABEL } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { baixarCsv } from '@/lib/csv';
import { brl, dataHora } from '@/lib/format';
import { getSupabase } from '@/lib/supabase/client';
import type { CashClosure, Turno } from '@/lib/types';

type Aba = 'resumo' | 'chegada' | 'caixa' | 'passantes' | 'noshow';

export default function RelatoriosPage() {
  const { reservas, carregando } = useDados();
  const [aba, setAba] = useState<Aba>('resumo');
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

  // Resumo da noite: totais gerais + quebra por turno (ignora o filtro).
  const resumo = useMemo(() => {
    const porId = new Map(reservas.map((r) => [r.id, r]));
    const linhaDe = (filtro: (t: Turno) => boolean) => {
      const rs = reservas.filter((r) => filtro(r.turno));
      const fs = fechamentos.filter((f) => {
        const r = porId.get(f.reservation_id);
        return r ? filtro(r.turno) : false;
      });
      return {
        reservas: rs.filter((r) => r.origem === 'reserva' && r.status !== 'cancelada').length,
        passantes: rs.filter((r) => r.origem === 'passante' && r.status !== 'cancelada').length,
        finalizadas: rs.filter((r) => r.status === 'finalizada').length,
        noShow: rs.filter((r) => r.status === 'no_show').length,
        faturado: fs.reduce((soma, f) => soma + Number(f.valor_conta), 0),
        creditos: fs.reduce((soma, f) => soma + Number(f.credito_aplicado_valor), 0),
        recebido: fs.reduce((soma, f) => soma + Number(f.valor_pago), 0),
      };
    };
    return {
      porTurno: TURNOS.map((t) => ({ turno: t, ...linhaDe((x) => x === t) })),
      geral: linhaDe(() => true),
    };
  }, [reservas, fechamentos]);

  function exportar() {
    if (aba === 'resumo') {
      baixarCsv(
        'resumo-da-noite.csv',
        ['Turno', 'Reservas', 'Passantes', 'Finalizadas', 'No-show', 'Faturado', 'Créditos usados', 'Recebido'],
        [
          ...resumo.porTurno.map((l) => [
            TURNO_LABEL[l.turno],
            l.reservas, l.passantes, l.finalizadas, l.noShow,
            l.faturado.toFixed(2), l.creditos.toFixed(2), l.recebido.toFixed(2),
          ]),
          ['TOTAL', resumo.geral.reservas, resumo.geral.passantes, resumo.geral.finalizadas,
           resumo.geral.noShow, resumo.geral.faturado.toFixed(2),
           resumo.geral.creditos.toFixed(2), resumo.geral.recebido.toFixed(2)],
        ].map((linha) => linha.map(String)),
      );
    } else if (aba === 'chegada') {
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
    { id: 'resumo', rotulo: '🌙 Resumo da noite' },
    { id: 'chegada', rotulo: '📋 Lista de chegada' },
    { id: 'caixa', rotulo: '💰 Caixa / créditos' },
    { id: 'passantes', rotulo: '🚶 Passantes' },
    { id: 'noshow', rotulo: '👻 No-show' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Fechamento</h1>
          <p className="mt-0.5 text-sm text-carvao-400 dark:text-carvao-300">
            Resumo da noite, listas e exportações.
          </p>
        </div>
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
            className={`min-h-9 rounded-full px-4 text-[13px] font-semibold transition ${
              aba === a.id
                ? 'bg-carvao-900 text-areia-50 shadow-suave dark:bg-areia-100 dark:text-carvao-900'
                : 'bg-white text-carvao-500 ring-1 ring-carvao-200 hover:text-carvao-800 dark:bg-carvao-800 dark:text-carvao-300 dark:ring-carvao-600'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {aba !== 'resumo' && (
        <div className="print:hidden">
          <SeletorTurno valor={turno} aoMudar={setTurno} permitirTodos />
        </div>
      )}

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
          {aba === 'resumo' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ResumoStat rotulo="Faturado" valor={brl(resumo.geral.faturado)} destaque />
                <ResumoStat rotulo="Recebido" valor={brl(resumo.geral.recebido)} />
                <ResumoStat rotulo="Créditos usados" valor={brl(resumo.geral.creditos)} />
                <ResumoStat rotulo="Contas fechadas" valor={String(fechamentos.length)} />
                <ResumoStat rotulo="Reservas" valor={String(resumo.geral.reservas)} />
                <ResumoStat rotulo="Passantes" valor={String(resumo.geral.passantes)} />
                <ResumoStat rotulo="Finalizadas" valor={String(resumo.geral.finalizadas)} />
                <ResumoStat rotulo="No-show" valor={String(resumo.geral.noShow)} />
              </div>
              <Tabela
                cabecalho={['Turno', 'Reservas', 'Passantes', 'Finalizadas', 'No-show', 'Faturado', 'Créditos', 'Recebido']}
                linhas={[
                  ...resumo.porTurno.map((l) => [
                    TURNO_LABEL[l.turno],
                    String(l.reservas), String(l.passantes), String(l.finalizadas), String(l.noShow),
                    brl(l.faturado), brl(l.creditos), brl(l.recebido),
                  ]),
                  ['TOTAL', String(resumo.geral.reservas), String(resumo.geral.passantes),
                   String(resumo.geral.finalizadas), String(resumo.geral.noShow),
                   brl(resumo.geral.faturado), brl(resumo.geral.creditos), brl(resumo.geral.recebido)],
                ]}
              />
            </div>
          )}
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

function ResumoStat({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-3 ring-1 ${
        destaque
          ? 'bg-carvao-900 text-areia-50 ring-ouro-500/30 dark:bg-areia-100 dark:text-carvao-900'
          : 'bg-areia-100 text-carvao-900 ring-carvao-200/60 dark:bg-carvao-800 dark:text-areia-100 dark:ring-carvao-600'
      }`}
    >
      <div className={`text-[10px] font-bold uppercase tracking-[0.14em] ${destaque ? 'text-ouro-300' : 'text-carvao-400 dark:text-carvao-300'}`}>
        {rotulo}
      </div>
      <div className="mt-0.5 text-xl font-extrabold tabular-nums">{valor}</div>
    </div>
  );
}
