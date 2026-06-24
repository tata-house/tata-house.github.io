'use client';

/* =====================================================================
   Camada leve para a página pública /avaliar (QR das mesas). Lê o cardápio
   do dia e registra o voto do cliente DIRETO no localStorage — sem importar
   o motor/estado completos. Assim a tela do QR carrega quase instantânea.

   A escrita espelha exatamente as estruturas do app (aceitação agregada,
   stream do termômetro e pesquisa de satisfação), então o gestor recebe o
   voto normalmente. O espelhamento para a nuvem é feito pelo BootNuvem, que
   intercepta o localStorage.setItem em qualquer página.
   ===================================================================== */

import { normalizar } from './texto';
import { registrarVotoDia } from './termometro';
import type { Aceitacao } from './tipos';
import type { RegistroSatisfacao } from './estado'; // só tipo — apagado no build

const PREFIXO = 'cardapio.v1.';
// Mesmo nome de evento emitido pelo estado/BootNuvem ao aplicar dado da nuvem.
const EVENTO_CHAVE = 'tata:chave-externa';

type Voto = 'bom' | 'ok' | 'ruim';

/** Assina mudanças externas (nuvem/outra aba) de uma chave do localStorage.
   Devolve a função de cancelamento. Permite que /avaliar mostre o cardápio
   assim que o BootNuvem traz a semana da nuvem, sem recarregar. */
export function assinarChaveExterna(chave: string, aoMudar: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onExterno = (e: Event) => {
    const det = (e as CustomEvent<{ chave?: string }>).detail;
    if (det?.chave === chave) aoMudar();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFIXO + chave) aoMudar();
  };
  window.addEventListener(EVENTO_CHAVE, onExterno);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENTO_CHAVE, onExterno);
    window.removeEventListener('storage', onStorage);
  };
}

function ler<T>(chave: string, padrao: T): T {
  if (typeof window === 'undefined') return padrao;
  try {
    const raw = localStorage.getItem(PREFIXO + chave);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* indisponível */
  }
}

/** ID da semana ISO (segunda→domingo) — cópia pura da do estado, sem deps. */
export function idSemanaIso(data: Date): string {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(semana).padStart(2, '0')}`;
}

export interface CardapioDoDia {
  principal: string;
  guarnicao: string;
  salada: string;
}

/** Lê os pratos do dia direto do documento da semana no localStorage. */
export function lerCardapioDoDia(semanaId: string, diaIdx: number): CardapioDoDia {
  const doc = ler<{ dias?: { principal?: string; guarnicao?: string; salada?: string }[] }>(
    'semana.' + semanaId,
    {},
  );
  const dia = doc.dias?.[diaIdx];
  return {
    principal: (dia?.principal ?? '').trim(),
    guarnicao: (dia?.guarnicao ?? '').trim(),
    salada: (dia?.salada ?? '').trim(),
  };
}

/** Registra um voto do cliente: aceitação agregada + termômetro + pesquisa.
   Espelha 1:1 a lógica de useAceitacao/registrarSatisfacao do estado. */
export function registrarVotoCliente(prato: string, voto: Voto, comentario?: string) {
  // 1) índice de aceitação agregado (chave = prato normalizado)
  const k = normalizar(prato);
  if (k) {
    const nota = voto === 'bom' ? 5 : voto === 'ok' ? 3 : 1;
    const aceitacao = ler<Aceitacao>('aceitacao', {});
    const prev = aceitacao[k] ?? { prato, bom: 0, ok: 0, ruim: 0, somaNotas: 0, n: 0, atualizadoEm: '' };
    aceitacao[k] = {
      prato,
      bom: prev.bom + (voto === 'bom' ? 1 : 0),
      ok: prev.ok + (voto === 'ok' ? 1 : 0),
      ruim: prev.ruim + (voto === 'ruim' ? 1 : 0),
      somaNotas: prev.somaNotas + nota,
      n: prev.n + 1,
      atualizadoEm: new Date().toISOString(),
    };
    gravar('aceitacao', aceitacao);
  }

  // 2) stream de votos do dia (termômetro de tendência)
  registrarVotoDia(prato, voto);

  // 3) pesquisa de satisfação detalhada (qualidade espelha os 3 eixos)
  const registro: RegistroSatisfacao = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    prato,
    qualidade: voto,
    variedade: voto,
    atendimento: voto,
    comentario: comentario?.trim() || undefined,
    em: new Date().toISOString(),
  };
  const lista = [registro, ...ler<RegistroSatisfacao[]>('satisfacao', [])].slice(0, 1000);
  gravar('satisfacao', lista);
}
