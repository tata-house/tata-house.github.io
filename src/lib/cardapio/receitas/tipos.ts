/* =====================================================================
   Tipo central da biblioteca culinária do Tatá House.

   FONTE ÚNICA DE VERDADE por prato: ingredientes, modo de preparo,
   nutrição, operação e classificação vivem todos no MESMO objeto. Custo e
   custo por refeição NÃO são guardados aqui — são calculados ao vivo a
   partir da cotação (precos) pelo motor, para sempre refletir o preço real.

   Quantidades são "por pessoa" (1 refeição) e escalam automaticamente
   pelo nº de refeições do dia — o motor multiplica porPessoa × pessoas.

   Arquitetura de crescimento: cada categoria fica num arquivo próprio
   (aves.ts, bovinos.ts, …) exportando `PRATOS: Receita[]`. O index.ts
   agrega tudo. Para crescer a biblioteca, basta criar/editar um arquivo.
   ===================================================================== */

import type { Proteina } from '../tipos';

/** Slot funcional no cardápio (define onde o prato entra no dia). */
export type CategoriaReceita = 'principal' | 'guarnicao' | 'salada' | 'sobremesa';

/** Faixa de custo/posicionamento do prato. */
export type ClasseReceita = 'economica' | 'equilibrada' | 'premium';

/** Esforço de produção na cozinha do refeitório. */
export type Complexidade = 'baixa' | 'media' | 'alta';

export interface IngredienteReceita {
  item: string; // nome do ingrediente (casa com o catálogo quando possível)
  unid: string; // kg, un, lt, ml, g, pct, cx, lata, bag, mç, pç
  porPessoa: number; // quantidade por refeição (escala pelo nº de pessoas)
  opcional?: boolean;
}

/** Informação nutricional estimada por porção (almoço de refeitório). */
export interface NutricaoReceita {
  kcal: number;
  prot: number; // g de proteína
  carb: number; // g de carboidrato
  gord: number; // g de gordura
  fibra: number; // g de fibra
  sodio: number; // mg de sódio
}

export interface Receita {
  /* --- identidade --- */
  nome: string; // nome profissional (vira opção no cardápio)
  categoria: CategoriaReceita;
  classe: ClasseReceita;
  proteina?: Proteina;
  /** rótulos amplos: 'regional', 'molho', 'prato-unico', 'vegetariano',
   *  'nordestina', 'mineira', 'comfort', etc. (livre, para filtros/IA) */
  tags: string[];

  /* --- produção --- */
  ingredientes: IngredienteReceita[];
  preparo: string[]; // passo a passo resumido, orientado à cozinha
  rendimentoPorcaoG: number; // gramas por porção servida
  tempoMin: number; // tempo médio de execução (min) para o volume do refeitório
  complexidade: Complexidade;
  obsOperacional?: string; // dica prática de produção em escala

  /* --- decisão --- */
  nutricao: NutricaoReceita; // por porção
  substituicoes?: string[]; // trocas possíveis de ingrediente/proteína
  adequacaoRefeitorio: number; // 0–100: o quão indicado é para refeitório
}

/** Normalizador local (igual ao do motor, sem import circular). */
export function normReceita(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Uma receita é "completa" quando tem tudo que a cozinha precisa. */
export function receitaCompleta(r: Receita): boolean {
  return (
    !!r.nome &&
    !!r.categoria &&
    !!r.classe &&
    Array.isArray(r.ingredientes) &&
    r.ingredientes.length > 0 &&
    Array.isArray(r.preparo) &&
    r.preparo.length >= 2 &&
    r.rendimentoPorcaoG > 0 &&
    r.tempoMin > 0 &&
    !!r.complexidade &&
    !!r.nutricao &&
    r.nutricao.kcal > 0 &&
    r.adequacaoRefeitorio > 0
  );
}
