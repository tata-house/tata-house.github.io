/* =====================================================================
   Módulo 8 — Assistente inteligente interno.
   Motor de respostas baseado em regras sobre os dados reais do sistema.
   A função `responder` é o ponto único de integração: trocar a
   implementação por uma chamada a IA externa no futuro não muda a UI.

   Funções async (responderAsync / gerarBriefing) chamam /api/ia quando
   há chave configurada; em caso de falha caem no modo baseado em regras.
   ===================================================================== */

import { formatarQtd, formatarReais, normalizar, proteinaDoPrato } from './motor';
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
    .map((c) => ({ item: c.item, unid: c.unid, qtd: c.qtd, custo: (ctx.precos[c.norm] ?? 0) * c.qtd }))
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
    if (radar.length === 0) return { texto: 'Nenhum item teve aumento anormal de preço no histórico recente. 👍' };
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
    if (al.length === 0) return { texto: 'Nenhum item está abaixo do estoque mínimo no momento. 👍' };
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
 * Insight proativo: o app fala primeiro. Retorna o alerta mais relevante do
 * momento (preço, estoque ou aceitação) ou null se está tudo tranquilo.
 */
export function insightProativo(ctx: ContextoAssistente): RespostaAssistente | null {
  const altas = analisarRadar(ctx.precos, ctx.historico, ctx.fornecedores).filter((r) => r.alerta === 'alta');
  if (altas.length > 0) return { texto: `💡 ${fraseAlerta(altas[0])}` };

  const baixos = alertasEstoque(ctx.estoque);
  if (baixos.length > 0)
    return {
      texto: `📦 ${baixos.length} ${baixos.length === 1 ? 'item está' : 'itens estão'} no limite do estoque:`,
      itens: baixos.slice(0, 4).map((a) => `${a.item} — ${formatarQtd(a.qtd)} ${a.unid}`),
    };

  const ruins = rankingAceitacao(ctx.aceitacao).filter((r) => r.media < 2.5);
  if (ruins.length > 0)
    return {
      texto: `👎 ${ruins[0].prato} teve aceitação baixa (nota ${ruins[0].media.toFixed(1)}). Vale considerar tirar do cardápio.`,
    };

  return null;
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
