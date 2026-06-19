/* =====================================================================
   DNA alimentar da empresa — o "paladar" do Tatá House aprendido com a
   operação real. Cruza três fontes:
     • histórico de cardápios  → o que a casa serve e com que frequência
     • índice de aceitação     → o que a equipe gosta (notas 1–5)
     • controle de desperdício → o que sobra no prato

   Tudo determinístico (sem IA). O resultado alimenta o dossiê e guia as
   sugestões: priorizar campeões, evitar problemas, equilibrar proteínas.
   ===================================================================== */

import { normalizar, proteinaDoPrato, ROTULO_PROTEINA } from './motor';
import type {
  Aceitacao,
  EstadoSemana,
  Proteina,
  RegistroDesperdicio,
} from './tipos';

export interface PerfilProteina {
  proteina: Proteina;
  rotulo: string;
  freq: number; // nº de vezes que apareceu como principal no histórico
  pct: number; // % das aparições
  notaMedia: number | null; // aceitação média dos pratos dessa proteína
}

export interface PratoDna {
  prato: string;
  proteina: Proteina;
  nota: number | null; // média de aceitação (1–5)
  avaliacoes: number;
  frequencia: number; // vezes servido no histórico
  desperdicio: number | null; // taxa média de sobra (0–1)
  score: number; // índice combinado (-1 a +1)
}

export interface DnaAlimentar {
  perfilProteinas: PerfilProteina[];
  campeoes: PratoDna[]; // alta aceitação + baixo desperdício
  problemas: PratoDna[]; // baixa aceitação ou alto desperdício
  resumo: string; // frase pronta para o gestor / LLM
  baseSemanas: number;
  baseAvaliacoes: number;
  geradoEm: string;
}

/* ------------------------------------------------------------------ */

function notaDe(aceitacao: Aceitacao, prato: string): { nota: number | null; n: number } {
  const r = aceitacao[normalizar(prato)];
  if (!r || r.n === 0) return { nota: null, n: 0 };
  return { nota: Math.round((r.somaNotas / r.n) * 10) / 10, n: r.n };
}

/**
 * Score combinado de um prato: aceitação acima da média (centrada em 3)
 * menos a penalidade de desperdício. Faixa aproximada -1…+1.
 */
function scorePrato(nota: number | null, desperdicio: number | null): number {
  const aceit = nota === null ? 0 : (nota - 3) / 2; // 1→-1, 3→0, 5→+1
  const sobra = desperdicio === null ? 0 : -desperdicio; // 0…-1
  return Math.round((aceit + sobra) * 100) / 100;
}

export function calcularDna(
  semanas: { semanaId: string; estado: EstadoSemana }[],
  aceitacao: Aceitacao,
  desperdicio: RegistroDesperdicio[],
): DnaAlimentar {
  // --- frequência de pratos e proteínas no histórico de cardápios ---
  const freqPrato = new Map<string, { prato: string; proteina: Proteina; freq: number }>();
  const freqProteina = new Map<Proteina, number>();
  let totalPrincipais = 0;

  semanas.forEach(({ estado }) => {
    estado.dias.forEach((d) => {
      if (!d.principal) return;
      totalPrincipais++;
      const k = normalizar(d.principal);
      const prot = proteinaDoPrato(d.principal);
      const prev = freqPrato.get(k) ?? { prato: d.principal, proteina: prot, freq: 0 };
      freqPrato.set(k, { ...prev, freq: prev.freq + 1 });
      freqProteina.set(prot, (freqProteina.get(prot) ?? 0) + 1);
    });
  });

  // --- desperdício médio por prato ---
  const despMap = new Map<string, { total: number; n: number }>();
  desperdicio.forEach((r) => {
    if (!(r.produzido > 0)) return;
    const k = normalizar(r.prato);
    const taxa = Math.max(0, r.produzido - r.consumido) / r.produzido;
    const prev = despMap.get(k) ?? { total: 0, n: 0 };
    despMap.set(k, { total: prev.total + taxa, n: prev.n + 1 });
  });
  const desperdicioDe = (norm: string): number | null => {
    const d = despMap.get(norm);
    return d ? Math.round((d.total / d.n) * 100) / 100 : null;
  };

  // --- monta a lista completa de pratos com todos os sinais ---
  const pratos: PratoDna[] = Array.from(freqPrato.entries()).map(([k, v]) => {
    const { nota, n } = notaDe(aceitacao, v.prato);
    const desp = desperdicioDe(k);
    return {
      prato: v.prato,
      proteina: v.proteina,
      nota,
      avaliacoes: n,
      frequencia: v.freq,
      desperdicio: desp,
      score: scorePrato(nota, desp),
    };
  });

  // --- perfil de proteínas (frequência + aceitação média ponderada) ---
  const perfilProteinas: PerfilProteina[] = Array.from(freqProteina.entries())
    .map(([proteina, freq]) => {
      const dessaProt = pratos.filter((p) => p.proteina === proteina && p.nota !== null);
      const somaNotas = dessaProt.reduce((a, p) => a + (p.nota ?? 0) * p.avaliacoes, 0);
      const somaN = dessaProt.reduce((a, p) => a + p.avaliacoes, 0);
      return {
        proteina,
        rotulo: ROTULO_PROTEINA[proteina],
        freq,
        pct: totalPrincipais > 0 ? Math.round((freq / totalPrincipais) * 100) : 0,
        notaMedia: somaN > 0 ? Math.round((somaNotas / somaN) * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.freq - a.freq);

  // --- campeões: nota ≥ 4 (ou score alto) e desperdício baixo ---
  const campeoes = pratos
    .filter((p) => (p.nota !== null && p.nota >= 4) || (p.score >= 0.4 && p.avaliacoes >= 2))
    .filter((p) => p.desperdicio === null || p.desperdicio <= 0.1)
    .sort((a, b) => b.score - a.score || b.frequencia - a.frequencia)
    .slice(0, 6);

  // --- problemas: nota baixa OU muito desperdício ---
  const problemas = pratos
    .filter((p) => (p.nota !== null && p.nota < 3) || (p.desperdicio !== null && p.desperdicio >= 0.2))
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);

  // --- resumo em linguagem natural ---
  const baseAvaliacoes = Object.values(aceitacao).reduce((a, r) => a + r.n, 0);
  const resumo = montarResumo(perfilProteinas, campeoes, problemas, semanas.length, baseAvaliacoes);

  return {
    perfilProteinas,
    campeoes,
    problemas,
    resumo,
    baseSemanas: semanas.length,
    baseAvaliacoes,
    geradoEm: new Date().toISOString(),
  };
}

function montarResumo(
  proteinas: PerfilProteina[],
  campeoes: PratoDna[],
  problemas: PratoDna[],
  semanas: number,
  avaliacoes: number,
): string {
  if (semanas === 0) return 'Sem histórico de cardápios suficiente para traçar o perfil da casa.';
  const partes: string[] = [];

  const prefer = proteinas.filter((p) => p.proteina !== 'outros').slice(0, 2);
  if (prefer.length) {
    partes.push(
      `A casa serve mais ${prefer.map((p) => `${p.rotulo.toLowerCase()} (${p.pct}%)`).join(' e ')}.`,
    );
  }

  const melhorProt = proteinas
    .filter((p) => p.notaMedia !== null && p.proteina !== 'outros')
    .sort((a, b) => (b.notaMedia ?? 0) - (a.notaMedia ?? 0))[0];
  if (melhorProt) partes.push(`Melhor aceitação: ${melhorProt.rotulo.toLowerCase()} (nota ${melhorProt.notaMedia}).`);

  if (campeoes.length) partes.push(`Pratos campeões: ${campeoes.slice(0, 3).map((c) => c.prato).join(', ')}.`);
  if (problemas.length) partes.push(`Atenção com: ${problemas.slice(0, 2).map((p) => p.prato).join(', ')}.`);

  if (avaliacoes < 10) partes.push('(Perfil ainda em formação — quanto mais avaliações, mais preciso.)');

  return partes.join(' ');
}
