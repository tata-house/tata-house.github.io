'use client';

/* =====================================================================
   Login por perfil (controle de acesso). Três perfis: Gerência (completo),
   Compras (cotação/compras/estoque/preços/inventário) e Cozinha/Conferência
   (operacional). Cada perfil mapeia para um papel (matriz de permissões em
   org.ts) e para o conjunto de abas visíveis.

   Observação: é um portão simples por PIN (suficiente para uso interno).
   Autenticação real (Supabase Auth) fica para a fase de banco de dados.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';
import type { Papel } from './tipos';

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

export type PerfilLogin = 'gerencia' | 'compras' | 'cozinha';
export type AbaId = 'painel' | 'cotacao' | 'cardapio' | 'chefIA' | 'compras' | 'feedback' | 'gerencial';

export interface DefPerfil {
  id: PerfilLogin;
  rotulo: string;
  descricao: string;
  icone: string;
  papel: Papel;
  abas: AbaId[];
  pinPadrao: string;
}

export const PERFIS: DefPerfil[] = [
  {
    id: 'gerencia',
    rotulo: 'Gerência',
    descricao: 'Acesso completo: painel, cardápio, custos, compras e configurações',
    icone: '👑',
    papel: 'administrador',
    abas: ['painel', 'cotacao', 'cardapio', 'chefIA', 'compras', 'feedback', 'gerencial'],
    pinPadrao: '1234',
  },
  {
    id: 'compras',
    rotulo: 'Compras',
    descricao: 'Cotação, lista de compras, estoque, preços, nota fiscal e inventário',
    icone: '🛒',
    papel: 'compras',
    abas: ['cotacao', 'compras'],
    pinPadrao: '1111',
  },
  {
    id: 'cozinha',
    rotulo: 'Cozinha / Conferência',
    descricao: 'Cardápio, conferência, recebimento, inventário e feedback',
    icone: '👩‍🍳',
    papel: 'cozinha',
    abas: ['cardapio', 'chefIA', 'compras', 'feedback'],
    pinPadrao: '2222',
  },
];

export function perfilDe(id: PerfilLogin | null): DefPerfil | null {
  return PERFIS.find((p) => p.id === id) ?? null;
}

/** Abas visíveis para um papel (navegação muda conforme o login). */
export function abasDoPapel(papel: Papel): AbaId[] {
  const mapa: Record<Papel, AbaId[]> = {
    administrador: ['painel', 'cotacao', 'cardapio', 'chefIA', 'compras', 'feedback', 'gerencial'],
    gestor: ['painel', 'cotacao', 'cardapio', 'chefIA', 'compras', 'feedback', 'gerencial'],
    compras: ['cotacao', 'compras'],
    cozinha: ['cardapio', 'chefIA', 'compras', 'feedback'],
    recebimento: ['compras'],
  };
  return mapa[papel] ?? ['painel'];
}

function pinsAtuais(): Record<string, string> {
  const base: Record<string, string> = {};
  PERFIS.forEach((p) => (base[p.id] = p.pinPadrao));
  return { ...base, ...ler<Record<string, string>>('login.pins', {}) };
}

export function useLogin() {
  const [perfilId, setPerfilId] = useState<PerfilLogin | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setPerfilId(ler<PerfilLogin | null>('login.perfil', null));
    setPronto(true);
  }, []);

  const entrar = useCallback((id: PerfilLogin, pin: string): boolean => {
    if (pin !== pinsAtuais()[id]) return false;
    const perfil = perfilDe(id);
    if (!perfil) return false;
    gravar('login.perfil', id);
    gravar('papel', perfil.papel); // alimenta o pode() já existente
    setPerfilId(id);
    return true;
  }, []);

  const sair = useCallback(() => {
    gravar('login.perfil', null);
    setPerfilId(null);
  }, []);

  const definirPin = useCallback((id: PerfilLogin, pin: string) => {
    const novo = { ...ler<Record<string, string>>('login.pins', {}), [id]: pin };
    gravar('login.pins', novo);
  }, []);

  return { perfilId, perfil: perfilDe(perfilId), pronto, entrar, sair, definirPin };
}
