'use client';

/* =====================================================================
   Painel do Diretor — tela de abertura para gestor/administrador.
   Uma leitura de 5 segundos que substitui o scroll por decisão:
   risco, oportunidade, fornecedor, favorito, estoque — tudo em um bloco.
   ===================================================================== */

import { useMemo } from 'react';
import { formatarReais } from '@/lib/cardapio/motor';
import { analisarRadar } from '@/lib/cardapio/radar';
import { alertasEstoque } from '@/lib/cardapio/indicadores';
import type { Aceitacao, Estoque, HistoricoPrecos, PerfilFornecedor } from '@/lib/cardapio/tipos';

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface CardItem {
  cor: 'verde' | 'vermelho' | 'ouro' | 'azul';
  label: string;
  valor: string;
  sub: string;
}

interface Props {
  nome: string;
  precos: Record<string, number>;
  historico: HistoricoPrecos;
  fornecedores: Record<string, string>;
  perfis: Record<string, PerfilFornecedor>;
  aceitacao: Aceitacao;
  estoque: Estoque;
}

export function PainelDiretor({ nome, precos, historico, fornecedores, perfis, aceitacao, estoque }: Props) {
  const radar = useMemo(() => analisarRadar(precos, historico, fornecedores), [precos, historico, fornecedores]);

  const cards = useMemo((): CardItem[] => {
    const out: CardItem[] = [];

    // 1. Economia potencial — soma das economias de substituição disponíveis
    const altasComSubst = radar.filter((r) => r.alerta === 'alta' && r.substituir);
    const economiaTotal = altasComSubst.reduce((s, r) => s + (r.substituir!.economia ?? 0), 0);
    if (economiaTotal >= 1) {
      out.push({
        cor: 'verde',
        label: 'Economia potencial',
        valor: `${formatarReais(economiaTotal)}/kg`,
        sub: `trocando ${altasComSubst.length === 1 ? '1 proteína' : `${altasComSubst.length} proteínas`} acima do histórico`,
      });
    }

    // 2. Maior risco de preço
    const maiorAlta = radar.filter((r) => r.alerta === 'alta')[0] ?? null;
    if (maiorAlta) {
      const pct = Math.round(Math.abs(maiorAlta.variacao ?? 0) * 100);
      out.push({
        cor: 'vermelho',
        label: 'Maior risco',
        valor: maiorAlta.item,
        sub: `↑ ${pct}% acima da última cotação`,
      });
    }

    // 3. Oportunidade de compra (queda) — só quando sem risco maior
    if (!maiorAlta) {
      const maiorQueda = radar.filter((r) => r.alerta === 'queda')[0] ?? null;
      if (maiorQueda) {
        const pct = Math.round(Math.abs(maiorQueda.variacao ?? 0) * 100);
        out.push({
          cor: 'verde',
          label: 'Oportunidade',
          valor: maiorQueda.item,
          sub: `↓ ${pct}% — bom momento para reforçar estoque`,
        });
      }
    }

    // 4. Melhor fornecedor avaliado
    const avaliados = Object.values(perfis)
      .filter((p) => p.avaliacoes.length > 0)
      .map((p) => {
        const q = p.avaliacoes.reduce((s, a) => s + a.qualidade, 0) / p.avaliacoes.length;
        const e = p.avaliacoes.filter((a) => a.entregaOk).length / p.avaliacoes.length;
        return { nome: p.nome, score: q * e, entrega: e };
      })
      .sort((a, b) => b.score - a.score);

    if (avaliados[0]) {
      out.push({
        cor: 'ouro',
        label: 'Fornecedor destaque',
        valor: avaliados[0].nome,
        sub: `${Math.round(avaliados[0].entrega * 100)}% de entregas confirmadas`,
      });
    }

    // 5. Favorito da equipe
    const pratoFav = Object.values(aceitacao)
      .filter((r) => r.n >= 2)
      .map((r) => ({ prato: r.prato, nota: r.somaNotas / r.n, n: r.n }))
      .sort((a, b) => b.nota - a.nota)[0] ?? null;

    if (pratoFav) {
      out.push({
        cor: 'azul',
        label: 'Favorito da equipe',
        valor: pratoFav.prato,
        sub: `${pratoFav.nota.toFixed(1)}★ em ${pratoFav.n} avaliações`,
      });
    }

    // 6. Estoque crítico
    const baixos = alertasEstoque(estoque);
    if (baixos.length > 0) {
      out.push({
        cor: 'vermelho',
        label: 'Estoque crítico',
        valor: `${baixos.length} ${baixos.length === 1 ? 'item' : 'itens'}`,
        sub: baixos
          .slice(0, 2)
          .map((a) => a.item)
          .join(' · '),
      });
    }

    return out;
  }, [radar, perfis, aceitacao, estoque]);

  if (cards.length === 0) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-carvao-900 via-carvao-850 to-brand-900 px-5 py-5">
      <p className="text-micro font-bold uppercase tracking-[0.18em] text-areia-100/60">
        {saudacao()}, {nome}
      </p>
      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <DashCard key={i} {...c} />
        ))}
      </div>
    </div>
  );
}

const DOT_COR: Record<CardItem['cor'], string> = {
  verde:    'bg-emerald-400',
  vermelho: 'bg-red-400',
  ouro:     'bg-ouro-400',
  azul:     'bg-[#60a5fa]',
};

function DashCard({ cor, label, valor, sub }: CardItem) {
  return (
    <div className="rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COR[cor]}`} />
        <p className="text-micro font-bold uppercase tracking-[0.14em] text-white/60">{label}</p>
      </div>
      <p className="mt-2 truncate text-sm font-bold leading-snug text-white">{valor}</p>
      <p className="mt-0.5 line-clamp-2 text-caption leading-snug text-white/50">{sub}</p>
    </div>
  );
}
