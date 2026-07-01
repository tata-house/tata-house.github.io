/* =====================================================================
   Módulo 8 — Assistente inteligente interno.
   Motor de respostas baseado em regras sobre os dados reais do sistema.
   A função `responder` é o ponto único de integração: trocar a
   implementação por uma chamada a IA externa no futuro não muda a UI.

   Funções async (responderAsync / gerarBriefing) chamam /api/ia quando
   há chave configurada; em caso de falha caem no modo baseado em regras.
   ===================================================================== */

import { formatarQtd, formatarReais, normalizar, proteinaDoPrato, converterParaUnidadeBase } from './motor';
import { resolverPreco } from './precos';
import { consumoDaSemana, alertasEstoque } from './indicadores';
import { analisarRadar, fraseAlerta } from './radar';
import type { Aceitacao, Estoque, EstadoSemana, HistoricoPrecos } from './tipos';
import type { DossieIA } from './dossie';

export interface ContextoAssistente {
  estado: EstadoSemana;
  semanaId: string;
  precos: Record<string, number>;
  historico: HistoricoPrecos;
  fornecedores: Record<string, string>;
  aceitacao: Aceitacao;
  estoque: Estoque;
  fatores?: Record<string, number>;
}

export interface RespostaAssistente {
  texto: string;
  itens?: string[];
}

export const PERGUNTAS_SUGERIDAS = [
  'Onde estou gastando mais?',
  'Quais itens subiram de preço?',
  'Quais pratos tiveram melhor aceitação?',
  'Quais pratos devo evitar?',
  'Como reduzir o custo da próxima semana?',
  'O que está acabando no estoque?',
];

function gastosDaSemana(ctx: ContextoAssistente) {
  return consumoDaSemana(ctx.estado, ctx.fatores)
    .map((c) => ({ item: c.item, unid: c.unid, qtd: c.qtd, custo: resolverPreco(c.norm, ctx.precos).valor * converterParaUnidadeBase(c.qtd, c.unid) }))
    .filter((x) => x.custo > 0)
    .sort((a, b) => b.custo - a.custo);
}

function rankingAceitacao(ac: Aceitacao) {
  return Object.values(ac)
    .filter((r) => r.n > 0)
    .map((r) => ({ prato: r.prato, media: r.somaNotas / r.n, n: r.n }))
    .sort((a, b) => b.media - a.media);
}

const m = (s: string) => normalizar(s);

export function responder(pergunta: string, ctx: ContextoAssistente): RespostaAssistente {
  const q = m(pergunta);

  // onde estou gastando mais
  if (/gast|gasto|caro|mais cust|onde.*dinheiro/.test(q)) {
    const top = gastosDaSemana(ctx).slice(0, 5);
    if (top.length === 0)
      return { texto: 'Ainda não há preços suficientes lançados para calcular onde está o maior gasto. Lance os preços em Compras → Preços ou no catálogo em Ajustes.' };
    return {
      texto: 'Os itens que mais pesam no custo desta semana são:',
      itens: top.map((t) => `${t.item} — ${formatarReais(t.custo)} (${formatarQtd(t.qtd)} ${t.unid})`),
    };
  }

  // fornecedor mais barato
  if (/fornecedor|marca|onde comprar/.test(q)) {
    const lista = Object.entries(ctx.fornecedores).slice(0, 8);
    if (lista.length === 0)
      return { texto: 'Nenhum fornecedor preferido foi definido ainda. Ao aplicar uma cotação, o app marca o fornecedor mais barato de cada item.' };
    return {
      texto: 'Fornecedores marcados como mais baratos por item:',
      itens: lista.map(([norm, f]) => `${norm} → ${f}`),
    };
  }

  // itens que subiram de preço
  if (/subi|aument|preço suba|caro fic|radar|variaç/.test(q)) {
    const radar = analisarRadar(ctx.precos, ctx.historico, ctx.fornecedores).filter((r) => r.alerta === 'alta');
    if (radar.length === 0) return { texto: 'Nenhum item teve aumento anormal de preço no histórico recente. ' };
    return { texto: 'Itens com alta anormal de preço:', itens: radar.slice(0, 6).map(fraseAlerta) };
  }

  // melhor aceitação
  if (/melhor|gostaram|aceit|aprovad|favorit|mais querid/.test(q) && !/pior|evit|ruim/.test(q)) {
    const r = rankingAceitacao(ctx.aceitacao).slice(0, 5);
    if (r.length === 0) return { texto: 'Ainda não há avaliações dos pratos. Use a aba Aceitação para registrar o que a equipe achou.' };
    return { texto: 'Pratos com melhor aceitação:', itens: r.map((x) => `${x.prato} — nota ${x.media.toFixed(1)} (${x.n} avaliações)`) };
  }

  // pratos a evitar / pior aceitação
  if (/evit|pior|ruim|não gost|desperd|sobr/.test(q)) {
    const r = rankingAceitacao(ctx.aceitacao)
      .slice()
      .reverse()
      .slice(0, 5);
    if (r.length === 0) return { texto: 'Sem avaliações registradas ainda — não dá para apontar pratos a evitar com segurança.' };
    return {
      texto: 'Pratos com pior aceitação (avalie trocar ou ajustar a porção):',
      itens: r.map((x) => `${x.prato} — nota ${x.media.toFixed(1)} (${x.n} avaliações)`),
    };
  }

  // estoque baixo
  if (/estoque|acaba|faltando|repor/.test(q)) {
    const al = alertasEstoque(ctx.estoque);
    if (al.length === 0) return { texto: 'Nenhum item está abaixo do estoque mínimo no momento. ' };
    return { texto: 'Itens no/ abaixo do mínimo:', itens: al.map((a) => `${a.item} — ${formatarQtd(a.qtd)} ${a.unid} (mín. ${formatarQtd(a.minimo)})`) };
  }

  // como reduzir custo
  if (/reduz|economi|baratear|cortar custo|melhorar custo/.test(q)) {
    const sugestoes: string[] = [];
    const top = gastosDaSemana(ctx).slice(0, 3);
    top.forEach((t) => {
      if (proteinaDoPrato(t.item) !== 'outros') sugestoes.push(`Reveja a proteína "${t.item}" — é um dos maiores custos da semana.`);
    });
    const radarAlta = analisarRadar(ctx.precos, ctx.historico, ctx.fornecedores).filter((r) => r.alerta === 'alta');
    radarAlta.slice(0, 2).forEach((r) => sugestoes.push(fraseAlerta(r)));
    const al = alertasEstoque(ctx.estoque);
    if (al.length > 0) sugestoes.push('Use o que já está em estoque antes de comprar — há itens parados que podem entrar no cardápio.');
    if (sugestoes.length === 0) sugestoes.push('Lance a cotação da semana e as contagens de refeição para o app calcular onde cortar com segurança.');
    return { texto: 'Caminhos para reduzir o custo da próxima semana:', itens: sugestoes };
  }

  return {
    texto: 'Posso ajudar com custos, preços, fornecedores, aceitação dos pratos e estoque. Tente uma destas perguntas:',
    itens: PERGUNTAS_SUGERIDAS,
  };
}

/**
 * Insight proativo: o sistema fala primeiro. Varre 7 sinais em ordem de
 * relevância e retorna o alerta mais importante — oportunidade econômica,
 * risco operacional ou recomendação de cardápio.
 */
export function insightProativo(ctx: ContextoAssistente): RespostaAssistente | null {
  const radar = analisarRadar(ctx.precos, ctx.historico, ctx.fornecedores);
  const altas = radar.filter((r) => r.alerta === 'alta');

  // 1. Alta de preço com substituto e economia quantificada — oportunidade real
  const altaComSubst = altas.find((a) => a.substituir);
  if (altaComSubst?.substituir) {
    const pct = Math.round(Math.abs(altaComSubst.variacao ?? 0) * 100);
    return {
      texto: `${altaComSubst.item} subiu ${pct}% — substituir por ${altaComSubst.substituir.item} gera economia de ${formatarReais(altaComSubst.substituir.economia)}/${altaComSubst.unid}.`,
    };
  }

  // 2. Alta de preço sem substituto
  if (altas.length > 0) return { texto: fraseAlerta(altas[0]) };

  // 3. Queda de preço — oportunidade de compra
  const quedas = radar.filter((r) => r.alerta === 'queda');
  if (quedas.length > 0) {
    const q = quedas[0];
    const pct = Math.round(Math.abs(q.variacao ?? 0) * 100);
    return { texto: `Oportunidade: ${q.item} caiu ${pct}% — bom momento para comprar mais e reforçar o estoque.` };
  }

  // 4. Estoque crítico
  const baixos = alertasEstoque(ctx.estoque);
  if (baixos.length > 0)
    return {
      texto: `${baixos.length} ${baixos.length === 1 ? 'item está' : 'itens estão'} no limite do estoque:`,
      itens: baixos.slice(0, 4).map((a) => `${a.item} — ${formatarQtd(a.qtd)} ${a.unid}`),
    };

  const ranking = rankingAceitacao(ctx.aceitacao);
  const pratosDaSemana = ctx.estado.dias.map((d) => normalizar(d.principal ?? '')).filter(Boolean);

  // 5. Prato com nota baixa no cardápio desta semana — risco operacional imediato
  const rejeitadoNaSemana = ranking
    .filter((r) => r.media < 2.5)
    .find((r) => pratosDaSemana.includes(normalizar(r.prato)));
  if (rejeitadoNaSemana) {
    return {
      texto: `"${rejeitadoNaSemana.prato}" está no cardápio desta semana com nota ${rejeitadoNaSemana.media.toFixed(1)}★ — historicamente rejeitado pela equipe. Considere substituir.`,
    };
  }

  // 6. Prato campeão ausente desta semana — oportunidade de melhorar aceitação
  const tops = ranking.filter((r) => r.media >= 4 && r.n >= 2);
  const semanaSet = new Set(pratosDaSemana);
  const campeaoFora = tops.find((t) => !semanaSet.has(normalizar(t.prato)));
  if (campeaoFora) {
    return {
      texto: `"${campeaoFora.prato}" é um dos favoritos da equipe (${campeaoFora.media.toFixed(1)}★ em ${campeaoFora.n} avaliações) e não aparece no cardápio desta semana.`,
    };
  }

  // 7. Nota baixa geral
  const ruins = ranking.filter((r) => r.media < 2.5);
  if (ruins.length > 0)
    return {
      texto: `${ruins[0].prato} teve aceitação baixa (nota ${ruins[0].media.toFixed(1)}). Vale considerar tirar do cardápio.`,
    };

  return null;
}

/**
 * Resumo estratégico: o que a IA faria agora, sem esperar pergunta.
 * Sintetiza economia possível + frentes prioritárias para abrir o
 * Assistente já com uma posição — como um analista que adiantou o trabalho.
 */
export interface ResumoEstrategico {
  titulo: string;
  itens: string[];
}

export function resumoEstrategico(ctx: ContextoAssistente): ResumoEstrategico | null {
  const radar = analisarRadar(ctx.precos, ctx.historico, ctx.fornecedores);
  const itens: string[] = [];

  // Economia somada das substituições disponíveis
  const altasSubst = radar.filter((r) => r.alerta === 'alta' && r.substituir);
  let economia = 0;
  let unid = 'kg';
  altasSubst.forEach((r) => {
    economia += r.substituir!.economia;
    unid = r.unid || unid;
    const pct = Math.round(Math.abs(r.variacao ?? 0) * 100);
    itens.push(`${r.item} subiu ${pct}% — trocar por ${r.substituir!.item} economiza ${formatarReais(r.substituir!.economia)}/${r.unid}.`);
  });

  // Quedas — oportunidade de reforçar
  radar.filter((r) => r.alerta === 'queda').slice(0, 1).forEach((r) => {
    const pct = Math.round(Math.abs(r.variacao ?? 0) * 100);
    itens.push(`${r.item} caiu ${pct}% — bom momento para reforçar o estoque.`);
  });

  // Estoque crítico
  const baixos = alertasEstoque(ctx.estoque);
  if (baixos.length > 0) {
    itens.push(`${baixos.length} ${baixos.length === 1 ? 'item está' : 'itens estão'} no limite do estoque — ${baixos.slice(0, 2).map((a) => a.item).join(', ')}.`);
  }

  // Prato rejeitado no cardápio desta semana
  const ranking = rankingAceitacao(ctx.aceitacao);
  const pratosDaSemana = ctx.estado.dias.map((d) => normalizar(d.principal ?? '')).filter(Boolean);
  const rejeitado = ranking.filter((r) => r.media < 2.5).find((r) => pratosDaSemana.includes(normalizar(r.prato)));
  if (rejeitado) {
    itens.push(`"${rejeitado.prato}" está no cardápio desta semana com nota ${rejeitado.media.toFixed(1)}★ — considere substituir.`);
  }

  if (itens.length === 0) return null;

  const titulo = economia >= 0.01
    ? `Já analisei a semana. Identifiquei ${formatarReais(economia)}/${unid} de economia possível e ${itens.length} ${itens.length === 1 ? 'frente' : 'frentes'} de ação.`
    : `Já analisei a semana. ${itens.length} ${itens.length === 1 ? 'ponto pede' : 'pontos pedem'} sua decisão.`;

  return { titulo, itens: itens.slice(0, 4) };
}

/* ------------------------------------------------------------------ */
/* Camada async — chama /api/ia, cai em regras se offline              */
/* ------------------------------------------------------------------ */

async function chamarIA(
  tarefa: string,
  dossie: DossieIA,
  modo: 'pergunta' | 'briefing' | 'decisao' | 'alerta' = 'pergunta',
): Promise<RespostaAssistente | null> {
  try {
    const { chamarIACliente } = await import('./ia-cliente');
    const json = await chamarIACliente(tarefa, dossie, modo);
    if (json.offline) return null;
    if (json.texto) return { texto: json.texto, itens: json.itens };
    return null;
  } catch {
    return null;
  }
}

/**
 * Versão async de `responder`: tenta LLM via /api/ia, cai em regras.
 * Use nos componentes que podem esperar pela IA.
 */
export async function responderAsync(
  pergunta: string,
  ctx: ContextoAssistente,
  dossie: DossieIA,
): Promise<RespostaAssistente> {
  const iaResposta = await chamarIA(pergunta, dossie, 'pergunta');
  if (iaResposta) return iaResposta;
  return responder(pergunta, ctx);
}

/**
 * Briefing diário (piloto automático). Retorna o alerta mais relevante
 * com explicação gerada pelo LLM, ou cai em insightProativo.
 */
export async function gerarBriefing(
  ctx: ContextoAssistente,
  dossie: DossieIA,
): Promise<RespostaAssistente | null> {
  const iaResposta = await chamarIA('Gere o briefing operacional do dia.', dossie, 'briefing');
  if (iaResposta) return iaResposta;
  return insightProativo(ctx);
}
