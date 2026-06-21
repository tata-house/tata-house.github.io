/* =====================================================================
   Decisões inversas — o gestor define UM objetivo e o sistema resolve o
   caminho de volta: quais ações concretas levam até lá, com impacto
   estimado em R$ e prioridade. Tudo derivado do dossiê já pré-calculado
   (determinístico, funciona offline). O LLM apenas narra o plano.
   ===================================================================== */

import type { DossieIA } from './dossie';

export type TipoObjetivo =
  | 'reduzir_custo'
  | 'reduzir_desperdicio'
  | 'melhorar_aceitacao'
  | 'equilibrar_proteinas';

export interface Objetivo {
  tipo: TipoObjetivo;
  /** Meta opcional (fração): 0.1 = reduzir 10%. */
  alvo?: number;
}

export interface AcaoRecomendada {
  acao: string;
  base: string; // de onde a recomendação saiu (rastreabilidade)
  impactoReais?: number; // economia/ganho estimado na semana
  prioridade: number; // 1 = mais impactante
}

export interface PlanoObjetivo {
  tipo: TipoObjetivo;
  titulo: string;
  acoes: AcaoRecomendada[];
  impactoTotalReais: number;
  viabilidade: 'alta' | 'media' | 'baixa';
  resumo: string;
}

export const OBJETIVOS_ROTULO: Record<TipoObjetivo, string> = {
  reduzir_custo: 'Reduzir custo',
  reduzir_desperdicio: 'Reduzir desperdício',
  melhorar_aceitacao: 'Melhorar aceitação',
  equilibrar_proteinas: 'Equilibrar proteínas',
};

/* ------------------------------------------------------------------ */

function viabilidadeDe(acoes: AcaoRecomendada[]): 'alta' | 'media' | 'baixa' {
  if (acoes.length === 0) return 'baixa';
  if (acoes.length >= 3) return 'alta';
  return 'media';
}

function reduzirCusto(d: DossieIA, alvo: number): PlanoObjetivo {
  const acoes: AcaoRecomendada[] = [];
  const meta = d.custoTotal ? d.custoTotal * alvo : null;

  // 1) proteínas caras no topo do custo → trocar pela preferida mais barata
  const proteinaBarata = d.dna?.proteinasPreferidas
    .filter((p) => p.nota === null || p.nota >= 3.5)
    .slice(-1)[0]; // a menos servida entre as bem aceitas costuma ser a econômica
  d.topCusto
    .filter((t) => t.pct >= 15)
    .slice(0, 2)
    .forEach((t, i) => {
      acoes.push({
        acao: proteinaBarata
          ? `Trocar parte de "${t.item}" por ${proteinaBarata.rotulo.toLowerCase()} num dia da semana.`
          : `Rever a porção de "${t.item}" — concentra ${t.pct}% do custo.`,
        base: `Item responde por ${t.pct}% do custo (R$${t.custo.toFixed(0)}).`,
        impactoReais: Math.round(t.custo * 0.25),
        prioridade: i + 1,
      });
    });

  // 2) itens em alta de preço → adiar/substituir
  d.alertasPreco
    .filter((a) => a.variacaoPct >= 15)
    .slice(0, 2)
    .forEach((a) => {
      acoes.push({
        acao: `Adiar ou substituir "${a.item}" — subiu ${a.variacaoPct}% (de R$${a.precoMedio.toFixed(2)} para R$${a.precoAtual.toFixed(2)}).`,
        base: 'Radar de preços: alta anormal.',
        prioridade: acoes.length + 1,
      });
    });

  // 3) usar estoque parado antes de comprar
  if (d.estoqueAbaixoMinimo.length === 0 && d.topCusto.length > 0) {
    acoes.push({
      acao: 'Aproveitar itens já em estoque antes de fechar a próxima compra.',
      base: 'Evita compra redundante.',
      prioridade: acoes.length + 1,
    });
  }

  const impactoTotal = acoes.reduce((s, a) => s + (a.impactoReais ?? 0), 0);
  const pct = d.custoTotal ? Math.round((impactoTotal / d.custoTotal) * 100) : 0;
  const resumo = meta
    ? `Meta: economizar ~R$${meta.toFixed(0)} (${Math.round(alvo * 100)}%). Plano estima R$${impactoTotal.toFixed(0)} (${pct}%) com ${acoes.length} ações.`
    : `Plano com ${acoes.length} ações, economia estimada de R$${impactoTotal.toFixed(0)}.`;

  return {
    tipo: 'reduzir_custo',
    titulo: 'Como reduzir o custo da semana',
    acoes,
    impactoTotalReais: impactoTotal,
    viabilidade: viabilidadeDe(acoes),
    resumo,
  };
}

function reduzirDesperdicio(d: DossieIA): PlanoObjetivo {
  const acoes: AcaoRecomendada[] = [];

  d.maisDesperdicio.slice(0, 3).forEach((p, i) => {
    const pct = Math.round(p.taxaMedia * 100);
    acoes.push({
      acao: `Reduzir a produção de "${p.prato}" em ~${Math.min(30, pct)}% — sobra ${pct}% em média.`,
      base: `Desperdício médio de ${pct}% em ${p.n} registro(s).`,
      prioridade: i + 1,
    });
  });

  // pratos com pior aceitação tendem a sobrar
  d.pioresAceitacao.slice(0, 2).forEach((p) => {
    if (acoes.some((a) => a.acao.includes(p.prato))) return;
    acoes.push({
      acao: `Avaliar tirar "${p.prato}" do cardápio — aceitação baixa (nota ${p.media}).`,
      base: `${p.n} avaliações, média ${p.media}.`,
      prioridade: acoes.length + 1,
    });
  });

  if (acoes.length === 0) {
    acoes.push({
      acao: 'Registrar produzido x consumido por alguns dias para mapear onde está a sobra.',
      base: 'Ainda sem dados de desperdício suficientes.',
      prioridade: 1,
    });
  }

  return {
    tipo: 'reduzir_desperdicio',
    titulo: 'Como reduzir o desperdício',
    acoes,
    impactoTotalReais: 0,
    viabilidade: viabilidadeDe(acoes),
    resumo: `Foco nos pratos que mais sobram. ${acoes.length} ações sugeridas.`,
  };
}

function melhorarAceitacao(d: DossieIA): PlanoObjetivo {
  const acoes: AcaoRecomendada[] = [];

  (d.dna?.campeoes ?? d.melhoresAceitacao.map((m) => m.prato)).slice(0, 3).forEach((prato, i) => {
    acoes.push({
      acao: `Programar "${prato}" na próxima semana — é um campeão de aceitação.`,
      base: 'DNA alimentar: prato bem avaliado e de baixa sobra.',
      prioridade: i + 1,
    });
  });

  (d.dna?.problemas ?? d.pioresAceitacao.map((p) => p.prato)).slice(0, 2).forEach((prato) => {
    acoes.push({
      acao: `Substituir ou ajustar "${prato}" — costuma decepcionar.`,
      base: 'DNA alimentar: aceitação baixa ou muita sobra.',
      prioridade: acoes.length + 1,
    });
  });

  if (acoes.length === 0) {
    acoes.push({
      acao: 'Coletar mais avaliações na aba de Aceitação para identificar favoritos.',
      base: 'Histórico de avaliações ainda pequeno.',
      prioridade: 1,
    });
  }

  return {
    tipo: 'melhorar_aceitacao',
    titulo: 'Como melhorar a aceitação',
    acoes,
    impactoTotalReais: 0,
    viabilidade: viabilidadeDe(acoes),
    resumo: d.dna?.resumo ?? `${acoes.length} ações com base nas avaliações da equipe.`,
  };
}

function equilibrarProteinas(d: DossieIA): PlanoObjetivo {
  const acoes: AcaoRecomendada[] = [];

  // distribuição de proteínas no cardápio atual
  const cont = new Map<string, number>();
  d.cardapio.forEach((c) => {
    if (c.proteina && c.proteina !== 'outros') cont.set(c.proteina, (cont.get(c.proteina) ?? 0) + 1);
  });
  const dias = d.cardapio.length || 1;

  // se uma proteína domina (≥ metade dos dias), sugerir variar
  for (const [prot, n] of Array.from(cont.entries())) {
    if (n / dias >= 0.5 && n >= 2) {
      const alternativa = d.dna?.proteinasPreferidas.find((p) => p.rotulo.toLowerCase() !== prot)?.rotulo;
      acoes.push({
        acao: alternativa
          ? `${prot} aparece em ${n} de ${dias} dias — troque um por ${alternativa.toLowerCase()}.`
          : `${prot} aparece em ${n} de ${dias} dias — varie a proteína em pelo menos um dia.`,
        base: 'Distribuição de proteínas concentrada.',
        prioridade: acoes.length + 1,
      });
    }
  }

  // proteínas preferidas da casa que não estão na semana
  (d.dna?.proteinasPreferidas ?? []).slice(0, 3).forEach((p) => {
    const presente = Array.from(cont.keys()).some((k) => k === p.rotulo.toLowerCase());
    if (!presente && (p.nota === null || p.nota >= 3.5)) {
      acoes.push({
        acao: `Incluir ${p.rotulo.toLowerCase()} — bem aceita (${p.nota ?? '–'}) e ausente esta semana.`,
        base: `DNA: ${p.pct}% do histórico, nota ${p.nota ?? '–'}.`,
        prioridade: acoes.length + 1,
      });
    }
  });

  if (acoes.length === 0) {
    acoes.push({
      acao: 'A distribuição de proteínas da semana está equilibrada. ',
      base: 'Nenhuma proteína domina o cardápio.',
      prioridade: 1,
    });
  }

  return {
    tipo: 'equilibrar_proteinas',
    titulo: 'Como equilibrar as proteínas',
    acoes,
    impactoTotalReais: 0,
    viabilidade: viabilidadeDe(acoes),
    resumo: `Variedade de proteínas ao longo da semana. ${acoes.length} ações.`,
  };
}

/** Resolve um objetivo num plano de ações concretas. */
export function resolverObjetivo(objetivo: Objetivo, dossie: DossieIA): PlanoObjetivo {
  switch (objetivo.tipo) {
    case 'reduzir_custo':
      return reduzirCusto(dossie, objetivo.alvo ?? 0.1);
    case 'reduzir_desperdicio':
      return reduzirDesperdicio(dossie);
    case 'melhorar_aceitacao':
      return melhorarAceitacao(dossie);
    case 'equilibrar_proteinas':
      return equilibrarProteinas(dossie);
  }
}
