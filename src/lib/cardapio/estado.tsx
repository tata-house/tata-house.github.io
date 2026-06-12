'use client';

/* =====================================================================
   Estado do Cardápio da equipe — persistido em localStorage (protótipo).
   Cada semana é um documento independente; preços são globais.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { PESSOAS_PADRAO } from './motor';
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
