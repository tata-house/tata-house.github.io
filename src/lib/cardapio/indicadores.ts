/* =====================================================================
   Indicadores corporativos — funções puras que alimentam o Dashboard
   (M1), a previsão de demanda (M6), a necessidade real de compra (M2)
   e o ROI (M12). Tudo derivado do estado já existente, sem efeitos.
   ===================================================================== */

import { PESSOAS_PADRAO, linhasDoDia, converterParaUnidadeBase } from './motor';
import { resolverPreco } from './precos';
import {
  datasDaSemana,
  idSemanaIso,
  lerDesperdicio,
  lerEventos,
  lerMediaRefeicoes,
  lerSemana,
} from './estado';
import type { Estoque, EstadoSemana, EventoDemanda } from './tipos';

/* ------------------------------ resumo -------------------------------- */

export interface ResumoSemana {
  diasMontados: number;
  itensTotal: number;
  itensComprados: number;
  itensRecebidos: number;
  comprasPendentes: number;
  custoEstimado: number;
  custoReal: number;
  refeicoesPrevistas: number;
  refeicoesReais: number;
  custoRefEstimado: number | null;
  custoRefReal: number | null;
}

export function resumoSemana(
  estado: EstadoSemana,
  precos: Record<string, number>,
  fatores?: Record<string, number>,
  estimativas: Record<string, number> = {},
): ResumoSemana {
  let itensTotal = 0;
  let itensComprados = 0;
  let itensRecebidos = 0;
  let custoEstimado = 0;
  let custoReal = 0;

  estado.dias.forEach((_, di) => {
    const linhas = linhasDoDia(estado, di, fatores);
    itensTotal += linhas.length;
    linhas.forEach((l) => {
      if (l.status.compradoEm) itensComprados++;
      if (l.status.recebidoOk) itensRecebidos++;
      // mesma engine de preços do cardápio: real → histórico (planilhas/aliases)
      // → estimado, e converte g/ml → kg/lt antes de multiplicar pela quantidade.
      const cotado = resolverPreco(l.chave, precos, estimativas).valor;
      if (cotado > 0) custoEstimado += cotado * converterParaUnidadeBase(l.qtd, l.unid);
      const pago = l.status.precoPago ?? cotado;
      if (pago > 0) custoReal += pago * converterParaUnidadeBase(l.status.compradoQtd ?? l.qtd, l.unid);
    });
  });

  const refeicoesReais = Object.values(estado.refeicoes ?? {}).reduce((a, b) => a + (b || 0), 0);
  const refeicoesPrevistas = estado.dias.filter((d) => d.principal).reduce((a, d) => a + d.pessoas, 0);

  return {
    diasMontados: estado.dias.filter((d) => d.principal).length,
    itensTotal,
    itensComprados,
    itensRecebidos,
    comprasPendentes: itensTotal - itensComprados,
    custoEstimado,
    custoReal,
    refeicoesPrevistas,
    refeicoesReais,
    custoRefEstimado: refeicoesPrevistas > 0 && custoEstimado > 0 ? custoEstimado / refeicoesPrevistas : null,
    custoRefReal: refeicoesReais > 0 && custoReal > 0 ? custoReal / refeicoesReais : null,
  };
}

/* ----------------------- consumo / necessidade ------------------------ */

export interface ItemConsumo {
  norm: string;
  item: string;
  unid: string;
  qtd: number;
}

/** Soma de tudo que o cardápio da semana exige, item a item. */
export function consumoDaSemana(estado: EstadoSemana, fatores?: Record<string, number>): ItemConsumo[] {
  const acc = new Map<string, ItemConsumo>();
  estado.dias.forEach((_, di) => {
    linhasDoDia(estado, di, fatores).forEach((l) => {
      const prev = acc.get(l.chave);
      if (prev) prev.qtd += l.qtd;
      else acc.set(l.chave, { norm: l.chave, item: l.item, unid: l.unid, qtd: l.qtd });
    });
  });
  return Array.from(acc.values()).sort((a, b) => a.item.localeCompare(b.item, 'pt-BR'));
}

export interface NecessidadeItem extends ItemConsumo {
  emEstoque: number;
  comprar: number;
}

/** Necessidade real de compra = consumo − estoque disponível (M2). */
export function necessidadeDeCompra(consumo: ItemConsumo[], estoque: Estoque): NecessidadeItem[] {
  return consumo.map((c) => {
    const emEstoque = estoque[c.norm]?.qtd ?? 0;
    const comprar = Math.max(0, Math.round((c.qtd - emEstoque) * 1000) / 1000);
    return { ...c, emEstoque, comprar };
  });
}

export interface AlertaEstoque {
  norm: string;
  item: string;
  unid: string;
  qtd: number;
  minimo: number;
}

export function alertasEstoque(estoque: Estoque): AlertaEstoque[] {
  return Object.entries(estoque)
    .filter(([, e]) => e.minimo > 0 && e.qtd <= e.minimo)
    .map(([norm, e]) => ({ norm, item: e.item, unid: e.unid, qtd: e.qtd, minimo: e.minimo }))
    .sort((a, b) => a.qtd / (a.minimo || 1) - b.qtd / (b.minimo || 1));
}

/* -------------------------- previsão (M6) ----------------------------- */

export interface PrevisaoDia {
  dia: number;
  data: Date;
  previsto: number;
  base: 'aprendido' | 'padrão';
  evento?: EventoDemanda;
}

/**
 * Previsão de refeições por dia: usa a média aprendida com as contagens
 * reais (por dia da semana) e, na ausência dela, a curva padrão da casa.
 * Eventos manuais (feriado, evento) aplicam um fator sobre o dia.
 */
export function preverSemana(semanaId: string): PrevisaoDia[] {
  const medias = lerMediaRefeicoes();
  const eventos = lerEventos();
  const datas = datasDaSemana(semanaId);
  return datas.map((data, dia) => {
    const m = medias[dia];
    const base: 'aprendido' | 'padrão' = m?.n ? 'aprendido' : 'padrão';
    let previsto = m?.n ? m.f : PESSOAS_PADRAO[dia];
    const iso = data.toISOString().slice(0, 10);
    const evento = eventos.find((e) => e.data === iso);
    if (evento) previsto *= evento.fator;
    return { dia, data, previsto: Math.round(previsto), base, evento };
  });
}

/* --------------------- variação de preço (resumo) --------------------- */

export interface VariacaoPreco {
  norm: string;
  item: string;
  atual: number;
  anterior: number;
  variacao: number; // fração: +0.22 = +22%
}

/* ------------------------------ ROI (M12) ----------------------------- */

export interface Roi {
  economiaFornecedor: number;
  economiaDesperdicio: number;
  economiaCardapio: number;
  total: number;
  semanas: number;
}

/** Taxa de sobra considerada "normal" sem gestão (referência de mercado). */
const TAXA_DESPERDICIO_REFERENCIA = 0.08;

/** Lista de ids de semana de um mês a partir de uma data. */
export function semanasDoMes(ref: Date): string[] {
  const ids = new Set<string>();
  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  for (let dia = 1; dia <= 31; dia++) {
    const d = new Date(ano, mes, dia);
    if (d.getMonth() !== mes) break;
    ids.add(idSemanaIso(d));
  }
  return Array.from(ids);
}

/**
 * ROI estimado do mês: soma economias por (1) comprar abaixo da média
 * histórica de preço, (2) desperdício abaixo da referência de mercado e
 * (3) cardápio mais barato que a semana mais cara do período.
 */
export function calcularRoi(
  refData: Date,
  precos: Record<string, number>,
  historico: Record<string, { valor: number; em: string }[]>,
  fatores?: Record<string, number>,
): Roi {
  const ids = semanasDoMes(refData);
  let economiaFornecedor = 0;
  let economiaDesperdicio = 0;
  let custoMes = 0;
  const custosRefPorSemana: number[] = [];

  ids.forEach((id) => {
    const estado = lerSemana(id);
    if (!estado.dias.some((d) => d.principal)) return;
    const r = resumoSemana(estado, precos, fatores);
    custoMes += r.custoReal || r.custoEstimado;
    if (r.custoRefReal ?? r.custoRefEstimado) custosRefPorSemana.push((r.custoRefReal ?? r.custoRefEstimado) as number);

    // (1) compras abaixo da média histórica do item
    consumoDaSemana(estado, fatores).forEach((c) => {
      const serie = historico[c.norm];
      const atual = precos[c.norm];
      if (!serie || serie.length < 2 || !(atual > 0)) return;
      const media = serie.reduce((a, p) => a + p.valor, 0) / serie.length;
      if (atual < media) economiaFornecedor += (media - atual) * c.qtd;
    });

    // (2) desperdício abaixo da referência
    const sobras = lerDesperdicio(id);
    const refeicoes = Object.values(estado.refeicoes ?? {}).reduce((a, b) => a + (b || 0), 0);
    const custoRef = r.custoRefReal ?? r.custoRefEstimado ?? 0;
    if (custoRef > 0 && refeicoes > 0) {
      const custoSobraReal = sobras.reduce((a, s) => a + Math.max(0, s.produzido - s.consumido) * custoRef, 0);
      const referencia = (r.custoReal || r.custoEstimado) * TAXA_DESPERDICIO_REFERENCIA;
      economiaDesperdicio += Math.max(0, referencia - custoSobraReal);
    }
  });

  // (3) cardápio: diferença para a semana mais cara do mês × refeições do mês
  let economiaCardapio = 0;
  if (custosRefPorSemana.length >= 2) {
    const pior = Math.max(...custosRefPorSemana);
    const refeicoesMes = ids.reduce((a, id) => {
      const e = lerSemana(id);
      return a + Object.values(e.refeicoes ?? {}).reduce((x, y) => x + (y || 0), 0);
    }, 0);
    const media = custosRefPorSemana.reduce((a, b) => a + b, 0) / custosRefPorSemana.length;
    economiaCardapio = Math.max(0, (pior - media) * refeicoesMes);
  }
  void custoMes;

  const total = economiaFornecedor + economiaDesperdicio + economiaCardapio;
  return {
    economiaFornecedor,
    economiaDesperdicio,
    economiaCardapio,
    total,
    semanas: ids.filter((id) => lerSemana(id).dias.some((d) => d.principal)).length,
  };
}
