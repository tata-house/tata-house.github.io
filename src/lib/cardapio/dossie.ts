/* =====================================================================
   Dossiê IA — constrói o payload compacto enviado ao LLM.
   O LLM recebe apenas números pré-calculados e deve escolher/explicar
   com base só nos dados deste dossiê. Nunca inventa métricas.
   ===================================================================== */

import { normalizar, proteinaDoPrato, linhasDoDia } from './motor';
import { analisarRadar } from './radar';
import { resumoSemana, alertasEstoque } from './indicadores';
import type {
  EstadoSemana,
  Aceitacao,
  Estoque,
  HistoricoPrecos,
  RegistroDesperdicio,
} from './tipos';
import type { AjusteAprendido } from './memoria';
import type { DnaAlimentar } from './dna';

const DIAS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export interface DossieCardapioDia {
  dia: number;
  diaNome: string;
  principal: string;
  proteina: string | null;
  pessoas: number;
}

export interface DossieCustoHistorico {
  semanaId: string;
  custoPP: number;
}

export interface DossieAlertaPreco {
  item: string;
  variacaoPct: number; // positivo = subiu, negativo = caiu
  precoAtual: number;
  precoMedio: number;
}

export interface DossieEstoqueBaixo {
  item: string;
  qtd: number;
  unid: string;
  minimo: number;
}

export interface DossieDesperdicio {
  prato: string;
  taxaMedia: number; // 0–1: fração desperdiçada
  n: number;
}

export interface DossieAceitacao {
  prato: string;
  media: number;
  n: number;
}

export interface DossieTopCusto {
  item: string;
  custo: number;
  pct: number; // % do custo total da semana
}

export interface DossieMemoria {
  item: string;
  fator: number; // <1 = casa compra menos que a sugestão; >1 = mais
  n: number;
}

export interface DossieIA {
  semanaId: string;
  cardapio: DossieCardapioDia[];
  custoPP: number | null;
  custoTotal: number | null;
  orcamento: number | null;
  historicoCustoPP: DossieCustoHistorico[];
  alertasPreco: DossieAlertaPreco[];
  estoqueAbaixoMinimo: DossieEstoqueBaixo[];
  maisDesperdicio: DossieDesperdicio[];
  melhoresAceitacao: DossieAceitacao[];
  pioresAceitacao: DossieAceitacao[];
  topCusto: DossieTopCusto[];
  /** Memória operacional: itens que a casa ajusta sistematicamente. */
  memoria: DossieMemoria[];
  /** DNA alimentar: perfil de preferências da casa (resumido). */
  dna: DossieDna | null;
  totalRefeicoesPrevistas: number;
  geradoEm: string;
}

export interface DossieDna {
  resumo: string;
  proteinasPreferidas: { rotulo: string; pct: number; nota: number | null }[];
  campeoes: string[];
  problemas: string[];
}

export function montarDossie(
  semanaId: string,
  estado: EstadoSemana,
  precos: Record<string, number>,
  aceitacao: Aceitacao,
  estoque: Estoque,
  historico: HistoricoPrecos,
  fornecedores: Record<string, string> = {},
  desperdicio: RegistroDesperdicio[] = [],
  historicoSemanas: { semanaId: string; estado: EstadoSemana }[] = [],
  ajustesAprendidos: AjusteAprendido[] = [],
  dnaAlimentar: DnaAlimentar | null = null,
): DossieIA {
  // cardápio da semana
  const cardapio: DossieCardapioDia[] = estado.dias
    .map((d, i) => ({
      dia: i,
      diaNome: DIAS_PT[i],
      principal: d.principal,
      proteina: d.principal ? proteinaDoPrato(d.principal) : null,
      pessoas: d.pessoas,
    }))
    .filter((d) => d.principal);

  // custo desta semana
  const resumo = resumoSemana(estado, precos);
  const custoPP = resumo.custoRefEstimado ? Math.round(resumo.custoRefEstimado * 100) / 100 : null;
  const custoTotal = resumo.custoEstimado > 0 ? Math.round(resumo.custoEstimado * 100) / 100 : null;

  // histórico custo/pessoa (últimas semanas)
  const historicoCustoPP: DossieCustoHistorico[] = historicoSemanas
    .map(({ semanaId: sid, estado: e }) => {
      const r = resumoSemana(e, precos);
      const cpp = r.custoRefReal ?? r.custoRefEstimado ?? null;
      return cpp ? { semanaId: sid, custoPP: Math.round(cpp * 100) / 100 } : null;
    })
    .filter((x): x is DossieCustoHistorico => x !== null)
    .slice(-4);

  // alertas de preço
  const alertasPreco: DossieAlertaPreco[] = analisarRadar(precos, historico, fornecedores)
    .filter((r) => r.alerta !== null && r.variacao !== null)
    .slice(0, 8)
    .map((r) => ({
      item: r.item,
      variacaoPct: Math.round((r.variacao ?? 0) * 100),
      precoAtual: r.atual,
      precoMedio: r.anterior ?? r.atual,
    }));

  // estoque abaixo do mínimo
  const estoqueAbaixoMinimo: DossieEstoqueBaixo[] = alertasEstoque(estoque).map((a) => ({
    item: a.item,
    qtd: a.qtd,
    unid: a.unid,
    minimo: a.minimo,
  }));

  // desperdício por prato
  const despMap = new Map<string, { prato: string; total: number; n: number }>();
  desperdicio.forEach((r) => {
    const k = normalizar(r.prato);
    const taxa = r.produzido > 0 ? Math.max(0, r.produzido - r.consumido) / r.produzido : 0;
    const prev = despMap.get(k) ?? { prato: r.prato, total: 0, n: 0 };
    despMap.set(k, { prato: r.prato, total: prev.total + taxa, n: prev.n + 1 });
  });
  const maisDesperdicio: DossieDesperdicio[] = Array.from(despMap.values())
    .map((v) => ({ prato: v.prato, taxaMedia: Math.round((v.total / v.n) * 100) / 100, n: v.n }))
    .filter((d) => d.taxaMedia > 0.05)
    .sort((a, b) => b.taxaMedia - a.taxaMedia)
    .slice(0, 5);

  // aceitação
  const acArr = Object.values(aceitacao)
    .filter((r) => r.n >= 2)
    .map((r) => ({ prato: r.prato, media: Math.round((r.somaNotas / r.n) * 10) / 10, n: r.n }))
    .sort((a, b) => b.media - a.media);
  const melhoresAceitacao = acArr.slice(0, 3);
  const pioresAceitacao = acArr
    .slice()
    .reverse()
    .filter((r) => r.media < 3.5)
    .slice(0, 3);

  // top custo
  const custoMap = new Map<string, { item: string; custo: number }>();
  estado.dias.forEach((_, di) => {
    linhasDoDia(estado, di).forEach((l) => {
      const c = (precos[l.chave] ?? 0) * l.qtd;
      const prev = custoMap.get(l.chave) ?? { item: l.item, custo: 0 };
      custoMap.set(l.chave, { item: l.item, custo: prev.custo + c });
    });
  });
  const totalCusto = Array.from(custoMap.values()).reduce((a, b) => a + b.custo, 0);
  const topCusto: DossieTopCusto[] = Array.from(custoMap.values())
    .filter((v) => v.custo > 0)
    .sort((a, b) => b.custo - a.custo)
    .slice(0, 5)
    .map((v) => ({
      item: v.item,
      custo: Math.round(v.custo * 100) / 100,
      pct: totalCusto > 0 ? Math.round((v.custo / totalCusto) * 100) : 0,
    }));

  return {
    semanaId,
    cardapio,
    custoPP,
    custoTotal,
    orcamento: estado.orcamento,
    historicoCustoPP,
    alertasPreco,
    estoqueAbaixoMinimo,
    maisDesperdicio,
    melhoresAceitacao,
    pioresAceitacao,
    topCusto,
    memoria: ajustesAprendidos
      .slice(0, 8)
      .map((a) => ({ item: a.norm, fator: a.fator, n: a.n })),
    dna: dnaAlimentar
      ? {
          resumo: dnaAlimentar.resumo,
          proteinasPreferidas: dnaAlimentar.perfilProteinas
            .filter((p) => p.proteina !== 'outros')
            .slice(0, 4)
            .map((p) => ({ rotulo: p.rotulo, pct: p.pct, nota: p.notaMedia })),
          campeoes: dnaAlimentar.campeoes.slice(0, 5).map((c) => c.prato),
          problemas: dnaAlimentar.problemas.slice(0, 4).map((p) => p.prato),
        }
      : null,
    totalRefeicoesPrevistas: resumo.refeicoesPrevistas,
    geradoEm: new Date().toISOString(),
  };
}
