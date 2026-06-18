/* =====================================================================
   Preços reais extraídos das planilhas de compras de Maio e Junho/2026.
   Gerado por scripts/cardapio/importar-precos.py — NÃO editar manualmente.
   Serve como pré-preenchimento automático do sistema de cotação.
   ===================================================================== */

import dadosJson from './precos-compras.json';
import type { HistoricoPrecos } from './tipos';

interface ComparativoItem {
  item: string;
  maio?: number;
  junho?: number;
  variacao: number; // percentual; positivo = alta, negativo = queda
  unid: string;
}

interface DadosCompras {
  geradoEm: string;
  fontes: string[];
  precos: Record<string, number>;
  unidades: Record<string, string>;
  historico: Record<string, { data: string; valor: number; qtd: number; unid: string; mes: string }[]>;
  comparativo: ComparativoItem[];
  gastoMensal: { maio: number; junho: number };
}

const dados = dadosJson as unknown as DadosCompras;

/** Preços reais da última compra, por item normalizado → R$/unidade (KG, UN ou L). */
export const PRECOS_COMPRAS: Record<string, number> = dados.precos;

/** Unidade de medida de cada item conforme planilha de compras. */
export const UNIDADES_COMPRAS: Record<string, string> = dados.unidades;

/** Histórico de compras convertido para o formato PontoPreco do sistema. */
export const HISTORICO_COMPRAS: HistoricoPrecos = Object.fromEntries(
  Object.entries(dados.historico).map(([item, pts]) => [
    item,
    pts.map((p) => ({
      valor: p.valor,
      em: new Date(p.data).toISOString(),
    })),
  ]),
);

/**
 * Variações de preço entre Maio e Junho/2026.
 * Ordenado por variação absoluta decrescente.
 * Variações grandes (>30%) merecem atenção — podem ser troca de embalagem.
 */
export const COMPARATIVO_PRECOS: ComparativoItem[] = dados.comparativo;

/** Gasto total por mês. */
export const GASTO_MENSAL = dados.gastoMensal;

/** Data de geração do arquivo (para exibir na UI). */
export const COMPRAS_ATUALIZADAS_EM = dados.geradoEm;
