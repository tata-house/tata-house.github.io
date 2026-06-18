/* =====================================================================
   Biblioteca culinária do Tatá House — agregador.

   Une todas as fatias (aves, bovinos, suínos, peixes, completos,
   guarnições, saladas, sobremesas, molhos/vegetarianos) numa única
   biblioteca, deduplica por nome e expõe a API usada pelo motor, pelo
   Chef IA e pelas telas.

   CRESCIMENTO: para ampliar a biblioteca, crie um novo arquivo de fatia
   exportando `PRATOS: Receita[]` e registre-o em FATIAS abaixo. Nada mais
   muda — índices, custo e escala passam a valer automaticamente.
   ===================================================================== */

import type { ItemSugerido } from '../tipos';
import type {
  Receita,
  CategoriaReceita,
  IngredienteReceita,
  ClasseReceita,
  Complexidade,
  NutricaoReceita,
} from './tipos';
import { normReceita, receitaCompleta } from './tipos';

import { PRATOS as AVES } from './aves';
import { PRATOS as BOVINOS } from './bovinos';
import { PRATOS as SUINOS } from './suinos';
import { PRATOS as PEIXES } from './peixes';
import { PRATOS as COMPLETOS } from './completos';
import { PRATOS as GUARNICOES } from './guarnicoes';
import { PRATOS as SALADAS } from './saladas';
import { PRATOS as SOBREMESAS } from './sobremesas';
import { PRATOS as MOLHOS } from './molhos';

export type {
  Receita,
  CategoriaReceita,
  IngredienteReceita,
  ClasseReceita,
  Complexidade,
  NutricaoReceita,
};
export { receitaCompleta } from './tipos';

/** Ordem das fatias — registre novas fatias aqui para crescer a biblioteca. */
const FATIAS: Receita[][] = [
  AVES,
  BOVINOS,
  SUINOS,
  PEIXES,
  COMPLETOS,
  GUARNICOES,
  SALADAS,
  SOBREMESAS,
  MOLHOS,
];

/** Lista única, sem duplicatas (primeira ocorrência por nome normalizado vence). */
export const TODAS_RECEITAS: Receita[] = (() => {
  const vistos = new Set<string>();
  const out: Receita[] = [];
  for (const fatia of FATIAS) {
    for (const r of fatia) {
      const k = normReceita(r.nome);
      if (!k || vistos.has(k)) continue;
      vistos.add(k);
      out.push(r);
    }
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
})();

/** Índice por nome normalizado. */
export const RECEITAS: Record<string, Receita> = Object.fromEntries(
  TODAS_RECEITAS.map((r) => [normReceita(r.nome), r]),
);

/** Receita do prato (por nome), ou null. */
export function receitaDoPrato(prato: string | null | undefined): Receita | null {
  return RECEITAS[normReceita(prato)] ?? null;
}

/** Itens de compra de uma receita, escalados pelo nº de pessoas. */
export function itensDaReceita(prato: string, pessoas: number): ItemSugerido[] | null {
  const r = receitaDoPrato(prato);
  if (!r) return null;
  return r.ingredientes.map((ing) => ({
    item: ing.item,
    unid: ing.unid,
    qtd: ing.porPessoa * Math.max(pessoas, 0),
    fonte: 'receita' as const,
  }));
}

/** Nomes de pratos com receita, agrupados por categoria (para os seletores). */
export const RECEITAS_POR_CATEGORIA: Record<CategoriaReceita, string[]> = {
  principal: TODAS_RECEITAS.filter((r) => r.categoria === 'principal').map((r) => r.nome),
  guarnicao: TODAS_RECEITAS.filter((r) => r.categoria === 'guarnicao').map((r) => r.nome),
  salada: TODAS_RECEITAS.filter((r) => r.categoria === 'salada').map((r) => r.nome),
  sobremesa: TODAS_RECEITAS.filter((r) => r.categoria === 'sobremesa').map((r) => r.nome),
};

/**
 * Guarnições fixas (base de arroz e feijão) — todas com receita na
 * biblioteca. Usadas no seletor "Guarnição fixa" do cardápio para que
 * NENHUMA opção exista sem receita completa. A primeira é o padrão do dia.
 */
export const GUARNICOES_FIXAS: string[] = [
  'Arroz e Feijão',
  'Arroz branco',
  'Feijão carioca',
  'Feijão preto',
  'Arroz integral',
].filter((nome) => !!RECEITAS[normReceita(nome)]);

/* ------------------------------ custo ao vivo ------------------------------ */

export interface CustoReceita {
  porRefeicao: number; // R$ por porção
  total: number; // R$ para o nº de pessoas informado
  itensComPreco: number;
  itensTotal: number;
  itensSemPreco: string[]; // ingredientes sem cotação válida
  completo: boolean; // todos os ingredientes (não opcionais) têm preço?
}

/**
 * Custo da receita a partir da cotação atual (precos por item normalizado).
 * `estimativas` é uma tabela opcional de preço de reserva (item → R$),
 * usada quando não há cotação real. Nunca inventa preço: itens sem preço
 * entram em `itensSemPreco` e não contam no total.
 */
export function custoReceita(
  prato: string,
  pessoas: number,
  precos: Record<string, number>,
  estimativas?: Record<string, number>,
): CustoReceita | null {
  const r = receitaDoPrato(prato);
  if (!r) return null;
  let total = 0;
  let com = 0;
  const semPreco: string[] = [];
  for (const ing of r.ingredientes) {
    const k = normReceita(ing.item);
    const p = precos[k] ?? estimativas?.[k] ?? 0;
    if (p > 0) {
      total += p * ing.porPessoa * Math.max(pessoas, 0);
      com++;
    } else if (!ing.opcional) {
      semPreco.push(ing.item);
    }
  }
  return {
    porRefeicao: pessoas > 0 ? total / pessoas : 0,
    total,
    itensComPreco: com,
    itensTotal: r.ingredientes.length,
    itensSemPreco: semPreco,
    completo: semPreco.length === 0,
  };
}

/* ------------------------------ estatísticas ------------------------------ */

/** Quantos pratos completos a biblioteca tem (regra: nenhum prato sem receita completa). */
export const RECEITAS_INCOMPLETAS: string[] = TODAS_RECEITAS.filter((r) => !receitaCompleta(r)).map(
  (r) => r.nome,
);

export const TOTAL_RECEITAS = TODAS_RECEITAS.length;
