/* =====================================================================
   Módulo 10 — Organização e permissões (multi-tenant).
   No protótipo roda com um tenant local; a matriz de permissões já vale
   para a futura migração a Supabase (RLS por empresa/unidade/papel).
   ===================================================================== */

import type { Papel, Permissao } from './tipos';

export const PAPEIS: { id: Papel; rotulo: string; descricao: string }[] = [
  { id: 'gestor', rotulo: 'Gestor', descricao: 'Monta cardápio, aprova e acompanha indicadores' },
  { id: 'cozinha', rotulo: 'Cozinha', descricao: 'Revisa lista, conta refeições e registra produção' },
  { id: 'compras', rotulo: 'Compras', descricao: 'Recebe cotação e executa as compras' },
  { id: 'recebimento', rotulo: 'Recebimento', descricao: 'Confere a entrega e dá baixa no estoque' },
  { id: 'administrador', rotulo: 'Administrador', descricao: 'Acesso total, configurações e auditoria' },
];

export const ROTULO_PAPEL: Record<Papel, string> = {
  gestor: 'Gestor',
  cozinha: 'Cozinha',
  compras: 'Compras',
  recebimento: 'Recebimento',
  administrador: 'Administrador',
};

/** Matriz de permissões por papel (fonte única de verdade do acesso). */
const MATRIZ: Record<Papel, Permissao[]> = {
  administrador: [
    'cardapio:editar',
    'cardapio:aprovar',
    'compras:gerenciar',
    'recebimento:registrar',
    'estoque:gerenciar',
    'precos:editar',
    'auditoria:ver',
    'config:gerenciar',
  ],
  gestor: [
    'cardapio:editar',
    'cardapio:aprovar',
    'compras:gerenciar',
    'recebimento:registrar',
    'estoque:gerenciar',
    'precos:editar',
    'auditoria:ver',
  ],
  cozinha: ['cardapio:editar', 'estoque:gerenciar'],
  compras: ['compras:gerenciar', 'precos:editar', 'estoque:gerenciar'],
  recebimento: ['recebimento:registrar', 'estoque:gerenciar'],
};

export function pode(papel: Papel, permissao: Permissao): boolean {
  return MATRIZ[papel]?.includes(permissao) ?? false;
}
