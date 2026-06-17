/* =====================================================================
   Receitas explícitas (prato → ingredientes por pessoa). Camada nova que
   torna o cálculo do cardápio DETERMINÍSTICO: quando um prato tem receita,
   o motor usa a receita (ingredientes e quantidades corretos), em vez de
   depender só do histórico. Quem não tem receita continua pelo histórico.

   Quantidades são "base por pessoa" (1 refeição) e escalam pelo nº de
   pessoas do dia. Edite/ajuste à vontade — são estimativas de refeitório.

   IMPORTANTE: este arquivo NÃO importa motor.ts (evita import circular);
   usa um normalizador local próprio.
   ===================================================================== */

import type { ItemSugerido, Proteina } from './tipos';

export type CategoriaReceita = 'principal' | 'guarnicao' | 'salada' | 'sobremesa';

export interface IngredienteReceita {
  item: string; // nome do ingrediente (casa com o catálogo quando possível)
  unid: string; // kg, un, lt, bd, lata, pct, bag…
  porPessoa: number; // quantidade por refeição
  opcional?: boolean;
}

export interface Receita {
  nome: string; // nome de exibição (vira opção no cardápio)
  categoria: CategoriaReceita;
  proteina?: Proteina;
  ingredientes: IngredienteReceita[];
  obs?: string;
}

function norm(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/* ---------------------------------------------------------------------
   Biblioteca de pratos (culinária brasileira / refeitório corporativo).
   --------------------------------------------------------------------- */
const LISTA: Receita[] = [
  /* ----------------------------- Principais ---------------------------- */
  {
    nome: 'Frango grelhado',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'File de frango sem osso', unid: 'kg', porPessoa: 0.16 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.004, opcional: true },
      { item: 'Sal', unid: 'kg', porPessoa: 0.004, opcional: true },
    ],
  },
  {
    nome: 'Frango ao molho',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'File de frango sem osso', unid: 'kg', porPessoa: 0.16 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.03 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
    ],
  },
  {
    nome: 'Frango xadrez',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'Peito de Frango sem osso', unid: 'kg', porPessoa: 0.15 },
      { item: 'Pimentão', unid: 'kg', porPessoa: 0.02 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.02 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Frango ensopado',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'File de frango sem osso', unid: 'kg', porPessoa: 0.16 },
      { item: 'Batata', unid: 'kg', porPessoa: 0.05 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.03 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Carne moída',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Carne Moída', unid: 'kg', porPessoa: 0.13 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Carne de panela',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Acém', unid: 'kg', porPessoa: 0.16 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
      { item: 'Batata', unid: 'kg', porPessoa: 0.04, opcional: true },
    ],
  },
  {
    nome: 'Bife acebolado',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Acém em bife', unid: 'kg', porPessoa: 0.14 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.03 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.004, opcional: true },
    ],
  },
  {
    nome: 'Almôndegas',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Carne Moída', unid: 'kg', porPessoa: 0.13 },
      { item: 'Ovos', unid: 'bd', porPessoa: 0.02 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.03 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
    ],
  },
  {
    nome: 'Filé de peixe',
    categoria: 'principal',
    proteina: 'peixe',
    ingredientes: [
      { item: 'Filé de peixe', unid: 'kg', porPessoa: 0.15 },
      { item: 'Limão', unid: 'kg', porPessoa: 0.01 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
    ],
  },
  {
    nome: 'Peixe assado',
    categoria: 'principal',
    proteina: 'peixe',
    ingredientes: [
      { item: 'Filé de peixe', unid: 'kg', porPessoa: 0.16 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Tomate', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Omelete',
    categoria: 'principal',
    proteina: 'ovo',
    ingredientes: [
      { item: 'Ovos', unid: 'bd', porPessoa: 0.06 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
      { item: 'Tomate', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Ovos mexidos',
    categoria: 'principal',
    proteina: 'ovo',
    ingredientes: [
      { item: 'Ovos', unid: 'bd', porPessoa: 0.06 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.003, opcional: true },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.005, opcional: true },
    ],
  },
  {
    nome: 'Linguiça acebolada',
    categoria: 'principal',
    proteina: 'suina',
    ingredientes: [
      { item: 'Linguiça Toscana', unid: 'kg', porPessoa: 0.14 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.03 },
    ],
  },
  {
    nome: 'Escondidinho de carne',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Carne Moída', unid: 'kg', porPessoa: 0.12 },
      { item: 'Mandioca', unid: 'kg', porPessoa: 0.12 },
      { item: 'Creme de Leite', unid: 'un', porPessoa: 0.02 },
      { item: 'Mussarela', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Estrogonofe de frango',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'Peito de Frango sem osso', unid: 'kg', porPessoa: 0.14 },
      { item: 'Creme de Leite', unid: 'un', porPessoa: 0.04 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.02 },
      { item: 'Batata Palha', unid: 'pct', porPessoa: 0.02, opcional: true },
    ],
  },
  {
    nome: 'Estrogonofe de carne',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Acém', unid: 'kg', porPessoa: 0.14 },
      { item: 'Creme de Leite', unid: 'un', porPessoa: 0.04 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.02 },
      { item: 'Batata Palha', unid: 'pct', porPessoa: 0.02, opcional: true },
    ],
  },

  /* ------------------------ Econômicos / criativos --------------------- */
  {
    nome: 'Arroz carreteiro',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.09 },
      { item: 'Carne Moída', unid: 'kg', porPessoa: 0.08 },
      { item: 'Linguiça Calabresa', unid: 'kg', porPessoa: 0.03 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
    ],
  },
  {
    nome: 'Baião de dois',
    categoria: 'principal',
    proteina: 'suina',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.07 },
      { item: 'Feijão Carioca', unid: 'kg', porPessoa: 0.04 },
      { item: 'Linguiça Calabresa', unid: 'kg', porPessoa: 0.03 },
      { item: 'Bacon', unid: 'kg', porPessoa: 0.01 },
    ],
  },
  {
    nome: 'Galinhada',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.08 },
      { item: 'File de frango sem osso', unid: 'kg', porPessoa: 0.12 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.02 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.01 },
    ],
  },
  {
    nome: 'Virado simples',
    categoria: 'principal',
    proteina: 'outros',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.08 },
      { item: 'Feijão Carioca', unid: 'kg', porPessoa: 0.05 },
      { item: 'Farinha de mandioca', unid: 'pct', porPessoa: 0.02 },
      { item: 'Couve', unid: 'un', porPessoa: 0.03 },
    ],
  },
  {
    nome: 'Yakisoba simples',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'Macarrão', unid: 'kg', porPessoa: 0.07 },
      { item: 'File de frango sem osso', unid: 'kg', porPessoa: 0.08 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.03 },
      { item: 'Repolho', unid: 'un', porPessoa: 0.03 },
      { item: 'Molho shoyu', unid: 'un', porPessoa: 0.01 },
    ],
  },
  {
    nome: 'Panqueca de carne',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Farinha de trigo', unid: 'kg', porPessoa: 0.03 },
      { item: 'Ovos', unid: 'bd', porPessoa: 0.02 },
      { item: 'Leite', unid: 'lt', porPessoa: 0.03 },
      { item: 'Carne Moída', unid: 'kg', porPessoa: 0.08 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Panqueca de frango',
    categoria: 'principal',
    proteina: 'frango',
    ingredientes: [
      { item: 'Farinha de trigo', unid: 'kg', porPessoa: 0.03 },
      { item: 'Ovos', unid: 'bd', porPessoa: 0.02 },
      { item: 'Leite', unid: 'lt', porPessoa: 0.03 },
      { item: 'Peito de Frango sem osso', unid: 'kg', porPessoa: 0.08 },
    ],
  },
  {
    nome: 'Macarronada com carne moída',
    categoria: 'principal',
    proteina: 'bovina',
    ingredientes: [
      { item: 'Macarrão', unid: 'kg', porPessoa: 0.08 },
      { item: 'Carne Moída', unid: 'kg', porPessoa: 0.08 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.04 },
    ],
  },

  /* ----------------------- Guarnições / acompanhamentos ---------------- */
  {
    nome: 'Arroz branco',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.09 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.002 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.003, opcional: true },
    ],
  },
  {
    nome: 'Arroz temperado',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.09 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.01 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.005 },
    ],
  },
  {
    nome: 'Arroz com cenoura',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.09 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Feijão carioca',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Feijão Carioca', unid: 'kg', porPessoa: 0.05 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.005 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.002 },
      { item: 'Bacon', unid: 'kg', porPessoa: 0.005, opcional: true },
    ],
  },
  {
    nome: 'Feijão preto',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Feijao Preto', unid: 'kg', porPessoa: 0.05 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.005 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.002 },
      { item: 'Bacon', unid: 'kg', porPessoa: 0.005, opcional: true },
    ],
  },
  {
    nome: 'Purê de batata',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Batata', unid: 'kg', porPessoa: 0.12 },
      { item: 'Leite', unid: 'lt', porPessoa: 0.02 },
      { item: 'Creme de Leite', unid: 'un', porPessoa: 0.01, opcional: true },
    ],
  },
  {
    nome: 'Batata rústica',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Batata', unid: 'kg', porPessoa: 0.12 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.005 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
    ],
  },
  {
    nome: 'Mandioca cozida',
    categoria: 'guarnicao',
    ingredientes: [{ item: 'Mandioca', unid: 'kg', porPessoa: 0.12 }],
  },
  {
    nome: 'Farofa',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Farinha de mandioca', unid: 'pct', porPessoa: 0.03 },
      { item: 'Bacon', unid: 'kg', porPessoa: 0.005, opcional: true },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.005 },
    ],
  },
  {
    nome: 'Macarrão alho e óleo',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Macarrão', unid: 'kg', porPessoa: 0.08 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.005 },
    ],
  },
  {
    nome: 'Macarrão ao sugo',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Macarrão', unid: 'kg', porPessoa: 0.08 },
      { item: 'Molho de tomate', unid: 'un', porPessoa: 0.03 },
    ],
  },
  {
    nome: 'Legumes refogados',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.04 },
      { item: 'Abobrinha', unid: 'kg', porPessoa: 0.04 },
      { item: 'Chuchu', unid: 'kg', porPessoa: 0.03 },
    ],
  },
  {
    nome: 'Abobrinha refogada',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Abobrinha', unid: 'kg', porPessoa: 0.1 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
    ],
  },
  {
    nome: 'Cenoura cozida',
    categoria: 'guarnicao',
    ingredientes: [{ item: 'Cenoura', unid: 'kg', porPessoa: 0.1 }],
  },
  {
    nome: 'Couve refogada',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Couve', unid: 'un', porPessoa: 0.06 },
      { item: 'Alho', unid: 'kg', porPessoa: 0.003 },
    ],
  },
  {
    nome: 'Polenta',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Fubá', unid: 'kg', porPessoa: 0.05 },
      { item: 'Óleo', unid: 'lt', porPessoa: 0.003, opcional: true },
    ],
  },
  {
    nome: 'Creme de milho',
    categoria: 'guarnicao',
    ingredientes: [
      { item: 'Milho', unid: 'lata', porPessoa: 0.04 },
      { item: 'Creme de Leite', unid: 'un', porPessoa: 0.02 },
      { item: 'Leite', unid: 'lt', porPessoa: 0.02 },
    ],
  },

  /* ------------------------------- Saladas ----------------------------- */
  {
    nome: 'Alface com tomate',
    categoria: 'salada',
    ingredientes: [
      { item: 'Alface', unid: 'un', porPessoa: 0.05 },
      { item: 'Tomate', unid: 'kg', porPessoa: 0.04 },
    ],
  },
  {
    nome: 'Salada de repolho',
    categoria: 'salada',
    ingredientes: [
      { item: 'Repolho', unid: 'un', porPessoa: 0.04 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Vinagrete',
    categoria: 'salada',
    ingredientes: [
      { item: 'Tomate', unid: 'kg', porPessoa: 0.04 },
      { item: 'Cebola', unid: 'kg', porPessoa: 0.02 },
      { item: 'Pimentão', unid: 'kg', porPessoa: 0.01 },
    ],
  },
  {
    nome: 'Salada de beterraba',
    categoria: 'salada',
    ingredientes: [{ item: 'Beterraba', unid: 'kg', porPessoa: 0.06 }],
  },
  {
    nome: 'Salada de cenoura',
    categoria: 'salada',
    ingredientes: [{ item: 'Cenoura', unid: 'kg', porPessoa: 0.06 }],
  },
  {
    nome: 'Salada de pepino',
    categoria: 'salada',
    ingredientes: [{ item: 'Pepino', unid: 'kg', porPessoa: 0.06 }],
  },
  {
    nome: 'Salpicão simples',
    categoria: 'salada',
    ingredientes: [
      { item: 'Peito de Frango sem osso', unid: 'kg', porPessoa: 0.05 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.02 },
      { item: 'Milho', unid: 'lata', porPessoa: 0.01 },
      { item: 'Maionese', unid: 'kg', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Maionese de legumes',
    categoria: 'salada',
    ingredientes: [
      { item: 'Batata', unid: 'kg', porPessoa: 0.06 },
      { item: 'Cenoura', unid: 'kg', porPessoa: 0.03 },
      { item: 'Maionese', unid: 'kg', porPessoa: 0.03 },
      { item: 'Ovos', unid: 'bd', porPessoa: 0.01 },
    ],
  },

  /* ------------------------------ Sobremesas --------------------------- */
  {
    nome: 'Arroz doce',
    categoria: 'sobremesa',
    ingredientes: [
      { item: 'Arroz', unid: 'kg', porPessoa: 0.03 },
      { item: 'Leite', unid: 'lt', porPessoa: 0.05 },
      { item: 'Leite condensado', unid: 'bag', porPessoa: 0.02 },
      { item: 'Coco ralado', unid: 'pct', porPessoa: 0.005, opcional: true },
    ],
  },
  {
    nome: 'Salada de frutas',
    categoria: 'sobremesa',
    ingredientes: [
      { item: 'Abacaxi', unid: 'un', porPessoa: 0.03 },
      { item: 'Banana', unid: 'kg', porPessoa: 0.05 },
      { item: 'Melancia', unid: 'un', porPessoa: 0.02 },
    ],
  },
  {
    nome: 'Banana',
    categoria: 'sobremesa',
    ingredientes: [{ item: 'Banana', unid: 'kg', porPessoa: 0.12 }],
  },
];

/* ---------------------------------------------------------------------
   Índices e helpers de acesso
   --------------------------------------------------------------------- */
export const RECEITAS: Record<string, Receita> = Object.fromEntries(
  LISTA.map((r) => [norm(r.nome), r]),
);

/** Receita do prato (por nome), ou null. */
export function receitaDoPrato(prato: string | null | undefined): Receita | null {
  return RECEITAS[norm(prato)] ?? null;
}

/** Itens de compra de uma receita, escalados pelo nº de pessoas. */
export function itensDaReceita(prato: string, pessoas: number): ItemSugerido[] | null {
  const r = receitaDoPrato(prato);
  if (!r) return null;
  return r.ingredientes.map((ing) => ({
    item: ing.item,
    unid: ing.unid,
    qtd: ing.porPessoa * Math.max(pessoas, 0),
  }));
}

/** Nomes de pratos com receita, agrupados por categoria (para os seletores). */
export const RECEITAS_POR_CATEGORIA: Record<CategoriaReceita, string[]> = {
  principal: LISTA.filter((r) => r.categoria === 'principal').map((r) => r.nome),
  guarnicao: LISTA.filter((r) => r.categoria === 'guarnicao').map((r) => r.nome),
  salada: LISTA.filter((r) => r.categoria === 'salada').map((r) => r.nome),
  sobremesa: LISTA.filter((r) => r.categoria === 'sobremesa').map((r) => r.nome),
};
