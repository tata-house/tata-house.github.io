'use client';

/* =====================================================================
   Previsão de presença — o "gêmeo digital" do refeitório.

   Nenhum ERP de refeitório faz isto: em vez de o gestor chutar "65 pessoas"
   todo dia, o app aprende a presença REAL (refeições servidas) por dia da
   semana ao longo do histórico, ajusta pela aceitação do prato planejado
   (prato campeão atrai mais gente; prato fraco atrai menos) e prevê quantas
   pessoas vão almoçar em cada dia desta semana — para produzir e comprar na
   medida certa. É a raiz do combate ao desperdício e à falta.

   Tudo local e determinístico. Não chama serviço externo.
   ===================================================================== */

import { useEffect, useMemo, useState } from 'react';
import { Botao, Cartao, Pilula, Secao } from '@/components/ui';
import { DIAS_SEMANA, normalizar } from '@/lib/cardapio/motor';
import { lerSemana, semanasComConteudo } from '@/lib/cardapio/estado';
import { useAceitacao } from '@/lib/cardapio/estado';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

interface Amostra {
  peso: number;
  total: number; // soma ponderada de presença
}

interface Previsao {
  dia: number;
  prato: string;
  base: number; // média ponderada da presença real
  prevista: number; // base ajustada pela aceitação, arredondada
  planejada: number;
  amostras: number;
}

const arred5 = (n: number) => Math.max(0, Math.round(n / 5) * 5);

export function PrevisaoPresenca({
  estado,
  atualizar,
  podeEditar,
}: {
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  podeEditar: boolean;
}) {
  const { aceitacao } = useAceitacao();
  // Presença real por dia da semana (0=seg … 6=dom), ponderada por recência.
  const [perfil, setPerfil] = useState<Amostra[]>([]);

  useEffect(() => {
    const ids = semanasComConteudo(); // ordenados (antigo → recente)
    const acc: Amostra[] = Array.from({ length: 7 }, () => ({ peso: 0, total: 0 }));
    ids.forEach((id, idx) => {
      // recência: semanas mais recentes pesam mais (decaimento suave)
      const peso = 1 / (1 + (ids.length - 1 - idx) * 0.15);
      const sem = lerSemana(id);
      const ref = sem.refeicoes ?? {};
      for (let i = 0; i < 7; i++) {
        const v = ref[i];
        if (typeof v === 'number' && v > 0) {
          acc[i].peso += peso;
          acc[i].total += v * peso;
        }
      }
    });
    setPerfil(acc);
  }, []);

  const previsoes = useMemo<Previsao[]>(() => {
    return estado.dias
      .map((d, dia): Previsao | null => {
        if (!d.principal) return null;
        const a = perfil[dia];
        if (!a || a.peso === 0) return null; // sem histórico para este dia
        const base = a.total / a.peso;
        // Ajuste pela aceitação do prato (campeão atrai, fraco afasta).
        const ac = aceitacao[normalizar(d.principal)];
        let fator = 1;
        if (ac && ac.n >= 3) {
          const media = ac.somaNotas / ac.n;
          if (media >= 4.2) fator = 1.05;
          else if (media <= 2.5) fator = 0.92;
        }
        return {
          dia,
          prato: d.principal,
          base,
          prevista: arred5(base * fator),
          planejada: d.pessoas,
          amostras: Math.round(a.peso),
        };
      })
      .filter((p): p is Previsao => p !== null);
  }, [estado.dias, perfil, aceitacao]);

  // Só sugere ajuste quando o desvio é material (≥5 pessoas e ≥8%).
  const ajustes = previsoes.filter(
    (p) => Math.abs(p.prevista - p.planejada) >= 5 && Math.abs(p.prevista - p.planejada) / Math.max(1, p.planejada) >= 0.08,
  );

  const totalPrev = previsoes.reduce((a, p) => a + p.prevista, 0);
  const totalPlan = previsoes.reduce((a, p) => a + p.planejada, 0);
  const excesso = totalPlan - totalPrev; // + = planejando demais (risco de sobra)

  const aplicarUm = (p: Previsao) =>
    atualizar((e) => ({ ...e, dias: e.dias.map((d, i) => (i === p.dia ? { ...d, pessoas: p.prevista } : d)) }));

  const aplicarTodos = () =>
    atualizar((e) => ({
      ...e,
      dias: e.dias.map((d, i) => {
        const p = ajustes.find((x) => x.dia === i);
        return p ? { ...d, pessoas: p.prevista } : d;
      }),
    }));

  if (previsoes.length === 0) return null; // sem histórico suficiente ainda

  const confianca = previsoes.reduce((m, p) => Math.min(m, p.amostras), 99);
  const rotuloConf = confianca >= 4 ? 'alta' : confianca >= 2 ? 'média' : 'baixa';

  return (
    <Secao
      titulo="Previsão de presença"
      acao={
        excesso !== 0 ? (
          <Pilula tom={excesso > 0 ? 'ouro' : 'vermelho'}>
            {excesso > 0 ? `${excesso} a mais planejados` : `faltam ~${Math.abs(excesso)}`}
          </Pilula>
        ) : (
          <Pilula tom="verde">na medida</Pilula>
        )
      }
    >
      <Cartao className="space-y-3">
        <p className="text-rotulo text-carvao-500 dark:text-areia-200">
          Aprendi a presença real por dia da semana ({rotuloConf} confiança) e ajustei pela aceitação dos pratos. Veja a
          previsão para esta semana:
        </p>

        <ul className="space-y-1.5">
          {previsoes.map((p) => {
            const delta = p.prevista - p.planejada;
            const sugerir = ajustes.some((x) => x.dia === p.dia);
            return (
              <li key={p.dia} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <span className="text-micro font-bold uppercase text-carvao-400">{DIAS_SEMANA[p.dia].slice(0, 3)}</span>{' '}
                  <span className="font-semibold">{p.prevista}</span>{' '}
                  <span className="text-caption text-carvao-400">previstas · plano {p.planejada}</span>
                </div>
                {sugerir ? (
                  podeEditar ? (
                    <button
                      onClick={() => aplicarUm(p)}
                      className="shrink-0 rounded-full bg-brand-600/10 px-2.5 py-1 text-caption font-bold text-brand-700 ring-1 ring-brand-600/20 transition hover:bg-brand-600/20 dark:text-brand-300"
                    >
                      {delta > 0 ? `▲ ajustar +${delta}` : `▼ ajustar ${delta}`}
                    </button>
                  ) : (
                    <Pilula tom={delta > 0 ? 'ouro' : 'vermelho'}>
                      {delta > 0 ? `+${delta}` : delta}
                    </Pilula>
                  )
                ) : (
                  <Pilula tom="verde">ok</Pilula>
                )}
              </li>
            );
          })}
        </ul>

        {ajustes.length > 0 && podeEditar && (
          <Botao variante="secundario" onClick={aplicarTodos} className="w-full">
            Ajustar todos para a previsão ({ajustes.length})
          </Botao>
        )}

        <p className="text-micro text-carvao-400">
          Quanto mais a cozinha lançar as refeições servidas de fato, mais certeira fica a previsão — e menos sobra/falta.
        </p>
      </Cartao>
    </Secao>
  );
}
