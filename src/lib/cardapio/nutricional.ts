/* =====================================================================
   Análise nutricional estimada dos pratos do cardápio.
   Valores por porção de almoço (≈ 300–400 g de prato principal).
   Fonte: TACO (Tabela Brasileira de Composição de Alimentos) + estimativas.
   ===================================================================== */

import { normalizar } from './motor';
import { receitaDoPrato } from './receitas';
import type { DiaCardapio } from './tipos';

/** Índice de saúde (0–100) a partir dos macros por porção. */
function saudavelDeMacros(n: {
  kcal: number;
  prot: number;
  carb: number;
  gord: number;
  fibra: number;
  sodio: number;
}): number {
  let s = 100;
  if (n.kcal > 520) s -= 14;
  else if (n.kcal > 460) s -= 8;
  else if (n.kcal < 230) s -= 4;
  if (n.sodio > 850) s -= 20;
  else if (n.sodio > 650) s -= 10;
  if (n.gord > 28) s -= 14;
  else if (n.gord > 20) s -= 6;
  if (n.prot >= 30) s += 6;
  else if (n.prot < 12) s -= 8;
  if (n.fibra >= 5) s += 6;
  return Math.max(20, Math.min(100, s));
}

export interface InfoNutricional {
  prato: string;
  porcao: string;
  kcal: number;
  proteinas: number; // g
  carboidratos: number; // g
  gorduras: number; // g
  fibras: number; // g
  sodio: number; // mg
  indiceSaudavel: number; // 0–100
}

/* Tabela estimada por prato — chave = normalizado */
const TABELA: Record<string, Omit<InfoNutricional, 'prato'>> = {
  'frango grelhado': { porcao: '200g', kcal: 290, proteinas: 38, carboidratos: 0, gorduras: 8, fibras: 0, sodio: 320, indiceSaudavel: 92 },
  'frango assado': { porcao: '200g', kcal: 310, proteinas: 36, carboidratos: 2, gorduras: 12, fibras: 0, sodio: 380, indiceSaudavel: 88 },
  'frango ao molho': { porcao: '200g + molho', kcal: 370, proteinas: 32, carboidratos: 10, gorduras: 18, fibras: 1, sodio: 580, indiceSaudavel: 72 },
  'coxa e sobrecoxa assada': { porcao: '220g', kcal: 360, proteinas: 34, carboidratos: 1, gorduras: 20, fibras: 0, sodio: 420, indiceSaudavel: 76 },
  'coxa de frango assada': { porcao: '200g', kcal: 340, proteinas: 33, carboidratos: 1, gorduras: 18, fibras: 0, sodio: 400, indiceSaudavel: 78 },
  'frango xadrez': { porcao: '250g', kcal: 380, proteinas: 30, carboidratos: 18, gorduras: 16, fibras: 3, sodio: 680, indiceSaudavel: 68 },
  'frango ao curry': { porcao: '220g', kcal: 360, proteinas: 32, carboidratos: 8, gorduras: 18, fibras: 2, sodio: 520, indiceSaudavel: 74 },
  'strogonoff de frango': { porcao: '250g', kcal: 420, proteinas: 28, carboidratos: 14, gorduras: 26, fibras: 1, sodio: 740, indiceSaudavel: 58 },
  'estrogonofe de frango': { porcao: '250g', kcal: 420, proteinas: 28, carboidratos: 14, gorduras: 26, fibras: 1, sodio: 740, indiceSaudavel: 58 },
  'file de frango grelhado': { porcao: '200g', kcal: 275, proteinas: 40, carboidratos: 0, gorduras: 7, fibras: 0, sodio: 280, indiceSaudavel: 94 },
  'bife acebolado': { porcao: '180g', kcal: 350, proteinas: 30, carboidratos: 4, gorduras: 20, fibras: 1, sodio: 440, indiceSaudavel: 65 },
  'bife grelhado': { porcao: '180g', kcal: 310, proteinas: 32, carboidratos: 0, gorduras: 18, fibras: 0, sodio: 380, indiceSaudavel: 70 },
  'picadinho de carne': { porcao: '200g', kcal: 380, proteinas: 28, carboidratos: 8, gorduras: 22, fibras: 2, sodio: 620, indiceSaudavel: 62 },
  'acem refogado': { porcao: '200g', kcal: 370, proteinas: 26, carboidratos: 6, gorduras: 24, fibras: 1, sodio: 580, indiceSaudavel: 60 },
  'almôndegas ao molho': { porcao: '250g', kcal: 440, proteinas: 26, carboidratos: 16, gorduras: 28, fibras: 2, sodio: 820, indiceSaudavel: 52 },
  'almondega ao molho': { porcao: '250g', kcal: 440, proteinas: 26, carboidratos: 16, gorduras: 28, fibras: 2, sodio: 820, indiceSaudavel: 52 },
  'strogonoff de carne': { porcao: '250g', kcal: 460, proteinas: 26, carboidratos: 14, gorduras: 30, fibras: 1, sodio: 760, indiceSaudavel: 50 },
  'estrogonofe de carne': { porcao: '250g', kcal: 460, proteinas: 26, carboidratos: 14, gorduras: 30, fibras: 1, sodio: 760, indiceSaudavel: 50 },
  'escondidinho de carne': { porcao: '300g', kcal: 490, proteinas: 24, carboidratos: 36, gorduras: 26, fibras: 3, sodio: 680, indiceSaudavel: 55 },
  'carne moida refogada': { porcao: '200g', kcal: 350, proteinas: 28, carboidratos: 6, gorduras: 22, fibras: 1, sodio: 520, indiceSaudavel: 62 },
  'lasanha de carne': { porcao: '300g', kcal: 520, proteinas: 26, carboidratos: 46, gorduras: 24, fibras: 3, sodio: 900, indiceSaudavel: 45 },
  'bisteca assada': { porcao: '200g', kcal: 390, proteinas: 30, carboidratos: 0, gorduras: 24, fibras: 0, sodio: 460, indiceSaudavel: 62 },
  'costelinha de porco': { porcao: '220g', kcal: 430, proteinas: 26, carboidratos: 0, gorduras: 32, fibras: 0, sodio: 520, indiceSaudavel: 50 },
  'lombo assado': { porcao: '200g', kcal: 360, proteinas: 32, carboidratos: 2, gorduras: 22, fibras: 0, sodio: 480, indiceSaudavel: 65 },
  'feijoada': { porcao: '350g', kcal: 540, proteinas: 30, carboidratos: 40, gorduras: 24, fibras: 10, sodio: 1100, indiceSaudavel: 48 },
  'tilapia grelhada': { porcao: '200g', kcal: 240, proteinas: 36, carboidratos: 0, gorduras: 8, fibras: 0, sodio: 280, indiceSaudavel: 96 },
  'tilapia assada': { porcao: '200g', kcal: 255, proteinas: 34, carboidratos: 2, gorduras: 10, fibras: 0, sodio: 300, indiceSaudavel: 93 },
  'peixe grelhado': { porcao: '200g', kcal: 240, proteinas: 36, carboidratos: 0, gorduras: 8, fibras: 0, sodio: 280, indiceSaudavel: 96 },
  'merluza grelhada': { porcao: '200g', kcal: 220, proteinas: 34, carboidratos: 0, gorduras: 6, fibras: 0, sodio: 260, indiceSaudavel: 97 },
  'omelete': { porcao: '150g', kcal: 210, proteinas: 14, carboidratos: 2, gorduras: 16, fibras: 0, sodio: 340, indiceSaudavel: 60 },
  'ovos mexidos': { porcao: '150g', kcal: 220, proteinas: 13, carboidratos: 2, gorduras: 17, fibras: 0, sodio: 360, indiceSaudavel: 58 },
  'yakisoba de frango': { porcao: '280g', kcal: 420, proteinas: 24, carboidratos: 48, gorduras: 14, fibras: 4, sodio: 860, indiceSaudavel: 60 },
  'yakisoba de carne': { porcao: '280g', kcal: 440, proteinas: 22, carboidratos: 50, gorduras: 16, fibras: 4, sodio: 920, indiceSaudavel: 56 },
  'macarrao ao molho': { porcao: '300g', kcal: 480, proteinas: 18, carboidratos: 68, gorduras: 14, fibras: 3, sodio: 640, indiceSaudavel: 52 },
  'panquecas': { porcao: '250g', kcal: 380, proteinas: 16, carboidratos: 42, gorduras: 16, fibras: 2, sodio: 480, indiceSaudavel: 55 },
};

export function infoNutricional(prato: string | null | undefined): InfoNutricional | null {
  if (!prato) return null;

  // Fonte primária: a nutrição embutida na receita (biblioteca enriquecida).
  const r = receitaDoPrato(prato);
  if (r?.nutricao) {
    const nu = r.nutricao;
    return {
      prato,
      porcao: r.rendimentoPorcaoG ? `${r.rendimentoPorcaoG}g` : '—',
      kcal: nu.kcal,
      proteinas: nu.prot,
      carboidratos: nu.carb,
      gorduras: nu.gord,
      fibras: nu.fibra,
      sodio: nu.sodio,
      indiceSaudavel: saudavelDeMacros(nu),
    };
  }

  const n = normalizar(prato);
  // busca exata (tabela legada, para pratos sem receita)
  const exato = TABELA[n];
  if (exato) return { prato, ...exato };
  // busca parcial (primeiro match)
  for (const [chave, dados] of Object.entries(TABELA)) {
    if (n.includes(chave) || chave.includes(n.split(' ')[0])) {
      return { prato, ...dados };
    }
  }
  return null;
}

/* Índice Nutricional da semana (0–100) */
export function indiceNutricionalSemana(dias: DiaCardapio[]): {
  score: number;
  rotulo: string;
  cor: string;
  detalhes: string[];
} {
  const pratos = dias.filter((d) => d.principal).map((d) => infoNutricional(d.principal)).filter(Boolean) as InfoNutricional[];

  if (pratos.length === 0) return { score: 0, rotulo: 'Sem dados', cor: 'carvao', detalhes: [] };

  const detalhes: string[] = [];
  let score = 100;

  const mediaKcal = pratos.reduce((a, p) => a + p.kcal, 0) / pratos.length;
  if (mediaKcal > 480) { score -= 10; detalhes.push('Calorias acima do ideal (>480 kcal/prato)'); }
  else if (mediaKcal < 250) { score -= 5; detalhes.push('Calorias abaixo do ideal (<250 kcal/prato)'); }

  const mediaSodio = pratos.reduce((a, p) => a + p.sodio, 0) / pratos.length;
  if (mediaSodio > 700) { score -= 15; detalhes.push('Sódio elevado (>700 mg/prato)'); }
  else if (mediaSodio > 500) { score -= 8; detalhes.push('Sódio moderadamente alto'); }

  const mediaGordura = pratos.reduce((a, p) => a + p.gorduras, 0) / pratos.length;
  if (mediaGordura > 26) { score -= 12; detalhes.push('Gordura total elevada (>26 g/prato)'); }

  const mediaProteina = pratos.reduce((a, p) => a + p.proteinas, 0) / pratos.length;
  if (mediaProteina < 20) { score -= 10; detalhes.push('Proteína baixa (<20 g/prato)'); }
  else if (mediaProteina >= 30) { score += 5; detalhes.push('Boa densidade proteica (≥30 g/prato)'); }

  // variedade (índices individuais)
  const mediaIndividual = pratos.reduce((a, p) => a + p.indiceSaudavel, 0) / pratos.length;
  score = Math.round((score + mediaIndividual) / 2);
  score = Math.max(0, Math.min(100, score));

  const rotulo = score >= 80 ? 'Saudável' : score >= 60 ? 'Equilibrado' : 'Necessita ajustes';
  const cor = score >= 80 ? 'brand' : score >= 60 ? 'ouro' : 'vermelho';

  return { score, rotulo, cor, detalhes };
}
