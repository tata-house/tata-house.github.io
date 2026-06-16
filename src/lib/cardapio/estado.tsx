'use client';

/* =====================================================================
   Estado do Cardápio da equipe — persistido em localStorage (protótipo).
   Cada semana é um documento independente; preços são globais.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';
import { linhasDoDia, normalizar, PESSOAS_PADRAO } from './motor';
import type {
  Aceitacao,
  ChefFeedback,
  Estoque,
  EventoDemanda,
  HistoricoPrecos,
  ItemEstoque,
  MovEstoque,
  EstadoSemana,
  Papel,
  RegistroAceitacao,
  RegistroAuditoria,
  RegistroDesperdicio,
} from './tipos';

const PREFIXO = 'cardapio.v1.';

export function semanaVazia(): EstadoSemana {
  const medias = lerLocal<Record<number, RegistroAprendizado>>('mediaRefeicoes', {});
  return {
    versao: 1,
    orcamento: null,
    dias: PESSOAS_PADRAO.map((pessoas, i) => ({
      pessoas: medias[i]?.n ? Math.round(medias[i].f) : pessoas,
      principal: '',
      guarnicaoFixa: 'Arroz e Feijão',
      guarnicao: '',
      salada: '',
      sobremesa: '',
    })),
    etapa: 'rascunho',
    historico: [],
    ajustes: {},
    manuais: {},
    status: {},
    obsCozinha: '',
  };
}

function lerLocal<T>(chave: string, padrao: T): T {
  if (typeof window === 'undefined') return padrao;
  try {
    const raw = localStorage.getItem(PREFIXO + chave);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravarLocal(chave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* armazenamento cheio/indisponível: protótipo segue em memória */
  }
}

/* =====================================================================
   Auditoria global (Módulo 9)
   ===================================================================== */

let cacheAuditoria: RegistroAuditoria[] | null = null;
const ouvintesAuditoria = new Set<() => void>();

function carregarAuditoria(): RegistroAuditoria[] {
  if (cacheAuditoria === null) cacheAuditoria = lerLocal<RegistroAuditoria[]>('auditoria', []);
  return cacheAuditoria;
}

let papelAtual: Papel = 'gestor';

export function registrarAuditoria(reg: Omit<RegistroAuditoria, 'em' | 'papel'> & { em?: string; papel?: Papel }) {
  const completo: RegistroAuditoria = {
    em: reg.em ?? new Date().toISOString(),
    papel: reg.papel ?? papelAtual,
    acao: reg.acao,
    alvo: reg.alvo,
    de: reg.de,
    para: reg.para,
    semana: reg.semana,
  };
  const lista = [completo, ...carregarAuditoria()].slice(0, 800);
  cacheAuditoria = lista;
  gravarLocal('auditoria', lista);
  ouvintesAuditoria.forEach((f) => f());
}

export function useAuditoria() {
  const [, forcar] = useState(0);
  useEffect(() => {
    const f = () => forcar((x) => x + 1);
    ouvintesAuditoria.add(f);
    f();
    return () => {
      ouvintesAuditoria.delete(f);
    };
  }, []);
  const limpar = useCallback(() => {
    cacheAuditoria = [];
    gravarLocal('auditoria', []);
    ouvintesAuditoria.forEach((f) => f());
  }, []);
  return { registros: carregarAuditoria(), limpar };
}

function ddmm(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function periodoSemana(id: string): string {
  const datas = datasDaSemana(id);
  return `${ddmm(datas[0])} a ${ddmm(datas[6])}`;
}

export function rotuloSemana(id: string, numero?: number): string {
  const base = numero ? `Semana ${numero} · ` : '';
  return `${base}${periodoSemana(id)}`;
}

export function idsSemanas(): string[] {
  const hoje = new Date();
  const ids: string[] = [];
  for (let off = 0; off <= 7; off++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + off * 7);
    ids.push(idSemanaIso(d));
  }
  return ids;
}

export function datasDaSemana(id: string): Date[] {
  const [anoS, semS] = id.split('-S');
  const ano = Number(anoS);
  const sem = Number(semS);
  const jan4 = new Date(Date.UTC(ano, 0, 4));
  const diaSem = jan4.getUTCDay() || 7;
  const segunda = new Date(jan4);
  segunda.setUTCDate(jan4.getUTCDate() - diaSem + 1 + (sem - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda);
    d.setUTCDate(segunda.getUTCDate() + i);
    return d;
  });
}

export function idSemanaIso(data: Date): string {
  const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(semana).padStart(2, '0')}`;
}

export function deslocarSemana(id: string, deltaSemanas: number): string {
  const seg = datasDaSemana(id)[0];
  const d = new Date(seg);
  d.setUTCDate(d.getUTCDate() + deltaSemanas * 7);
  return idSemanaIso(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function semanasComConteudo(): string[] {
  if (typeof window === 'undefined') return [];
  const prefixo = PREFIXO + 'semana.';
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefixo)) continue;
      const raw = localStorage.getItem(k);
      if (raw && /"principal":"[^"]+"/.test(raw)) ids.push(k.slice(prefixo.length));
    }
  } catch {
    /* indisponível */
  }
  return ids.sort();
}

export function gravarSemana(id: string, estado: EstadoSemana) {
  gravarLocal('semana.' + id, estado);
}

export function lerSemana(semanaId: string): EstadoSemana {
  return lerLocal('semana.' + semanaId, semanaVazia());
}

export function useSemana(semanaId: string) {
  const [estado, setEstado] = useState<EstadoSemana>(semanaVazia);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setEstado(lerLocal('semana.' + semanaId, semanaVazia()));
    setPronto(true);
  }, [semanaId]);

  const atualizar = useCallback(
    (fn: (atual: EstadoSemana) => EstadoSemana) => {
      setEstado((atual) => {
        const novo = fn(atual);
        gravarLocal('semana.' + semanaId, novo);
        return novo;
      });
    },
    [semanaId],
  );

  return { estado, atualizar, pronto };
}

export function usePrecos() {
  const [precos, setPrecos] = useState<Record<string, number>>({});

  useEffect(() => {
    setPrecos(lerLocal('precos', {}));
  }, []);

  const definirPreco = useCallback((itemNorm: string, valor: number | null, nome?: string) => {
    setPrecos((atual) => {
      const anterior = atual[itemNorm];
      const novo = { ...atual };
      if (valor === null || Number.isNaN(valor) || valor <= 0) delete novo[itemNorm];
      else novo[itemNorm] = valor;
      gravarLocal('precos', novo);

      if (valor !== null && valor > 0 && valor !== anterior) {
        const hist = lerLocal<HistoricoPrecos>('historicoPrecos', {});
        const serie = hist[itemNorm] ?? [];
        serie.push({ valor, em: new Date().toISOString() });
        hist[itemNorm] = serie.slice(-40);
        gravarLocal('historicoPrecos', hist);
        registrarAuditoria({
          acao: 'alterou preço',
          alvo: nome ?? itemNorm,
          de: anterior ?? null,
          para: valor,
        });
      }
      return novo;
    });
  }, []);

  return { precos, definirPreco };
}

export function useHistoricoPrecos() {
  const [historico, setHistorico] = useState<HistoricoPrecos>({});
  useEffect(() => {
    setHistorico(lerLocal('historicoPrecos', {}));
  }, []);
  return historico;
}

export interface ItemExtra {
  n: string;
  u: string;
}

export function useItensExtras() {
  const [itensExtras, setItensExtras] = useState<Record<string, ItemExtra>>({});

  useEffect(() => {
    setItensExtras(lerLocal('itensExtras', {}));
  }, []);

  const cadastrarItem = useCallback((norm: string, nome: string, unid: string) => {
    setItensExtras((atual) => {
      const novo = { ...atual, [norm]: { n: nome, u: unid } };
      gravarLocal('itensExtras', novo);
      return novo;
    });
  }, []);

  return { itensExtras, cadastrarItem };
}

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Record<string, string>>({});

  useEffect(() => {
    setFornecedores(lerLocal('fornecedores', {}));
  }, []);

  const definirFornecedor = useCallback((itemNorm: string, marca: string | null) => {
    setFornecedores((atual) => {
      const anterior = atual[itemNorm];
      const novo = { ...atual };
      if (!marca) delete novo[itemNorm];
      else novo[itemNorm] = marca;
      gravarLocal('fornecedores', novo);
      if (marca && marca !== anterior) {
        registrarAuditoria({ acao: 'definiu fornecedor', alvo: itemNorm, de: anterior ?? null, para: marca });
      }
      return novo;
    });
  }, []);

  return { fornecedores, definirFornecedor };
}

interface RegistroAprendizado {
  f: number;
  n: number;
}

const TETO_OBSERVACOES = 8;

export function useAprendizado() {
  const [registros, setRegistros] = useState<Record<string, RegistroAprendizado>>({});

  useEffect(() => {
    setRegistros(lerLocal('aprendizado', {}));
  }, []);

  const fatores: Record<string, number> = {};
  for (const [k, r] of Object.entries(registros)) {
    fatores[k] = Math.min(1.5, Math.max(0.5, r.f));
  }

  const aprenderDeSemana = useCallback((estado: EstadoSemana) => {
    setRegistros((atual) => {
      const novo = { ...atual };
      estado.dias.forEach((_, di) => {
        for (const l of linhasDoDia(estado, di)) {
          if (l.manual || l.sugerida === null || l.sugerida <= 0) continue;
          if (l.qtd === l.sugerida || l.qtd <= 0) continue;
          const razao = Math.min(3, Math.max(0.3, l.qtd / l.sugerida));
          const r = novo[l.chave] ?? { f: 1, n: 0 };
          const n = Math.min(r.n, TETO_OBSERVACOES);
          novo[l.chave] = { f: (r.f * n + razao) / (n + 1), n: r.n + 1 };
        }
      });
      gravarLocal('aprendizado', novo);
      return novo;
    });

    const medias = lerLocal<Record<number, RegistroAprendizado>>('mediaRefeicoes', {});
    let mudou = false;
    Object.entries(estado.refeicoes ?? {}).forEach(([diS, qtd]) => {
      const di = Number(diS);
      if (!(qtd > 0)) return;
      const r = medias[di] ?? { f: qtd, n: 0 };
      const n = Math.min(r.n, TETO_OBSERVACOES);
      medias[di] = { f: (r.f * n + qtd) / (n + 1), n: r.n + 1 };
      mudou = true;
    });
    if (mudou) gravarLocal('mediaRefeicoes', medias);
  }, []);

  return { fatores, aprenderDeSemana, totalAprendido: Object.keys(registros).length };
}

export function usePapel() {
  const [papel, setPapelEstado] = useState<Papel>('gestor');

  useEffect(() => {
    const p = lerLocal<Papel>('papel', 'gestor');
    papelAtual = p;
    setPapelEstado(p);
  }, []);

  const setPapel = useCallback((p: Papel) => {
    papelAtual = p;
    setPapelEstado(p);
    gravarLocal('papel', p);
  }, []);

  return { papel, setPapel };
}

export function useEstoque() {
  const [estoque, setEstoque] = useState<Estoque>({});
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setEstoque(lerLocal('estoque', {}));
    setPronto(true);
  }, []);

  const movimentar = useCallback((mov: Omit<MovEstoque, 'em' | 'papel'>) => {
    setEstoque((atual) => {
      const k = mov.norm;
      const prev: ItemEstoque = atual[k] ?? {
        item: mov.item,
        unid: mov.unid,
        qtd: 0,
        minimo: 0,
        atualizadoEm: new Date().toISOString(),
      };
      const novoSaldo = Math.max(0, Math.round((prev.qtd + mov.delta) * 1000) / 1000);
      const novo: Estoque = {
        ...atual,
        [k]: { ...prev, item: mov.item || prev.item, unid: mov.unid || prev.unid, qtd: novoSaldo, atualizadoEm: new Date().toISOString() },
      };
      gravarLocal('estoque', novo);

      const log = lerLocal<MovEstoque[]>('estoqueMov', []);
      log.unshift({ ...mov, em: new Date().toISOString(), papel: papelAtual });
      gravarLocal('estoqueMov', log.slice(0, 600));

      registrarAuditoria({
        acao: mov.motivo === 'baixa' ? 'baixa de estoque' : 'movimentou estoque',
        alvo: mov.item,
        de: prev.qtd,
        para: novoSaldo,
      });
      return novo;
    });
  }, []);

  const definirMinimo = useCallback((norm: string, item: string, unid: string, minimo: number) => {
    setEstoque((atual) => {
      const prev = atual[norm] ?? { item, unid, qtd: 0, minimo: 0, atualizadoEm: new Date().toISOString() };
      const novo = { ...atual, [norm]: { ...prev, item, unid, minimo: Math.max(0, minimo), atualizadoEm: new Date().toISOString() } };
      gravarLocal('estoque', novo);
      return novo;
    });
  }, []);

  const definirSaldo = useCallback((norm: string, item: string, unid: string, saldo: number) => {
    setEstoque((atual) => {
      const prev = atual[norm];
      const anterior = prev?.qtd ?? 0;
      const novoSaldo = Math.max(0, saldo);
      const novo: Estoque = {
        ...atual,
        [norm]: { item, unid, qtd: novoSaldo, minimo: prev?.minimo ?? 0, atualizadoEm: new Date().toISOString() },
      };
      gravarLocal('estoque', novo);
      if (novoSaldo !== anterior) {
        registrarAuditoria({ acao: 'ajustou estoque', alvo: item, de: anterior, para: novoSaldo });
      }
      return novo;
    });
  }, []);

  return { estoque, pronto, movimentar, definirMinimo, definirSaldo };
}

export function useDesperdicio(semanaId: string) {
  const [registros, setRegistros] = useState<RegistroDesperdicio[]>([]);

  useEffect(() => {
    setRegistros(lerLocal('desperdicio.' + semanaId, []));
  }, [semanaId]);

  const adicionar = useCallback(
    (r: Omit<RegistroDesperdicio, 'id' | 'em'>) => {
      setRegistros((atual) => {
        const novo = [
          ...atual,
          { ...r, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, em: new Date().toISOString() },
        ];
        gravarLocal('desperdicio.' + semanaId, novo);
        registrarAuditoria({ acao: 'registrou desperdício', alvo: r.prato, para: Math.max(0, r.produzido - r.consumido), semana: semanaId });
        return novo;
      });
    },
    [semanaId],
  );

  const remover = useCallback(
    (id: string) => {
      setRegistros((atual) => {
        const novo = atual.filter((r) => r.id !== id);
        gravarLocal('desperdicio.' + semanaId, novo);
        return novo;
      });
    },
    [semanaId],
  );

  return { registros, adicionar, remover };
}

export function lerDesperdicio(semanaId: string): RegistroDesperdicio[] {
  return lerLocal('desperdicio.' + semanaId, []);
}

export function useAceitacao() {
  const [aceitacao, setAceitacao] = useState<Aceitacao>({});

  useEffect(() => {
    setAceitacao(lerLocal('aceitacao', {}));
  }, []);

  const avaliar = useCallback((prato: string, voto: 'bom' | 'ok' | 'ruim') => {
    const k = normalizar(prato);
    if (!k) return;
    const nota = voto === 'bom' ? 5 : voto === 'ok' ? 3 : 1;
    setAceitacao((atual) => {
      const prev: RegistroAceitacao = atual[k] ?? { prato, bom: 0, ok: 0, ruim: 0, somaNotas: 0, n: 0, atualizadoEm: '' };
      const novo: Aceitacao = {
        ...atual,
        [k]: {
          prato,
          bom: prev.bom + (voto === 'bom' ? 1 : 0),
          ok: prev.ok + (voto === 'ok' ? 1 : 0),
          ruim: prev.ruim + (voto === 'ruim' ? 1 : 0),
          somaNotas: prev.somaNotas + nota,
          n: prev.n + 1,
          atualizadoEm: new Date().toISOString(),
        },
      };
      gravarLocal('aceitacao', novo);
      return novo;
    });
  }, []);

  return { aceitacao, avaliar };
}

export function useEventos() {
  const [eventos, setEventos] = useState<EventoDemanda[]>([]);

  useEffect(() => {
    setEventos(lerLocal('eventos', []));
  }, []);

  const adicionar = useCallback((e: Omit<EventoDemanda, 'id'>) => {
    setEventos((atual) => {
      const novo = [...atual, { ...e, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
      gravarLocal('eventos', novo);
      return novo;
    });
  }, []);

  const remover = useCallback((id: string) => {
    setEventos((atual) => {
      const novo = atual.filter((e) => e.id !== id);
      gravarLocal('eventos', novo);
      return novo;
    });
  }, []);

  return { eventos, adicionar, remover };
}

export function lerEventos(): EventoDemanda[] {
  return lerLocal('eventos', []);
}

export function lerMediaRefeicoes(): Record<number, { f: number; n: number }> {
  return lerLocal('mediaRefeicoes', {});
}

export function useChefFeedback() {
  const [feedbacks, setFeedbacks] = useState<ChefFeedback[]>([]);

  useEffect(() => {
    setFeedbacks(lerLocal('chefFeedback', []));
  }, []);

  const registrar = useCallback((fb: Omit<ChefFeedback, 'id' | 'em'>) => {
    setFeedbacks((atual) => {
      const novo = [
        { ...fb, id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, em: new Date().toISOString() },
        ...atual,
      ].slice(0, 300);
      gravarLocal('chefFeedback', novo);
      return novo;
    });
  }, []);

  const vetados = new Set(
    feedbacks.filter((f) => f.voto === 'ruim').map((f) => f.hash),
  );

  return { feedbacks, registrar, vetados };
}
