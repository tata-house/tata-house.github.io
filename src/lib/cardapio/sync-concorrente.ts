import { serializarCanonico } from './sync-util';

const CHAVES = new Set([
  'precos', 'fornecedores', 'ofertas', 'itensExtras', 'estoque',
  'fornecedorPerfis', 'aceitacao', 'mediaRefeicoes', 'eventos',
  'acoesComprometidas', 'substituicoes', 'funcionarios',
  'contagemRefeicoes', 'chefFeedback', 'estoqueMov',
]);

export function ehChaveConcorrente(chave: string): boolean {
  return CHAVES.has(chave) || chave.startsWith('desperdicio.');
}

const AUSENTE = Symbol('ausente');
type TalvezAusente = unknown | typeof AUSENTE;

function igual(a: TalvezAusente, b: TalvezAusente): boolean {
  if (a === AUSENTE || b === AUSENTE) return a === b;
  return serializarCanonico(a) === serializarCanonico(b);
}

function objeto(v: TalvezAusente): v is Record<string, unknown> {
  return v !== AUSENTE && !!v && typeof v === 'object' && !Array.isArray(v);
}

function campoIdentidade(arrays: TalvezAusente[]): string | null {
  const candidatos = ['id', 'fornecedor', 'data', 'em'];
  const itens: unknown[] = [];
  for (const x of arrays) {
    if (!Array.isArray(x)) continue;
    for (let i = 0; i < x.length; i++) itens.push(x[i]);
  }
  if (itens.length === 0 || itens.some((x) => !x || typeof x !== 'object' || Array.isArray(x))) return null;
  for (const campo of candidatos) {
    if (itens.every((x) => typeof (x as Record<string, unknown>)[campo] === 'string')) return campo;
  }
  return null;
}

interface Interno { valor: TalvezAusente; conflitos: string[]; }

function mesclarNo(base: TalvezAusente, local: TalvezAusente, remoto: TalvezAusente, caminho: string): Interno {
  if (igual(local, remoto)) return { valor: local, conflitos: [] };
  if (igual(local, base)) return { valor: remoto, conflitos: [] };
  if (igual(remoto, base)) return { valor: local, conflitos: [] };

  if ((objeto(base) || base === AUSENTE) && (objeto(local) || local === AUSENTE) && (objeto(remoto) || remoto === AUSENTE)) {
    const b = objeto(base) ? base : {};
    const l = objeto(local) ? local : {};
    const r = objeto(remoto) ? remoto : {};
    const chaves = new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)]);
    const saida: Record<string, unknown> = {};
    const conflitos: string[] = [];
    for (const k of Array.from(chaves)) {
      const filho = mesclarNo(
        Object.prototype.hasOwnProperty.call(b, k) ? b[k] : AUSENTE,
        Object.prototype.hasOwnProperty.call(l, k) ? l[k] : AUSENTE,
        Object.prototype.hasOwnProperty.call(r, k) ? r[k] : AUSENTE,
        caminho ? caminho + '.' + k : k,
      );
      conflitos.push(...filho.conflitos);
      if (filho.valor !== AUSENTE) saida[k] = filho.valor;
    }
    return { valor: saida, conflitos };
  }

  if ((Array.isArray(base) || base === AUSENTE) && (Array.isArray(local) || local === AUSENTE) && (Array.isArray(remoto) || remoto === AUSENTE)) {
    const campo = campoIdentidade([base, local, remoto]);
    if (campo) {
      const bArr = Array.isArray(base) ? base : [];
      const lArr = Array.isArray(local) ? local : [];
      const rArr = Array.isArray(remoto) ? remoto : [];
      const indexar = (arr: unknown[]) => new Map(arr.map((x) => [String((x as Record<string, unknown>)[campo]), x]));
      const b = indexar(bArr), l = indexar(lArr), r = indexar(rArr);
      const ordem = Array.from(new Set(Array.from(l.keys()).concat(Array.from(r.keys()), Array.from(b.keys()))));
      const saida: unknown[] = [];
      const conflitos: string[] = [];
      for (const id of ordem) {
        const filho = mesclarNo(
          b.has(id) ? b.get(id) : AUSENTE,
          l.has(id) ? l.get(id) : AUSENTE,
          r.has(id) ? r.get(id) : AUSENTE,
          caminho + '[' + campo + '=' + id + ']',
        );
        conflitos.push(...filho.conflitos);
        if (filho.valor !== AUSENTE) saida.push(filho.valor);
      }
      return { valor: saida, conflitos };
    }
  }

  return { valor: local, conflitos: [caminho || '(raiz)'] };
}

export interface ResultadoMesclaConcorrente { valor: unknown; conflitos: string[]; }

function timestampEstoque(v: TalvezAusente): number {
  if (!objeto(v) || typeof v.atualizadoEm !== 'string') return Number.NEGATIVE_INFINITY;
  const t = Date.parse(v.atualizadoEm);
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

function semTimestampEstoque(v: TalvezAusente): TalvezAusente {
  if (!objeto(v)) return v;
  const { atualizadoEm: _ignorar, ...resto } = v;
  return resto;
}

function mesclarItemEstoque(
  base: TalvezAusente,
  local: TalvezAusente,
  remoto: TalvezAusente,
  caminho: string,
): Interno {
  if (igual(local, remoto)) return { valor: local, conflitos: [] };
  if (igual(local, base)) return { valor: remoto, conflitos: [] };
  if (igual(remoto, base)) return { valor: local, conflitos: [] };

  if (objeto(local) && objeto(remoto)) {
    const tl = timestampEstoque(local);
    const tr = timestampEstoque(remoto);
    const localMaisNovo = tl >= tr;
    // mesclarNo preserva o primeiro lado em folhas conflitantes. Colocamos
    // primeiro o item mais novo, mas ainda aproveitamos do outro lado todos
    // os campos que não conflitam.
    const semTs = mesclarNo(
      semTimestampEstoque(base),
      semTimestampEstoque(localMaisNovo ? local : remoto),
      semTimestampEstoque(localMaisNovo ? remoto : local),
      caminho,
    );
    const atualizadoEm = localMaisNovo ? local.atualizadoEm : remoto.atualizadoEm;

    if (semTs.conflitos.length === 0 && objeto(semTs.valor)) {
      return {
        valor: typeof atualizadoEm === 'string'
          ? { ...semTs.valor, atualizadoEm }
          : semTs.valor,
        conflitos: [],
      };
    }

    // Se o mesmo campo foi alterado nos dois aparelhos, o carimbo de atualização
    // resolve apenas as folhas conflitantes; alterações independentes continuam
    // combinadas no resultado.
    if (tl !== tr && objeto(semTs.valor) && (Number.isFinite(tl) || Number.isFinite(tr))) {
      return {
        valor: typeof atualizadoEm === 'string'
          ? { ...semTs.valor, atualizadoEm }
          : semTs.valor,
        conflitos: [],
      };
    }
  }

  return { valor: local, conflitos: [caminho || '(estoque)'] };
}

function ehMapaEstoque(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Estoque é um mapa de itens independentes. Um conflito em um produto não pode
 * bloquear todos os outros produtos. Cada item já carrega atualizadoEm, então
 * ele pode convergir por item mesmo após suspensão/reentrada de um aparelho.
 */
export function mesclarEstoqueConcorrenteSeguro(
  baseConhecida: boolean,
  base: unknown,
  local: unknown,
  remoto: unknown,
): ResultadoMesclaConcorrente {
  if (!ehMapaEstoque(local) || !ehMapaEstoque(remoto) || (baseConhecida && !ehMapaEstoque(base))) {
    return mesclarDocumentoConcorrenteSeguro(baseConhecida, base, local, remoto);
  }

  const b = baseConhecida && ehMapaEstoque(base) ? base : {};
  const chaves = new Set([...Object.keys(b), ...Object.keys(local), ...Object.keys(remoto)]);
  const saida: Record<string, unknown> = {};
  const conflitos: string[] = [];

  for (const chave of chaves) {
    const item = mesclarItemEstoque(
      Object.prototype.hasOwnProperty.call(b, chave) ? b[chave] : AUSENTE,
      Object.prototype.hasOwnProperty.call(local, chave) ? local[chave] : AUSENTE,
      Object.prototype.hasOwnProperty.call(remoto, chave) ? remoto[chave] : AUSENTE,
      chave,
    );
    conflitos.push(...item.conflitos);
    if (item.valor !== AUSENTE) saida[chave] = item.valor;
  }

  return { valor: saida, conflitos };
}


export function mesclarDocumentoConcorrente(base: unknown, local: unknown, remoto: unknown): ResultadoMesclaConcorrente {
  const r = mesclarNo(base, local, remoto, '');
  return { valor: r.valor === AUSENTE ? null : r.valor, conflitos: r.conflitos };
}

/** Fail-closed para payloads herdados sem ancestral conhecido.
 * Sem base nao existe 3-way merge honesto: se local e remoto divergem,
 * preservamos o local na outbox e bloqueamos o envio em vez de fingir que
 * o remoto era a base e sobrescrever outro aparelho. */
export function mesclarDocumentoConcorrenteSeguro(
  baseConhecida: boolean,
  base: unknown,
  local: unknown,
  remoto: unknown,
): ResultadoMesclaConcorrente {
  if (!baseConhecida) {
    if (serializarCanonico(local) === serializarCanonico(remoto)) {
      return { valor: local, conflitos: [] };
    }
    return { valor: local, conflitos: ['(base-desconhecida)'] };
  }
  return mesclarDocumentoConcorrente(base, local, remoto);
}

export interface BaseConcorrenteSelecionada {
  conhecida: boolean;
  valor: unknown;
}

/** A base confirmada da sessão vence a base persistida da outbox.
 * A persistida só é usada após cold-start/reentrada, quando ainda não há
 * ancestral comum em memória. */
export function selecionarBaseConcorrente(
  temBaseAtual: boolean,
  baseAtual: unknown,
  basePersistida: unknown,
): BaseConcorrenteSelecionada {
  if (temBaseAtual) return { conhecida: true, valor: baseAtual };
  if (basePersistida !== undefined) return { conhecida: true, valor: basePersistida };
  return { conhecida: false, valor: undefined };
}