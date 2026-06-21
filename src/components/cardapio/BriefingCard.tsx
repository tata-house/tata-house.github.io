'use client';

import { useEffect, useMemo, useState } from 'react';
import { montarBriefing, type ItemBriefing, type NivelAlerta } from '@/lib/cardapio/briefing';
import {
  montarDossieCompleto,
  useAprendizado,
  semanasComConteudo,
  lerSemana,
  lerDesperdicio,
} from '@/lib/cardapio/estado';
import { alertasProspectivos } from '@/lib/cardapio/prospectivo';
import { gerarBriefing } from '@/lib/cardapio/assistente';
import type { Aceitacao, Estoque, EstadoSemana, HistoricoPrecos } from '@/lib/cardapio/tipos';

interface Props {
  estado: EstadoSemana;
  semanaId: string;
  precos: Record<string, number>;
  aceitacao: Aceitacao;
  estoque: Estoque;
  historico: HistoricoPrecos;
  fornecedores: Record<string, string>;
}

const NIVEL_COR: Record<NivelAlerta, string> = {
  urgente: 'bg-red-50 ring-red-200 dark:bg-red-900/20 dark:ring-red-800/50',
  atencao: 'bg-ouro-50 ring-ouro-200 dark:bg-ouro-900/20 dark:ring-ouro-700/40',
  info: 'bg-brand-50 ring-brand-200/60 dark:bg-carvao-800 dark:ring-carvao-600',
};

const NIVEL_TEXTO: Record<NivelAlerta, string> = {
  urgente: 'text-red-700 dark:text-red-300',
  atencao: 'text-ouro-700 dark:text-ouro-300',
  info: 'text-brand-700 dark:text-brand-300',
};

function ItemCard({ item }: { item: ItemBriefing }) {
  return (
    <div className={`rounded-2xl p-3 ring-1 ${NIVEL_COR[item.nivel]}`}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-lg leading-none">{item.icone}</span>
        <div className="min-w-0">
          <p className={`text-nota font-bold ${NIVEL_TEXTO[item.nivel]}`}>{item.titulo}</p>
          <p className="mt-0.5 text-rotulo text-carvao-600 dark:text-areia-300">{item.detalhe}</p>
          {item.acao && (
            <p className="mt-1 text-caption font-semibold text-carvao-500 dark:text-areia-400">
              → {item.acao}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BriefingCard(props: Props) {
  const [expandido, setExpandido] = useState(true);
  const [iaTexto, setIaTexto] = useState<string | null>(null);
  const [carregandoIa, setCarregandoIa] = useState(false);

  const { fatores } = useAprendizado();

  const dossie = useMemo(
    () =>
      montarDossieCompleto({
        semanaId: props.semanaId,
        estado: props.estado,
        precos: props.precos,
        aceitacao: props.aceitacao,
        estoque: props.estoque,
        historico: props.historico,
        fornecedores: props.fornecedores,
      }),
    [props.semanaId, props.estado, props.precos, props.aceitacao, props.estoque, props.historico, props.fornecedores],
  );

  const historicoSemanas = useMemo(() => {
    return semanasComConteudo()
      .filter((id) => id < props.semanaId)
      .slice(-8)
      .map((id) => ({ semanaId: id, estado: lerSemana(id) }));
  }, [props.semanaId]);

  const desps = useMemo(() => {
    return semanasComConteudo()
      .filter((id) => id <= props.semanaId)
      .flatMap((id) => lerDesperdicio(id));
  }, [props.semanaId]);

  const extrasProspectivos = useMemo(
    () =>
      alertasProspectivos(
        props.semanaId,
        props.estado,
        props.estoque,
        props.historico,
        props.aceitacao,
        fatores,
        historicoSemanas,
        desps,
      ),
    [props.semanaId, props.estado, props.estoque, props.historico, props.aceitacao, fatores, historicoSemanas, desps],
  );

  const briefing = useMemo(
    () => montarBriefing(dossie, props.estado, extrasProspectivos),
    [dossie, props.estado, extrasProspectivos],
  );

  // tenta o briefing via LLM apenas quando há alertas reais
  useEffect(() => {
    if (briefing.tudo_ok || briefing.itens.length === 0) return;
    setCarregandoIa(true);
    const ctx = {
      estado: props.estado,
      semanaId: props.semanaId,
      precos: props.precos,
      historico: props.historico,
      fornecedores: props.fornecedores,
      aceitacao: props.aceitacao,
      estoque: props.estoque,
    };
    gerarBriefing(ctx, dossie)
      .then((r) => { if (r?.texto && !r.texto.startsWith('') && !r.texto.startsWith('') && !r.texto.startsWith('')) setIaTexto(r.texto); })
      .catch(() => {})
      .finally(() => setCarregandoIa(false));
  }, [briefing.tudo_ok]); // só recalcula quando muda de estado

  if (briefing.tudo_ok) {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-brand-50 px-5 py-4 ring-1 ring-brand-200/60 dark:bg-carvao-850 dark:ring-carvao-700">
        
        <div>
          <p className="font-display text-sm font-bold text-brand-700 dark:text-brand-300">{briefing.saudacao}</p>
          <p className="text-nota text-carvao-600 dark:text-areia-300">Tudo em ordem hoje. Nenhum alerta ativo.</p>
        </div>
      </div>
    );
  }

  const urgentes = briefing.itens.filter((i) => i.nivel === 'urgente').length;

  return (
    <section className="rounded-3xl bg-white ring-1 ring-carvao-100 shadow-suave dark:bg-carvao-850 dark:ring-carvao-700 overflow-hidden">
      {/* cabeçalho */}
      <button
        onClick={() => setExpandido((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          
          <div>
            <p className="font-display text-sm font-bold text-carvao-800 dark:text-areia-100">{briefing.saudacao}</p>
            <p className="text-rotulo text-carvao-500 dark:text-areia-400">
              {urgentes > 0
                ? `${urgentes} alerta${urgentes > 1 ? 's' : ''} urgente${urgentes > 1 ? 's' : ''}`
                : `${briefing.itens.length} item${briefing.itens.length > 1 ? 'ns' : ''} para atenção`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urgentes > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-micro font-bold text-white">
              {urgentes}
            </span>
          )}
          <span className="text-carvao-400 transition-transform" style={{ transform: expandido ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>
      </button>

      {expandido && (
        <div className="space-y-2 border-t border-carvao-100 px-5 pb-5 pt-3 dark:border-carvao-700">
          {/* narração da IA (quando disponível) */}
          {iaTexto && !carregandoIa && (
            <div className="mb-1 rounded-2xl bg-brand-50 p-3 ring-1 ring-brand-200/60 dark:bg-carvao-800 dark:ring-carvao-600">
              <p className="mb-0.5 text-micro font-bold uppercase tracking-wide text-brand-500">Análise IA</p>
              <p className="text-nota text-carvao-700 dark:text-areia-200">{iaTexto}</p>
            </div>
          )}
          {carregandoIa && (
            <div className="rounded-2xl bg-brand-50/60 px-4 py-3 dark:bg-carvao-800">
              <span className="inline-flex gap-1 text-brand-400">
                <span className="animate-pulse text-xs">●</span>
                <span className="animate-pulse text-xs [animation-delay:150ms]">●</span>
                <span className="animate-pulse text-xs [animation-delay:300ms]">●</span>
              </span>
            </div>
          )}
          {briefing.itens.map((item, i) => (
            <ItemCard key={i} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
