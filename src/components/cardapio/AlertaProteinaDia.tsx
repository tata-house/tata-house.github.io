'use client';

import { useMemo } from 'react';
import { Icone } from '@/components/Icones';
import { normalizar } from '@/lib/cardapio/motor';
import type { DiaCardapio, Estoque, Funcionario } from '@/lib/cardapio/tipos';

/* Termos que indicam proteína animal em nomes de prato */
const MAPA_PROTEINA: { norm: string; rotulo: string; emoji: string }[] = [
  { norm: 'frango',     rotulo: 'Frango',   emoji: '' },
  { norm: 'sobrecoxa',  rotulo: 'Frango',   emoji: '' },
  { norm: 'peito',      rotulo: 'Frango',   emoji: '' },
  { norm: 'file',       rotulo: 'Carne',    emoji: '' },
  { norm: 'bife',       rotulo: 'Carne',    emoji: '' },
  { norm: 'contra',     rotulo: 'Carne',    emoji: '' },
  { norm: 'alcatra',    rotulo: 'Carne',    emoji: '' },
  { norm: 'picanha',    rotulo: 'Carne',    emoji: '' },
  { norm: 'costela',    rotulo: 'Carne',    emoji: '' },
  { norm: 'carne',      rotulo: 'Carne',    emoji: '' },
  { norm: 'linguica',   rotulo: 'Linguiça', emoji: '' },
  { norm: 'costelinha', rotulo: 'Suíno',    emoji: '' },
  { norm: 'lombo',      rotulo: 'Suíno',    emoji: '' },
  { norm: 'tilapia',    rotulo: 'Peixe',    emoji: '' },
  { norm: 'salmao',     rotulo: 'Peixe',    emoji: '' },
  { norm: 'peixe',      rotulo: 'Peixe',    emoji: '' },
  { norm: 'ovo',        rotulo: 'Ovo',      emoji: '' },
];

function detectarProteina(prato: string): { norm: string; rotulo: string; emoji: string } | null {
  const n = normalizar(prato);
  return MAPA_PROTEINA.find((p) => n.includes(p.norm)) ?? null;
}

/* Extrai itens do estoque que correspondem a uma proteína (busca por substring) */
function estoqueProteina(
  normProteina: string,
  estoque: Estoque,
): { norm: string; qtd: number; unid: string }[] {
  return Object.entries(estoque)
    .filter(([k]) => k.includes(normProteina) && estoque[k].qtd > 0)
    .map(([k, e]) => ({ norm: k, qtd: e.qtd, unid: e.unid }));
}

interface AlertaDia {
  diaIdx: number;
  prato: string;
  proteina: { rotulo: string; emoji: string };
  pessoasPrevistas: number;
  estoqueItens: { norm: string; qtd: number; unid: string }[];
}

export function AlertaProteinaDia({
  dias,
  estoque,
  funcionarios,
}: {
  dias: DiaCardapio[];
  estoque: Estoque;
  funcionarios: Funcionario[];
}) {
  const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const alertas = useMemo((): AlertaDia[] => {
    const res: AlertaDia[] = [];
    dias.forEach((dia, diaIdx) => {
      if (!dia.principal) return;
      const prot = detectarProteina(dia.principal);
      if (!prot) return;
      const itensEstoque = estoqueProteina(prot.norm, estoque);
      const totalKg = itensEstoque
        .filter((e) => e.unid === 'KG')
        .reduce((s, e) => s + e.qtd, 0);
      const kgNecessario = dia.pessoas * 0.2; // ~200g por pessoa
      if (totalKg > 0 && totalKg < kgNecessario) {
        res.push({ diaIdx, prato: dia.principal, proteina: prot, pessoasPrevistas: dia.pessoas, estoqueItens: itensEstoque });
      }
    });
    return res;
  }, [dias, estoque]);

  const conflitosRestr = useMemo(() => {
    const res: { diaIdx: number; funcionario: string; alimento: string }[] = [];
    const ativos = funcionarios.filter((f) => f.ativo && f.restricoes.length > 0);
    dias.forEach((dia, diaIdx) => {
      if (!dia.principal) return;
      const pratosNorm = [dia.principal, dia.guarnicaoFixa, dia.guarnicao, dia.salada, dia.sobremesa]
        .filter(Boolean)
        .map((p) => normalizar(p));
      ativos.forEach((f) => {
        f.restricoes.forEach((r) => {
          const rNorm = normalizar(r.alimento);
          if (pratosNorm.some((p) => p.includes(rNorm))) {
            res.push({ diaIdx, funcionario: f.nome, alimento: r.alimento });
          }
        });
      });
    });
    return res;
  }, [dias, funcionarios]);

  if (alertas.length === 0 && conflitosRestr.length === 0) return null;

  return (
    <div className="space-y-2">
      {alertas.map((a, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/50 dark:bg-amber-950/30"
        >
          <Icone nome="alerta" tam={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Estoque baixo de {a.proteina.rotulo} — {DIAS_PT[a.diaIdx]}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {a.prato} · {a.pessoasPrevistas} pessoas previstas ·{' '}
              {a.estoqueItens.map((e) => `${e.qtd.toFixed(1)} ${e.unid}`).join(', ')} disponível
            </p>
            <p className="mt-0.5 text-caption text-amber-600 dark:text-amber-500">
              Estimar ~{(a.pessoasPrevistas * 0.2).toFixed(1)} kg necessário (200g/pessoa)
            </p>
          </div>
        </div>
      ))}

      {conflitosRestr.map((c, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-700/50 dark:bg-red-950/30"
        >
          <Icone nome="alerta" tam={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              Restrição alimentar — {DIAS_PT[c.diaIdx]}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {c.funcionario} não consome <strong>{c.alimento}</strong>. Preparar alternativa.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
