'use client';

/* =====================================================================
   Inventário mensal — contagem física do estoque por mês, com comparação
   esperado × contado, divergências e histórico. Persiste em localStorage
   (chave `inventarios`), espelhado na nuvem pelo motor de sincronização.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';

const PREFIXO = 'cardapio.v1.';

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
    /* armazenamento indisponível */
  }
}

export interface ItemInventario {
  item: string;
  unid: string;
  esperado: number; // saldo do estoque no momento da contagem
  contado: number | null; // quantidade física encontrada
  obs?: string;
}

export interface Inventario {
  mes: string; // 'YYYY-MM'
  itens: Record<string, ItemInventario>; // por item normalizado
  status: 'rascunho' | 'finalizado';
  criadoEm: string;
  atualizadoEm: string;
  finalizadoEm?: string;
  papel?: string;
}

export type MapaInventarios = Record<string, Inventario>;

/** Mês de referência atual no formato YYYY-MM. */
export function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Rótulo amigável do mês (ex.: "junho de 2026"). */
export function rotuloMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  if (!a || !m) return mes;
  return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/** Divergência (contado − esperado). null se ainda não contado. */
export function divergencia(it: ItemInventario): number | null {
  return it.contado === null ? null : it.contado - it.esperado;
}

/** Divergência considerada "grande" (≥20% do esperado, ou item zerado contado). */
export function divergenciaGrande(it: ItemInventario): boolean {
  const d = divergencia(it);
  if (d === null || d === 0) return false;
  if (it.esperado <= 0) return it.contado! > 0;
  return Math.abs(d) / it.esperado >= 0.2;
}

export function useInventarios() {
  const [inventarios, setInventarios] = useState<MapaInventarios>({});

  useEffect(() => {
    setInventarios(ler<MapaInventarios>('inventarios', {}));
  }, []);

  const salvar = useCallback((inv: Inventario) => {
    setInventarios((atual) => {
      const novo = { ...atual, [inv.mes]: inv };
      gravar('inventarios', novo);
      return novo;
    });
  }, []);

  return { inventarios, salvar };
}
