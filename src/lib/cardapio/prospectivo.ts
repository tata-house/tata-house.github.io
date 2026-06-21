/* =====================================================================
   Alertas prospectivos — olham para FRENTE, não para trás.
   Usa dados já persistidos para prever problemas antes que aconteçam.

   Três categorias:
     A) Runout de estoque — projeta quando um item vai zerar com base no
        consumo previsto pelo cardápio desta semana.
     B) Histórico de menu — avisa quando um prato planejado esta semana
        teve alta sobra ou baixa aceitação em semanas anteriores.
     C) Tendência sazonal de preço — detecta padrões mensais de alta
        no histórico e avisa antes do mês de risco.

   Todas as funções são puras (sem side-effects) e retornam ItemBriefing[]
   para integração direta com montarBriefing().
   ===================================================================== */

import { normalizar, linhasDoDia } from './motor';
import { mediana } from './memoria';
import type { ItemBriefing } from './briefing';
import type {
  Aceitacao,
  Estoque,
  EstadoSemana,
  HistoricoPrecos,
  RegistroDesperdicio,
} from './tipos';

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/* ================================================================
   A) RUNOUT DE ESTOQUE
   Projeta o saldo final de cada item em estoque após a semana planejada.
   ================================================================ */

/**
 * Para cada item no estoque com minimo > 0, soma o consumo previsto
 * pelo cardápio da semana (com fatores de aprendizado) e compara com
 * o saldo atual. Gera alertas quando o saldo projetado fica abaixo do
 * mínimo ou negativo antes do fim da semana.
 */
export function alertasRunoutEstoque(
  estoque: Estoque,
  estado: EstadoSemana,
  fatores: Record<string, number>,
): ItemBriefing[] {
  // calcula consumo total previsto por item (sum de todas as linhas × fator)
  const consumoPrevisto: Record<string, { item: string; unid: string; qtd: number }> = {};
  for (let di = 0; di < 5; di++) { // só dias úteis
    for (const l of linhasDoDia(estado, di)) {
      const fator = fatores[l.chave] ?? 1;
      const qtd = l.qtd * fator;
      if (!qtd) continue;
      const prev = consumoPrevisto[l.chave] ?? { item: l.item, unid: l.unid, qtd: 0 };
      consumoPrevisto[l.chave] = { ...prev, qtd: prev.qtd + qtd };
    }
  }

  const alertas: ItemBriefing[] = [];

  for (const [norm, mov] of Object.entries(consumoPrevisto)) {
    const slot = estoque[norm];
    if (!slot || slot.qtd <= 0) continue; // sem estoque cadastrado, outro alerta cuida
    const saldoFinal = slot.qtd - mov.qtd;
    const abaixoMinimo = slot.minimo > 0 && saldoFinal < slot.minimo;
    const negativo = saldoFinal < 0;

    if (!negativo && !abaixoMinimo) continue;

    // estima em qual dia o saldo vai zerar (consumo uniforme entre os dias)
    const consumoDiario = mov.qtd / 5;
    const diasAteZero = consumoDiario > 0 ? Math.floor(slot.qtd / consumoDiario) : 99;

    alertas.push({
      nivel: negativo ? 'urgente' : 'atencao',
      icone: '⏳',
      titulo: `${slot.item} — faltará na ${diasAteZero <= 2 ? (diasAteZero === 0 ? 'segunda-feira' : DIAS_PT[diasAteZero]) : 'semana'}`,
      detalhe: `Saldo: ${slot.qtd} ${slot.unid}. Consumo previsto: ${Math.round(mov.qtd * 10) / 10} ${mov.unid}. Saldo ao fim da semana: ${Math.round(saldoFinal * 10) / 10}.`,
      acao: negativo
        ? 'Incluir na lista de compras urgente antes do início da semana.'
        : 'Reforçar o estoque antes de meados da semana.',
    });
  }

  return alertas.sort((a, b) => (a.nivel === 'urgente' ? -1 : 1) - (b.nivel === 'urgente' ? -1 : 1)).slice(0, 3);
}

/* ================================================================
   B) HISTÓRICO DE MENU
   Quando o mesmo prato aparece no cardápio desta semana, verifica se
   em semanas anteriores (no mesmo dia da semana) ele teve:
   - Taxa de desperdício acima de 20%
   - Nota de aceitação abaixo de 3.0
   ================================================================ */

export function alertasMenuHistorico(
  estado: EstadoSemana,
  historicoSemanas: { semanaId: string; estado: EstadoSemana }[],
  aceitacao: Aceitacao,
  desps: RegistroDesperdicio[],
): ItemBriefing[] {
  if (historicoSemanas.length < 2) return []; // dados insuficientes

  // pré-computa taxa de desperdício por prato
  const despMap = new Map<string, number[]>();
  for (const r of desps) {
    if (r.produzido <= 0) continue;
    const taxa = Math.max(0, r.produzido - r.consumido) / r.produzido;
    const k = normalizar(r.prato);
    despMap.set(k, [...(despMap.get(k) ?? []), taxa]);
  }

  const alertas: ItemBriefing[] = [];
  const vistos = new Set<string>();

  for (let di = 0; di < 5; di++) {
    const prato = estado.dias[di]?.principal;
    if (!prato) continue;
    const norm = normalizar(prato);
    if (vistos.has(norm)) continue;
    vistos.add(norm);

    // desperdício histórico
    const taxas = despMap.get(norm) ?? [];
    if (taxas.length >= 2) {
      const medDesp = mediana(taxas);
      if (medDesp >= 0.20) {
        alertas.push({
          nivel: medDesp >= 0.35 ? 'urgente' : 'atencao',
          icone: '',
          titulo: `${prato} tende a sobrar (${Math.round(medDesp * 100)}% histórico)`,
          detalhe: `Nos últimos ${taxas.length} registros, ${Math.round(medDesp * 100)}% em média sobrou. Considere reduzir a produção.`,
          acao: `Reduzir produção de ${prato} em ~${Math.min(30, Math.round(medDesp * 100))}% esta semana.`,
        });
        continue;
      }
    }

    // aceitação histórica
    const ac = aceitacao[norm];
    if (ac && ac.n >= 3 && ac.somaNotas / ac.n < 3.0) {
      const nota = Math.round((ac.somaNotas / ac.n) * 10) / 10;
      alertas.push({
        nivel: 'atencao',
        icone: '',
        titulo: `${prato} tem aceitação baixa (${nota}★ histórico)`,
        detalhe: `${ac.n} avaliações com nota média ${nota}. Provável insatisfação esta semana.`,
        acao: 'Considerar substituir ou servir em outro dia.',
      });
    }
  }

  return alertas.slice(0, 3);
}

/* ================================================================
   C) TENDÊNCIA SAZONAL DE PREÇO
   Agrupa o histórico de preços por mês e detecta meses que
   historicamente são mais caros que a média anual.
   Avisa 1 mês antes (mês de risco = mês atual + 1).
   ================================================================ */

export function alertasTendenciaPreco(
  historico: HistoricoPrecos,
  data: Date,
): ItemBriefing[] {
  const mesProximo = (data.getMonth() + 1) % 12; // 0-indexed do próximo mês
  const mesAtual = data.getMonth();

  const alertas: ItemBriefing[] = [];

  for (const [norm, pontos] of Object.entries(historico)) {
    if (pontos.length < 8) continue; // menos de 8 pontos = sem padrão confiável

    // agrupa por mês
    const porMes: Record<number, number[]> = {};
    for (const p of pontos) {
      const m = new Date(p.em).getMonth();
      porMes[m] = [...(porMes[m] ?? []), p.valor];
    }

    const mesesComDados = Object.keys(porMes).length;
    if (mesesComDados < 4) continue; // histórico raso

    const mediaGeral = mediana(pontos.map((p) => p.valor));
    const mediaProximo = porMes[mesProximo] ? mediana(porMes[mesProximo]) : null;

    if (!mediaProximo) continue;

    const variacao = (mediaProximo - mediaGeral) / mediaGeral;
    if (variacao < 0.12) continue; // menos de 12% de alta = não vale alertar

    const nomesMes = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    const pct = Math.round(variacao * 100);

    // só alerta se estamos no mês anterior ao mês de risco
    if (data.getMonth() !== mesAtual) continue;

    alertas.push({
      nivel: variacao >= 0.25 ? 'atencao' : 'info',
      icone: '',
      titulo: `${norm} tende a subir em ${nomesMes[mesProximo]}`,
      detalhe: `Histórico mostra alta de ~${pct}% no mês seguinte vs. média anual. Considere estoque preventivo.`,
      acao: 'Comprar quantidade extra este mês para evitar pagar mais no próximo.',
    });
  }

  return alertas.slice(0, 2);
}

/* ================================================================
   Agregador — chama as três categorias e retorna lista unificada.
   Usado pelo BriefingCard para enriquecer o briefing com visão prospectiva.
   ================================================================ */
export function alertasProspectivos(
  semanaId: string,
  estado: EstadoSemana,
  estoque: Estoque,
  historico: HistoricoPrecos,
  aceitacao: Aceitacao,
  fatores: Record<string, number>,
  historicoSemanas: { semanaId: string; estado: EstadoSemana }[],
  desps: RegistroDesperdicio[],
): ItemBriefing[] {
  void semanaId; // reservado para futura filtragem por semana
  return [
    ...alertasRunoutEstoque(estoque, estado, fatores),
    ...alertasMenuHistorico(estado, historicoSemanas, aceitacao, desps),
    ...alertasTendenciaPreco(historico, new Date()),
  ];
}
