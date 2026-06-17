'use client';

/* =====================================================================
   Centro de decisões — transforma os dados do sistema em recomendações
   práticas (não só gráficos): itens sem preço, estoque crítico, preços em
   alta, oportunidades de economia e o prato mais bem avaliado. Aparece no
   Painel (Gerência). Só mostra o que for acionável.
   ===================================================================== */

import { useMemo } from 'react';
import { Cartao, Pilula, Secao } from '@/components/cardapio/ui';
import { listaDoDia, normalizar } from '@/lib/cardapio/motor';
import { resolverPreco } from '@/lib/cardapio/precos';
import { analisarRadar, fraseAlerta } from '@/lib/cardapio/radar';
import { alertasEstoque } from '@/lib/cardapio/indicadores';
import { useEstimativas } from '@/lib/cardapio/estimativas';
import type { Aceitacao, Estoque, EstadoSemana, HistoricoPrecos } from '@/lib/cardapio/tipos';

type Tom = 'verde' | 'ouro' | 'vermelho' | 'azul';
interface Decisao {
  icone: string;
  titulo: string;
  detalhe: string;
  tom: Tom;
}

const ROTULO_TOM: Record<Tom, string> = {
  vermelho: 'ação',
  ouro: 'atenção',
  verde: 'boa',
  azul: 'dica',
};

export function CentroDecisoes({
  estado,
  precos,
  historico,
  estoque,
  aceitacao,
}: {
  estado: EstadoSemana;
  precos: Record<string, number>;
  historico: HistoricoPrecos;
  estoque: Estoque;
  aceitacao: Aceitacao;
}) {
  const { estimativas } = useEstimativas();

  const decisoes = useMemo<Decisao[]>(() => {
    const out: Decisao[] = [];

    // 1) itens sem preço na semana
    const sem = new Set<string>();
    estado.dias.forEach((d) => {
      if (!d.principal) return;
      listaDoDia(d).forEach((s) => {
        if (resolverPreco(normalizar(s.item), precos, estimativas).tipo === 'sem') sem.add(normalizar(s.item));
      });
    });
    if (sem.size > 0)
      out.push({
        icone: '🏷️',
        titulo: `${sem.size} itens sem preço`,
        detalhe: 'Revise antes de fechar a compra para o custo cobrir tudo.',
        tom: 'vermelho',
      });

    // 2) estoque no limite
    const baixos = alertasEstoque(estoque);
    if (baixos.length > 0)
      out.push({
        icone: '📦',
        titulo: `${baixos.length} itens no limite do estoque`,
        detalhe: baixos.slice(0, 3).map((b) => b.item).join(', ') + '.',
        tom: 'ouro',
      });

    // 3 e 4) radar de preços: alta (cuidado) e baixa (oportunidade)
    const radar = analisarRadar(precos, historico).filter((r) => r.alerta);
    const alta = radar.find((r) => r.alerta === 'alta');
    const baixa = radar.find((r) => r.alerta !== 'alta');
    if (alta) out.push({ icone: '📈', titulo: 'Preço em alta', detalhe: fraseAlerta(alta), tom: 'vermelho' });
    if (baixa) out.push({ icone: '💸', titulo: 'Oportunidade de economia', detalhe: fraseAlerta(baixa), tom: 'verde' });

    // 5) melhor prato avaliado (escolha recorrente segura)
    const melhor = Object.values(aceitacao)
      .filter((a) => a.n > 0)
      .map((a) => ({ prato: a.prato, media: a.somaNotas / a.n, n: a.n }))
      .sort((a, b) => b.media - a.media)[0];
    if (melhor && melhor.media >= 4)
      out.push({
        icone: '🏆',
        titulo: 'Campeão de aceitação',
        detalhe: `${melhor.prato} — nota ${melhor.media.toFixed(1)} (${melhor.n} votos). Boa aposta para repetir.`,
        tom: 'verde',
      });

    return out;
  }, [estado, precos, historico, estoque, aceitacao, estimativas]);

  if (decisoes.length === 0) return null;

  return (
    <Secao titulo="🧭 Centro de decisões" acao={<Pilula tom="azul">{decisoes.length} recomendações</Pilula>}>
      <div className="space-y-2">
        {decisoes.map((d, i) => (
          <Cartao key={i} className="flex items-start gap-3 !py-3">
            <span className="text-xl leading-none">{d.icone}</span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                {d.titulo}
                <Pilula tom={d.tom}>{ROTULO_TOM[d.tom]}</Pilula>
              </p>
              <p className="text-xs text-carvao-500 dark:text-areia-200">{d.detalhe}</p>
            </div>
          </Cartao>
        ))}
      </div>
    </Secao>
  );
}
