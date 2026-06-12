/* =====================================================================
   Cardápio da equipe (refeição dos funcionários) — tipos do módulo
   ===================================================================== */

export type Categoria = 'principal' | 'guarnicaoFixa' | 'guarnicao' | 'salada' | 'sobremesa';

export type Proteina = 'bovina' | 'frango' | 'suina' | 'peixe' | 'ovo' | 'outros';

export type Papel = 'gestor' | 'cozinha' | 'compras' | 'recebimento';

export type Etapa = 'rascunho' | 'cozinha' | 'compras' | 'recebimento' | 'concluido';

export interface DiaCardapio {
  pessoas: number;
  principal: string;
  guarnicaoFixa: string;
  guarnicao: string;
  salada: string;
  sobremesa: string;
}

/** Item sugerido pelo motor para a compra de um dia. */
export interface ItemSugerido {
  item: string;
  unid: string;
  /** Quantidade histórica (baseline de pessoas) já escalada para o dia. */
  qtd: number;
}

/** Ajuste manual feito por cima da sugestão (chave = item normalizado). */
export interface AjusteItem {
  qtd?: number;
  removido?: boolean;
}

/** Item digitado fora da lógica automática. */
export interface ItemManual {
  item: string;
  unid: string;
  qtd: number;
}

/** Andamento de um item dentro do fluxo de compra/recebimento. */
export interface StatusItem {
  compradoQtd?: number;
  compradoEm?: string; // data da compra (ISO yyyy-mm-dd)
  precoPago?: number; // R$ por unidade efetivamente cobrado (vs. cotado)
  previsao?: string; // previsão de entrega
  recebidoQtd?: number;
  recebidoOk?: boolean;
}

export interface RegistroEtapa {
  etapa: Etapa;
  em: string; // ISO datetime
  papel: Papel;
}

export interface EstadoSemana {
  versao: 1;
  orcamento: number | null;
  dias: DiaCardapio[]; // 7 posições, segunda a domingo
  etapa: Etapa;
  historico: RegistroEtapa[];
  /** ajustes[diaIdx][itemNormalizado] */
  ajustes: Record<number, Record<string, AjusteItem>>;
  /** manuais[diaIdx] */
  manuais: Record<number, ItemManual[]>;
  /** status[diaIdx][itemNormalizado] */
  status: Record<number, Record<string, StatusItem>>;
  obsCozinha: string;
  /** refeições servidas de fato em cada dia (contagem das meninas) */
  refeicoes?: Record<number, number>;
  /** foto da nota fiscal do dia (dataURL comprimida) */
  notas?: Record<number, string>;
}

export interface Aviso {
  nivel: 'ok' | 'alerta' | 'erro';
  msg: string;
}

/* ---- formato do dados.json (extraído da planilha histórica) ---- */

export interface DadosItem {
  n: string;
  u: string;
  f: number;
}

export interface DadosCombo {
  chave: string;
  p: string | null;
  gf: string | null;
  g: string | null;
  s: string | null;
  sb: string | null;
  occ: number;
  itens: { i: string; q: number; u: string | null }[];
}

export interface DadosMapa {
  tipo: 'principal' | 'guarnicao_fixa' | 'guarnicao' | 'salada' | 'sobremesa';
  op: string;
  itens: { i: string; q: number; u: string | null }[];
}

export interface DadosCardapio {
  baseline: number;
  itens: DadosItem[];
  combos: DadosCombo[];
  mapas: DadosMapa[];
  listas: {
    principais: string[];
    guarnicoesFixas: string[];
    guarnicoes: string[];
    saladas: string[];
    sobremesas: string[];
  };
  excluir: string[];
  unidades: string[];
}
