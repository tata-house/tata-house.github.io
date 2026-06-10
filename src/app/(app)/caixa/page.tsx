'use client';

import { useMemo, useState } from 'react';
import { SeletorTurno } from '@/components/SeletorTurno';
import { BadgePix, Botao, Cartao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { aplicarCredito, fecharConta } from '@/lib/actions';
import { AREA_LABEL, STATUS_ATIVOS } from '@/lib/constants';
import { useDados } from '@/lib/data-context';
import { brl, hora } from '@/lib/format';
import type { Reserva, Turno } from '@/lib/types';

export default function CaixaPage() {
  const { reservas, perfil, carregando, recarregar } = useDados();
  const [turno, setTurno] = useState<Turno | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [fechando, setFechando] = useState<Reserva | null>(null);
  const [valorConta, setValorConta] = useState('');
  const [erro, setErro] = useState('');
  const [ocupada, setOcupada] = useState<string | null>(null);

  const podeOperar = perfil?.role === 'caixa' || perfil?.role === 'gerente';

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return reservas
      .filter((r) => STATUS_ATIVOS.includes(r.status) || r.status === 'finalizada')
      .filter((r) => turno === 'todos' || r.turno === turno)
      .filter((r) => !termo || r.nome.toLowerCase().includes(termo) || (r.mesa?.numero ?? '').toLowerCase() === termo)
      .sort((a, b) => {
        // sentados primeiro (são quem fecha conta), depois por mesa
        const peso = (r: Reserva) => (r.status === 'sentado' ? 0 : r.status === 'finalizada' ? 2 : 1);
        return peso(a) - peso(b) || (a.mesa?.numero ?? '').localeCompare(b.mesa?.numero ?? '', 'pt-BR', { numeric: true });
      });
  }, [reservas, turno, busca]);

  async function executarCredito(r: Reserva) {
    if (!window.confirm(`Aplicar crédito de ${brl(r.credito_disponivel)} para ${r.nome}? Esta ação só pode ser feita uma vez.`)) return;
    setOcupada(r.id);
    setErro('');
    try {
      await aplicarCredito(r.id);
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao aplicar crédito.');
    } finally {
      setOcupada(null);
    }
  }

  async function executarFechamento() {
    if (!fechando) return;
    setOcupada(fechando.id);
    setErro('');
    try {
      await fecharConta(fechando.id, Number(valorConta.replace(',', '.')) || 0);
      await recarregar();
      setFechando(null);
      setValorConta('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao fechar conta.');
    } finally {
      setOcupada(null);
    }
  }

  const valorNumerico = Number(valorConta.replace(',', '.')) || 0;
  const creditoAplicavel = fechando?.credito_aplicado ? Math.min(fechando.credito_disponivel, valorNumerico) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Caixa 💰</h1>

      {!podeOperar && (
        <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          ⚠️ Seu perfil ({perfil?.role ?? '...'}) é somente leitura no caixa. Aplicar crédito e fechar conta exigem perfil Caixa ou Gerente.
        </p>
      )}

      <SeletorTurno valor={turno} aoMudar={setTurno} permitirTodos />
      <input
        className={estiloInput}
        placeholder="🔍 Buscar por nome ou nº da mesa..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {erro && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-200">{erro}</p>
      )}

      {carregando ? (
        <p className="py-10 text-center text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {lista.map((r) => (
            <Cartao key={r.id} className={r.status === 'finalizada' ? 'opacity-60' : ''}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-bold">
                    Mesa {r.mesa?.numero ?? '—'} · {r.nome}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Turno {r.turno} · {r.origem === 'passante' ? '🚶 Passante' : '📋 Reserva'}
                    {r.mesa ? ` · ${AREA_LABEL[r.mesa.area]}` : ''}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {r.origem === 'reserva' && <BadgePix status={r.pix_status} />}
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        r.credito_aplicado
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                          : r.credito_disponivel > 0
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {r.credito_aplicado
                        ? `✓ Crédito aplicado ${hora(r.credito_aplicado_em)}`
                        : r.credito_disponivel > 0
                          ? `Crédito disponível: ${brl(r.credito_disponivel)}`
                          : 'Sem crédito'}
                    </span>
                  </div>
                </div>
                {r.status !== 'finalizada' && (
                  <div className="flex w-full flex-col gap-2 sm:w-auto">
                    <Botao
                      variante="sucesso"
                      className="text-sm"
                      disabled={
                        !podeOperar ||
                        ocupada === r.id ||
                        r.origem === 'passante' ||
                        r.pix_status !== 'pago' ||
                        r.credito_aplicado
                      }
                      onClick={() => executarCredito(r)}
                    >
                      💵 Aplicar crédito de R$ 100
                    </Botao>
                    <Botao
                      variante="secundario"
                      className="text-sm"
                      disabled={!podeOperar || ocupada === r.id}
                      onClick={() => {
                        setFechando(r);
                        setValorConta('');
                      }}
                    >
                      🧾 Fechar conta
                    </Botao>
                  </div>
                )}
              </div>
            </Cartao>
          ))}
          {lista.length === 0 && <p className="py-10 text-center text-gray-500">Nenhuma conta encontrada.</p>}
        </div>
      )}

      <Modal titulo={`Fechar conta — ${fechando?.nome ?? ''}`} aberto={!!fechando} aoFechar={() => setFechando(null)}>
        {fechando && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-900">
              Mesa {fechando.mesa?.numero ?? '—'} · Turno {fechando.turno} ·{' '}
              {fechando.origem === 'passante' ? 'Passante' : 'Reserva'}
            </div>
            <div>
              <label className={estiloRotulo}>Valor da conta (R$)</label>
              <input
                className={`${estiloInput} text-2xl font-bold`}
                value={valorConta}
                onChange={(e) => setValorConta(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                autoFocus
              />
            </div>
            <div className="space-y-1 rounded-xl bg-gray-50 p-4 text-base dark:bg-gray-900">
              <div className="flex justify-between">
                <span>Valor da conta</span>
                <span className="font-bold">{brl(valorNumerico)}</span>
              </div>
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>Crédito Pix aplicado</span>
                <span className="font-bold">− {brl(creditoAplicavel)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-1 text-lg dark:border-gray-600">
                <span className="font-bold">Valor a pagar</span>
                <span className="font-black">{brl(valorNumerico - creditoAplicavel)}</span>
              </div>
            </div>
            {!fechando.credito_aplicado && fechando.credito_disponivel > 0 && (
              <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                ⚠️ Este cliente tem crédito de {brl(fechando.credito_disponivel)} ainda NÃO aplicado. Aplique o crédito antes de fechar, se for usar.
              </p>
            )}
            <Botao className="w-full" onClick={executarFechamento} disabled={ocupada === fechando.id || !valorConta}>
              Confirmar fechamento
            </Botao>
          </div>
        )}
      </Modal>
    </div>
  );
}
