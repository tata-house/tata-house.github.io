'use client';

/* =====================================================================
   Estado do Cardápio da equipe — persistido em localStorage (protótipo).
   Cada semana é um documento independente; preços são globais.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { linhasDoDia, PESSOAS_PADRAO } from './motor';
import type { EstadoSemana, Papel } from './tipos';

const PREFIXO = 'cardapio.v1.';

export function semanaVazia(): EstadoSemana {
  return {
    versao: 1,
    orcamento: null,
    dias: PESSOAS_PADRAO.map((pessoas) => ({
      pessoas,
      principal: '',
      guarnicaoFixa: 'Arroz e Feijão',
      guarnicao: '',
      salada: '',
      sobremesa: '',
    })),
    etapa: 'rascunho',
    historico: [],
    ajustes: {},
    manuais: {},
    status: {},
    obsCozinha: '',
  };
}

function lerLocal<T>(chave: string, padrao: T): T {
  if (typeof window === 'undefined') return padrao;
  try {
    const raw = localStorage.getItem(PREFIXO + chave);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravarLocal(chave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* armazenamento cheio/indisponível: protótipo segue em memória */
  }
}

/** Identificadores das semanas operáveis (mês corrente + próximas). */
export function rotuloSemana(id: string): string {
  const [ano, sem] = id.split('-S');
  return `Semana ${sem} · ${ano}`;
}

export function idsSemanas(): string[] {
  const hoje = new Date();
  const ids: string[] = [];
  // 6 semanas: a atual, 1 anterior e 4 à frente (ISO week)
  for (let off = -1; off <= 4; off++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + off * 7);
    ids.push(idSemanaIso(d));
  }
  return ids;
}

/** Datas (segunda → domingo) da semana ISO "2026-S24". */
export function datasDaSemana(id: string): Date[] {
  const [anoS, semS] = id.split('-S');
  const ano = Number(anoS);
  const sem = Number(semS);
  // 4 de janeiro está sempre na semana ISO 1
  const jan4 = new Date(Date.UTC(ano, 0, 4));
  const diaSem = jan4.getUTCDay() || 7;
  const segunda = new Date(jan4);
  segunda.setUTCDate(jan4.getUTCDate() - diaSem + 1 + (sem - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda);
    d.setUTCDate(segunda.getUTCDate() + i);
    return d;
  });
}

export function idSemanaIso(data: Date): string {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(semana).padStart(2, '0')}`;
}

export function useSemana(semanaId: string) {
  const [estado, setEstado] = useState<EstadoSemana>(semanaVazia);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setEstado(lerLocal('semana.' + semanaId, semanaVazia()));
    setPronto(true);
  }, [semanaId]);

  const atualizar = useCallback(
    (fn: (atual: EstadoSemana) => EstadoSemana) => {
      setEstado((atual) => {
        const novo = fn(atual);
        gravarLocal('semana.' + semanaId, novo);
        return novo;
      });
    },
    [semanaId],
  );

  return { estado, atualizar, pronto };
}

export function usePrecos() {
  const [precos, setPrecos] = useState<Record<string, number>>({});

  useEffect(() => {
    setPrecos(lerLocal('precos', {}));
  }, []);

  const definirPreco = useCallback((itemNorm: string, valor: number | null) => {
    setPrecos((atual) => {
      const novo = { ...atual };
      if (valor === null || Number.isNaN(valor) || valor <= 0) delete novo[itemNorm];
      else novo[itemNorm] = valor;
      gravarLocal('precos', novo);
      return novo;
    });
  }, []);

  return { precos, definirPreco };
}

/* ------------------- itens novos vindos da cotação -------------------- */

export interface ItemExtra {
  n: string; // nome como veio da cotação
  u: string; // unidade de compra
}

/**
 * Itens que não existiam no histórico e foram cadastrados direto da
 * cotação — a cotação é a guia: tudo que chega cotado pode virar item.
 */
export function useItensExtras() {
  const [itensExtras, setItensExtras] = useState<Record<string, ItemExtra>>({});

  useEffect(() => {
    setItensExtras(lerLocal('itensExtras', {}));
  }, []);

  const cadastrarItem = useCallback((norm: string, nome: string, unid: string) => {
    setItensExtras((atual) => {
      const novo = { ...atual, [norm]: { n: nome, u: unid } };
      gravarLocal('itensExtras', novo);
      return novo;
    });
  }, []);

  return { itensExtras, cadastrarItem };
}

/** Fornecedor/marca mais barato por item (vem da cotação aplicada). */
export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Record<string, string>>({});

  useEffect(() => {
    setFornecedores(lerLocal('fornecedores', {}));
  }, []);

  const definirFornecedor = useCallback((itemNorm: string, marca: string | null) => {
    setFornecedores((atual) => {
      const novo = { ...atual };
      if (!marca) delete novo[itemNorm];
      else novo[itemNorm] = marca;
      gravarLocal('fornecedores', novo);
      return novo;
    });
  }, []);

  return { fornecedores, definirFornecedor };
}

/* ------------------- aprendizado de quantidades ----------------------- */

interface RegistroAprendizado {
  f: number; // fator médio (ajustado / sugerido)
  n: number; // nº de observações (teto p/ continuar adaptando)
}

const TETO_OBSERVACOES = 8;

/**
 * O app aprende com a operação: toda vez que uma semana é concluída, os
 * ajustes de quantidade feitos pela cozinha viram um fator por item que
 * corrige as próximas sugestões (média móvel, limitada a ±50%).
 */
export function useAprendizado() {
  const [registros, setRegistros] = useState<Record<string, RegistroAprendizado>>({});

  useEffect(() => {
    setRegistros(lerLocal('aprendizado', {}));
  }, []);

  // fatores prontos para usar na lista (limitados para nunca distorcer demais)
  const fatores: Record<string, number> = {};
  for (const [k, r] of Object.entries(registros)) {
    fatores[k] = Math.min(1.5, Math.max(0.5, r.f));
  }

  const aprenderDeSemana = useCallback((estado: EstadoSemana) => {
    setRegistros((atual) => {
      const novo = { ...atual };
      estado.dias.forEach((_, di) => {
        // compara com a sugestão BASE (sem fatores) para o aprendizado não compor
        for (const l of linhasDoDia(estado, di)) {
          if (l.manual || l.sugerida === null || l.sugerida <= 0) continue;
          if (l.qtd === l.sugerida || l.qtd <= 0) continue;
          const razao = Math.min(3, Math.max(0.3, l.qtd / l.sugerida));
          const r = novo[l.chave] ?? { f: 1, n: 0 };
          const n = Math.min(r.n, TETO_OBSERVACOES);
          novo[l.chave] = { f: (r.f * n + razao) / (n + 1), n: r.n + 1 };
        }
      });
      gravarLocal('aprendizado', novo);
      return novo;
    });
  }, []);

  return { fatores, aprenderDeSemana, totalAprendido: Object.keys(registros).length };
}

export function usePapel() {
  const [papel, setPapelEstado] = useState<Papel>('gestor');

  useEffect(() => {
    setPapelEstado(lerLocal<Papel>('papel', 'gestor'));
  }, []);

  const setPapel = useCallback((p: Papel) => {
    setPapelEstado(p);
    gravarLocal('papel', p);
  }, []);

  return { papel, setPapel };
}
