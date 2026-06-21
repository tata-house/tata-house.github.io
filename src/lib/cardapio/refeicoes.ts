'use client';

/**
 * Contador de refeições — histórico pré-carregado do WhatsApp (set/2023–jun/2026)
 * mais entradas novas registradas no app e salvas em localStorage.
 * Formato: date ISO -> [almoco, jantar, total]
 */

import HISTORICO from './historico-refeicoes.json';

type Raw = Record<string, [number, number, number]>;

const CHAVE = 'cardapio.v1.refeicoes';

function getLocal(): Raw {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}'); } catch { return {}; }
}

function getDados(): Raw {
  return { ...(HISTORICO as unknown as Raw), ...getLocal() };
}

export function hojeISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function registrarDia(data: string, almoco: number, jantar: number): void {
  const local = getLocal();
  local[data] = [almoco, jantar, almoco + jantar];
  try { localStorage.setItem(CHAVE, JSON.stringify(local)); } catch { /* ok */ }
}

export interface DiaRefeicoes {
  almoco: number;
  jantar: number;
  total: number;
}

export interface StatsRefeicoes {
  hoje: DiaRefeicoes | null;
  semana: number;         // segunda a hoje
  anoAtual: number;
  anoPassado: number;
  totalHistorico: number;
  diasRegistrados: number;
}

export interface MesTendencia {
  mes: string;   // "Jan", "Fev" …
  total: number;
}

export function calcularTendenciaMensal(): MesTendencia[] {
  const dados = getDados();
  const agora = new Date();
  const meses: MesTendencia[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const prefixo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const NOMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    let total = 0;
    for (const [key, val] of Object.entries(dados as Raw)) {
      if (key.startsWith(prefixo)) total += val[2];
    }
    meses.push({ mes: NOMES[d.getMonth()], total });
  }

  return meses;
}

export function calcularStats(): StatsRefeicoes {
  const dados = getDados();
  const hoje = hojeISO();
  const anoAtual = hoje.slice(0, 4);
  const anoPassado = String(Number(anoAtual) - 1);

  // Início da semana (segunda-feira)
  const now = new Date();
  const dow = now.getDay(); // 0=Dom
  const diff = dow === 0 ? 6 : dow - 1;
  const seg = new Date(now);
  seg.setDate(now.getDate() - diff);
  const inicioSemana = seg.toISOString().split('T')[0];

  let semana = 0, anoA = 0, anoP = 0, total = 0, dias = 0;

  for (const [key, val] of Object.entries(dados as Raw)) {
    const t = val[2];
    if (t <= 0) continue;
    dias++;
    total += t;
    if (key.startsWith(anoAtual)) anoA += t;
    if (key.startsWith(anoPassado)) anoP += t;
    if (key >= inicioSemana && key <= hoje) semana += t;
  }

  const h = (dados as Raw)[hoje];
  return {
    hoje: h ? { almoco: h[0], jantar: h[1], total: h[2] } : null,
    semana,
    anoAtual: anoA,
    anoPassado: anoP,
    totalHistorico: total,
    diasRegistrados: dias,
  };
}
