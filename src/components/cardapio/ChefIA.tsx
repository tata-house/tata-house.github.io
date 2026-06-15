'use client';

/* =====================================================================
   Chef IA — análise do cardápio ao montar. Atua como um chef executivo:
   antecipa problemas e sugere ações (economia trocando prato caro, pratos
   sem receita, baixa aceitação histórica, dias incompletos). Não responde
   perguntas — recomenda. Leve e determinístico (sem chamada externa).
   ===================================================================== */

import { useMemo } from 'react';
import { Cartao, Pilula } from '@/components/ui';
import {
  DADOS,
  DIAS_SEMANA,
  formatarReais,
  listaDoDia,
  normalizar,
  proteinaDoPrato,
} from '@/lib/cardapio/motor';
import { estimarPreco } from '@/lib/cardapio/precos';
import { receitaDoPrato, RECEITAS_POR_CATEGORIA } from '@/lib/cardapio/receitas';
import { useEstimativas } from '@/lib/cardapio/estimativas';
import { useHistoricoPrecos, useAceitacao } from '@/lib/cardapio/estado';
import type { DiaCardapio, EstadoSemana } from '@/lib/cardapio/tipos';

type Tom = 'verde' | 'ouro' | 'vermelho' | 'azul';
interface Dica {
  icone: string;
  texto: string;
  tom: Tom;
}

export function ChefIA({
  estado,
  precos,
}: {
  estado: EstadoSemana;
  precos: Record<string, number>;
}) {
  const { estimativas } = useEstimativas();
  const historico = useHistoricoPrecos();
  const { aceitacao } = useAceitacao();

  const dicas = useMemo<Dica[]>(() => {
    const base = DADOS.baseline || 65;
    const precoItem = (norm: string) =>
      precos[norm] > 0 ? precos[norm] : estimativas[norm] > 0 ? estimativas[norm] : estimarPreco(norm, precos, historico) ?? 0;

    // custo por refeição de um prato principal (isolado), usando preço de mercado
    const custoRefDe = (nome: string): number => {
      const dia: DiaCardapio = {
        pessoas: base,
        principal: nome,
        guarnicaoFixa: '',
        guarnicao: '',
        salada: '',
        sobremesa: '',
      };
      const total = listaDoDia(dia).reduce((t, s) => t + precoItem(normalizar(s.item)) * s.qtd, 0);
      return total / base;
    };

    const out: Dica[] = [];
    const comPrato = estado.dias.map((d, i) => ({ d, i })).filter((x) => x.d.principal);

    // 1) Economia: troca do prato principal mais caro por uma alternativa barata
    if (comPrato.length > 0) {
      const usados = new Set(comPrato.map((x) => normalizar(x.d.principal)));
      const caro = comPrato
        .map((x) => ({ ...x, ref: custoRefDe(x.d.principal) }))
        .sort((a, b) => b.ref - a.ref)[0];
      const alternativas = RECEITAS_POR_CATEGORIA.principal
        .filter((n) => !usados.has(normalizar(n)))
        .map((n) => ({ n, ref: custoRefDe(n) }))
        .filter((a) => a.ref > 0)
        .sort((a, b) => a.ref - b.ref);
      const alt = alternativas[0];
      if (caro && caro.ref > 0 && alt && caro.ref - alt.ref > 0.5) {
        const economia = (caro.ref - alt.ref) * caro.d.pessoas;
        out.push({
          icone: '💸',
          texto: `Trocar “${caro.d.principal}” (${DIAS_SEMANA[caro.i].slice(0, 3)}) por “${alt.n}” pode economizar ~${formatarReais(economia)} no dia, sem perder a refeição.`,
          tom: 'verde',
        });
      }
    }

    // 2) Pratos sem receita (ingredientes só estimados)
    const semReceita = comPrato.filter((x) => !receitaDoPrato(x.d.principal));
    if (semReceita.length > 0)
      out.push({
        icone: '📋',
        texto: `${semReceita.length} prato(s) sem receita cadastrada — os ingredientes são um chute. Prefira pratos com receita ou complete os itens.`,
        tom: 'ouro',
      });

    // 3) Baixa aceitação histórica
    comPrato.forEach((x) => {
      const a = aceitacao[normalizar(x.d.principal)];
      if (a && a.n >= 3 && a.somaNotas / a.n < 3)
        out.push({
          icone: '👎',
          texto: `“${x.d.principal}” teve avaliação baixa antes (nota ${(a.somaNotas / a.n).toFixed(1)}). Considere trocar por um campeão de aceitação.`,
          tom: 'vermelho',
        });
    });

    // 4) Excesso de proteína (reforço do chef)
    const cont: Record<string, number> = {};
    comPrato.forEach((x) => {
      const p = proteinaDoPrato(x.d.principal);
      cont[p] = (cont[p] ?? 0) + 1;
    });
    if ((cont['frango'] ?? 0) > 4)
      out.push({ icone: '🍗', texto: `Frango ${cont['frango']}× nesta semana — muita repetição. Varie as proteínas.`, tom: 'ouro' });
    if ((cont['suina'] ?? 0) > 2)
      out.push({ icone: '🥓', texto: `Carne suína ${cont['suina']}× — acima do recomendado (máx. 2×).`, tom: 'vermelho' });

    // 5) Dias incompletos
    const vazios = estado.dias.filter((d) => !d.principal).length;
    if (vazios > 0 && vazios < 7)
      out.push({ icone: '📅', texto: `${vazios} dia(s) ainda sem prato principal. Use “Sugerir” para fechar a semana.`, tom: 'azul' });

    return out.slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.dias, precos, estimativas, historico, aceitacao]);

  if (dicas.length === 0) return null;

  return (
    <Cartao className="space-y-2 border-l-4 !border-l-brand-500">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <h3 className="font-display text-sm font-bold">Chef IA</h3>
        <Pilula tom="azul">{dicas.length}</Pilula>
        <span className="text-[11px] text-carvao-400">recomendações para esta semana</span>
      </div>
      <ul className="space-y-1.5">
        {dicas.map((d, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="shrink-0">{d.icone}</span>
            <span
              className={
                d.tom === 'vermelho'
                  ? 'text-[#b04c41]'
                  : d.tom === 'ouro'
                    ? 'text-[#9a6c17] dark:text-[#e3b45c]'
                    : d.tom === 'verde'
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-carvao-600 dark:text-areia-200'
              }
            >
              {d.texto}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-carvao-400">Sugestões automáticas — você decide.</p>
    </Cartao>
  );
}
