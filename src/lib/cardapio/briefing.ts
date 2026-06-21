/* =====================================================================
   Piloto automático — briefing diário da gestão.
   Consolida TODOS os sinais ativos (preço, estoque, desperdício,
   aceitação, orçamento) num único card priorizado de "o que fazer hoje".
   Determinístico + sem IA. O LLM (via /api/ia modo briefing) pode narrar
   por cima, mas o card já funciona 100% offline.
   ===================================================================== */

import { analisarRadar } from './radar';
import { alertasEstoque } from './indicadores';
import type { DossieIA } from './dossie';
import type { HistoricoPrecos, Estoque, EstadoSemana } from './tipos';

export type NivelAlerta = 'urgente' | 'atencao' | 'info';

export interface ItemBriefing {
  nivel: NivelAlerta;
  icone: string;
  titulo: string;
  detalhe: string;
  acao?: string; // chamada para ação curta
}

export interface Briefing {
  saudacao: string; // "Bom dia, gestor "
  itens: ItemBriefing[];
  tudo_ok: boolean;
  geradoEm: string;
}

/* ------------------------------------------------------------------ */

function hora(): 'manha' | 'tarde' | 'noite' {
  const h = new Date().getHours();
  if (h < 12) return 'manha';
  if (h < 18) return 'tarde';
  return 'noite';
}

function saudacao(): string {
  const s = { manha: 'Bom dia', tarde: 'Boa tarde', noite: 'Boa noite' }[hora()];
  return `${s}, gestor `;
}

/* ---- coleta alertas de cada domínio -------------------------------- */

function alertasPreco(dossie: DossieIA): ItemBriefing[] {
  return dossie.alertasPreco
    .filter((a) => a.variacaoPct >= 15)
    .slice(0, 2)
    .map((a) => ({
      nivel: a.variacaoPct >= 30 ? 'urgente' : 'atencao',
      icone: '',
      titulo: `${a.item} subiu ${a.variacaoPct}%`,
      detalhe: `De R$${a.precoMedio.toFixed(2)} para R$${a.precoAtual.toFixed(2)} desde a última cotação.`,
      acao: 'Avaliar substituição ou cotação extra.',
    } satisfies ItemBriefing));
}

function alertasEstoqueBriefing(dossie: DossieIA): ItemBriefing[] {
  return dossie.estoqueAbaixoMinimo.slice(0, 3).map((e) => ({
    nivel: e.qtd === 0 ? 'urgente' : 'atencao',
    icone: '',
    titulo: `${e.item} ${e.qtd === 0 ? 'zerado' : 'abaixo do mínimo'}`,
    detalhe: `Saldo: ${e.qtd} ${e.unid} (mín. ${e.minimo} ${e.unid}).`,
    acao: 'Incluir na próxima compra.',
  } satisfies ItemBriefing));
}

function alertasDesperdicio(dossie: DossieIA): ItemBriefing[] {
  return dossie.maisDesperdicio
    .filter((d) => d.taxaMedia >= 0.15)
    .slice(0, 2)
    .map((d) => ({
      nivel: d.taxaMedia >= 0.3 ? 'urgente' : 'atencao',
      icone: '',
      titulo: `${d.prato} — ${Math.round(d.taxaMedia * 100)}% de sobra`,
      detalhe: `Média de ${Math.round(d.taxaMedia * 100)}% desperdiçado em ${d.n} registro(s).`,
      acao: 'Reduzir produção ou retirar do cardápio.',
    } satisfies ItemBriefing));
}

function alertaAceitacao(dossie: DossieIA): ItemBriefing[] {
  return dossie.pioresAceitacao
    .filter((p) => p.media < 2.5 && p.n >= 3)
    .slice(0, 1)
    .map((p) => ({
      nivel: 'atencao',
      icone: '',
      titulo: `${p.prato} — nota ${p.media}`,
      detalhe: `${p.n} avaliações com nota média ${p.media}. Equipe não está gostando.`,
      acao: 'Considerar retirar do cardápio.',
    } satisfies ItemBriefing));
}

function alertaOrcamento(dossie: DossieIA): ItemBriefing[] {
  if (!dossie.orcamento || !dossie.custoTotal) return [];
  const pct = (dossie.custoTotal / dossie.orcamento) * 100;
  if (pct <= 90) return [];
  return [
    {
      nivel: pct >= 110 ? 'urgente' : 'atencao',
      icone: '',
      titulo: `Custo ${pct >= 110 ? 'acima' : 'perto'} do orçamento`,
      detalhe: `R$${dossie.custoTotal.toFixed(0)} estimado vs R$${dossie.orcamento.toFixed(0)} de orçamento (${Math.round(pct)}%).`,
      acao: 'Revisar proteínas caras ou porções.',
    },
  ];
}

function alertaCardapioIncompleto(estado: EstadoSemana): ItemBriefing[] {
  const faltando = estado.dias.filter((_, i) => i < 5 && !estado.dias[i].principal).length;
  if (!faltando) return [];
  return [
    {
      nivel: faltando >= 3 ? 'urgente' : 'atencao',
      icone: '',
      titulo: `${faltando} dia(s) sem cardápio`,
      detalhe: `Ainda há ${faltando} dia(s) da semana sem prato principal definido.`,
      acao: 'Preencher o cardápio para liberar a lista de compras.',
    },
  ];
}

function infoMemoria(dossie: DossieIA): ItemBriefing[] {
  const ajustes = dossie.memoria.filter((m) => Math.abs(m.fator - 1) >= 0.2);
  if (!ajustes.length) return [];
  const top = ajustes[0];
  const dir = top.fator > 1 ? 'acima' : 'abaixo';
  const pct = Math.round(Math.abs(top.fator - 1) * 100);
  return [
    {
      nivel: 'info',
      icone: '',
      titulo: `Memória: ${top.item} ajustado ${pct}% ${dir}`,
      detalhe: `A cozinha consistentemente pede ${pct}% ${dir} da sugestão. Fator ${top.fator}× aplicado.`,
    },
  ];
}

/* ---- ordena e filtra ------------------------------------------------ */

const NIVEL_ORDEM: Record<NivelAlerta, number> = { urgente: 0, atencao: 1, info: 2 };

/**
 * Monta o briefing do dia: consolida todos os alertas, ordena por
 * urgência e entrega o card pronto para exibição.
 * @param extrasProspectivos - alertas prospectivos calculados pelo BriefingCard
 */
export function montarBriefing(
  dossie: DossieIA,
  estado: EstadoSemana,
  extrasProspectivos?: ItemBriefing[],
): Briefing {
  const itens: ItemBriefing[] = [
    ...alertaCardapioIncompleto(estado),
    ...alertaOrcamento(dossie),
    ...alertasPreco(dossie),
    ...alertasEstoqueBriefing(dossie),
    ...alertasDesperdicio(dossie),
    ...alertaAceitacao(dossie),
    ...(extrasProspectivos ?? []),
    ...infoMemoria(dossie),
  ].sort((a, b) => NIVEL_ORDEM[a.nivel] - NIVEL_ORDEM[b.nivel]);

  return {
    saudacao: saudacao(),
    itens: itens.slice(0, 6), // máx 6 itens no card
    tudo_ok: itens.length === 0,
    geradoEm: new Date().toISOString(),
  };
}
