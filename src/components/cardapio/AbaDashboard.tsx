'use client';

import { useMemo } from 'react';
import { BarraMini, Cartao, Contador, EstadoVazio, Kpi, Pilula, Secao } from '@/components/ui';
import { DIAS_SEMANA, formatarQtd, formatarReais } from '@/lib/cardapio/motor';
import {
  alertasEstoque,
  calcularRoi,
  preverSemana,
  resumoSemana,
} from '@/lib/cardapio/indicadores';
import { analisarRadar, fraseAlerta } from '@/lib/cardapio/radar';
import { useAuditoria } from '@/lib/cardapio/estado';
import { CentroDecisoes } from './CentroDecisoes';
import { Configuracoes } from './Configuracoes';
import type { Aceitacao, Estoque, EstadoSemana, HistoricoPrecos } from '@/lib/cardapio/tipos';

export function AbaDashboard({
  estado,
  semanaId,
  precos,
  fatores,
  estoque,
  historico,
  aceitacao,
  irPara,
}: {
  estado: EstadoSemana;
  semanaId: string;
  precos: Record<string, number>;
  fatores?: Record<string, number>;
  estoque: Estoque;
  historico: HistoricoPrecos;
  aceitacao: Aceitacao;
  fornecedores?: Record<string, string>;
  irPara?: (aba: string) => void;
}) {
  const resumo = useMemo(() => resumoSemana(estado, precos, fatores), [estado, precos, fatores]);
  const previsao = useMemo(() => preverSemana(semanaId), [semanaId]);
  const roi = useMemo(() => calcularRoi(new Date(), precos, historico, fatores), [precos, historico, fatores]);
  const radar = useMemo(() => analisarRadar(precos, historico).filter((r) => r.alerta), [precos, historico]);
  const baixos = useMemo(() => alertasEstoque(estoque), [estoque]);
  const { registros } = useAuditoria();

  const melhorPrato = useMemo(() => {
    const r = Object.values(aceitacao)
      .filter((a) => a.n > 0)
      .map((a) => ({ prato: a.prato, media: a.somaNotas / a.n }))
      .sort((a, b) => b.media - a.media)[0];
    return r;
  }, [aceitacao]);

  const totalPrevisto = previsao.reduce((a, p) => a + p.previsto, 0);
  const semDados = resumo.diasMontados === 0;

  const alertas: { texto: string; tom: 'vermelho' | 'ouro' | 'azul' }[] = [];
  radar.slice(0, 3).forEach((r) => alertas.push({ texto: fraseAlerta(r), tom: r.alerta === 'alta' ? 'vermelho' : 'azul' }));
  baixos.slice(0, 3).forEach((b) =>
    alertas.push({ texto: `${b.item} no limite do estoque (${formatarQtd(b.qtd)} ${b.unid}).`, tom: 'ouro' }),
  );
  if (resumo.comprasPendentes > 0 && estado.etapa !== 'rascunho')
    alertas.push({ texto: `${resumo.comprasPendentes} itens ainda não comprados nesta semana.`, tom: 'ouro' });

  return (
    <div className="space-y-5">
      {/* KPIs principais */}
      <div className="grid animate-subir grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          rotulo="Refeições previstas"
          valor={<Contador valor={totalPrevisto || resumo.refeicoesPrevistas} />}
          detalhe="estimativa da semana"
          tom="azul"
          icone="🍽️"
        />
        <Kpi
          rotulo="Refeições reais"
          valor={resumo.refeicoesReais ? <Contador valor={resumo.refeicoesReais} /> : '—'}
          detalhe={resumo.refeicoesReais ? 'contadas pela cozinha' : 'aguardando contagem'}
          tom="verde"
          icone="✅"
        />
        <Kpi
          rotulo="Custo / refeição"
          valor={
            (resumo.custoRefReal ?? resumo.custoRefEstimado) ? (
              <Contador valor={(resumo.custoRefReal ?? resumo.custoRefEstimado)!} formato={formatarReais} />
            ) : (
              '—'
            )
          }
          detalhe={resumo.custoRefReal ? 'real' : resumo.custoRefEstimado ? 'estimado' : 'lance os preços'}
          tom="ouro"
          icone="🎯"
        />
        <Kpi
          rotulo="Custo total semana"
          valor={
            resumo.custoReal || resumo.custoEstimado ? (
              <Contador valor={resumo.custoReal || resumo.custoEstimado} formato={formatarReais} />
            ) : (
              '—'
            )
          }
          detalhe={resumo.custoReal ? 'realizado' : 'estimado pela cotação'}
          tom="neutro"
          icone="💰"
        />
      </div>

      {semDados && (
        <EstadoVazio
          icone="📊"
          titulo="Monte o cardápio para ver os indicadores"
          texto="Assim que a semana tiver pratos e preços, o painel mostra custo por refeição, economia e alertas automaticamente."
          acao={
            irPara && (
              <button
                onClick={() => irPara('cardapio')}
                className="rounded-2xl bg-brand-700 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-suave"
              >
                Ir para o cardápio
              </button>
            )
          }
        />
      )}

      <CentroDecisoes
        estado={estado}
        precos={precos}
        historico={historico}
        estoque={estoque}
        aceitacao={aceitacao}
      />

      {/* ROI do mês */}
      <Cartao className="overflow-hidden !p-0">
        <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-5 py-4 text-white">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-200">Valor gerado no mês</p>
          <p className="font-display text-3xl font-bold">
            <Contador valor={roi.total} formato={formatarReais} />
          </p>
          <p className="text-xs font-semibold text-brand-100/80">
            economia estimada com gestão inteligente · {roi.semanas} semana(s) no mês
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-carvao-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-carvao-700/60">
          {[
            { r: 'Compra abaixo da média', v: roi.economiaFornecedor, i: '🏷️' },
            { r: 'Menos desperdício', v: roi.economiaDesperdicio, i: '♻️' },
            { r: 'Cardápio otimizado', v: roi.economiaCardapio, i: '🧠' },
          ].map((c) => (
            <div key={c.r} className="px-5 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-carvao-400">
                {c.i} {c.r}
              </p>
              <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-300">{formatarReais(c.v)}</p>
            </div>
          ))}
        </div>
      </Cartao>

      {/* Alertas */}
      <Secao titulo="🔔 Alertas">
        {alertas.length === 0 ? (
          <Cartao>
            <p className="text-sm text-carvao-400">Tudo sob controle — nenhum alerta de preço, estoque ou compra no momento. 👍</p>
          </Cartao>
        ) : (
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <Cartao key={i} className="flex items-start gap-3 !py-3">
                <Pilula tom={a.tom}>{a.tom === 'vermelho' ? 'Preço' : a.tom === 'azul' ? 'Oportunidade' : 'Atenção'}</Pilula>
                <p className="text-sm text-carvao-600 dark:text-areia-200">{a.texto}</p>
              </Cartao>
            ))}
          </div>
        )}
      </Secao>

      {/* Previsão de demanda */}
      <Secao
        titulo="📈 Previsão de demanda"
        acao={<Pilula tom="azul">{totalPrevisto} refeições/semana</Pilula>}
      >
        <Cartao>
          <div className="grid grid-cols-7 gap-1.5">
            {previsao.map((p) => {
              const max = Math.max(...previsao.map((x) => x.previsto), 1);
              return (
                <div key={p.dia} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-extrabold uppercase text-carvao-400">{DIAS_SEMANA[p.dia].slice(0, 3)}</span>
                  <div className="flex h-20 w-full items-end">
                    <div
                      className={`w-full rounded-t-md ${p.evento ? 'bg-ouro-400' : 'bg-brand-500'}`}
                      style={{ height: `${Math.max(6, (p.previsto / max) * 100)}%` }}
                      title={p.evento ? p.evento.rotulo : p.base}
                    />
                  </div>
                  <span className="text-xs font-bold">{p.previsto}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-carvao-400">
            Barras em verde usam a média aprendida com as contagens reais; em dourado, dias com evento configurado. Ajuste
            eventos e feriados na aba Feedback.
          </p>
        </Cartao>
      </Secao>

      {/* Atalhos de leitura rápida */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Cartao className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-carvao-400">🏆 Melhor prato</p>
          {melhorPrato ? (
            <>
              <p className="font-display text-lg font-semibold">{melhorPrato.prato}</p>
              <BarraMini valor={melhorPrato.media / 5} />
              <p className="text-xs text-carvao-400">nota {melhorPrato.media.toFixed(1)} de 5</p>
            </>
          ) : (
            <p className="text-sm text-carvao-400">Sem avaliações ainda — registre na aba Feedback.</p>
          )}
        </Cartao>
        <Cartao className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-carvao-400">🛒 Andamento das compras</p>
          <p className="font-display text-lg font-semibold">
            {resumo.itensComprados}/{resumo.itensTotal} itens comprados
          </p>
          <BarraMini valor={resumo.itensTotal ? resumo.itensComprados / resumo.itensTotal : 0} tom="azul" />
          <p className="text-xs text-carvao-400">{resumo.itensRecebidos} já recebidos</p>
        </Cartao>
      </div>

      {/* Auditoria resumida — últimos eventos */}
      {registros.length > 0 && (
        <Secao titulo="🛡️ Últimos eventos">
          <Cartao className="!p-0">
            <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
              {registros.slice(0, 6).map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{r.acao}</span>{' '}
                    <span className="text-carvao-500 dark:text-areia-200">· {r.alvo}</span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-carvao-400">
                    {new Date(r.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </Cartao>
        </Secao>
      )}

      <Configuracoes />
    </div>
  );
}
