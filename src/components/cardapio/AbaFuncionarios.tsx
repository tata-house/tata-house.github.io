'use client';

import { useState } from 'react';
import { Botao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { normalizar } from '@/lib/cardapio/motor';
import { extrairRestricoesDaConversa } from '@/lib/cardapio/ia-cliente';
import type { DiaCardapio, Funcionario, RestricaoAlimentar, TipoRestricao, TurnoFuncionario } from '@/lib/cardapio/tipos';

const TURNO_ROTULO: Record<TurnoFuncionario, string> = {
  almoco: 'Almoço',
  jantar: 'Jantar',
  ambos: 'Alm. e Jantar',
};

const RESTRICAO_DOT: Record<TipoRestricao, string> = {
  alergia: 'bg-red-500',
  preferencia: 'bg-amber-500',
  religioso: 'bg-blue-500',
};

const RESTRICAO_COR: Record<TipoRestricao, string> = {
  alergia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  preferencia: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  religioso: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const RESTRICAO_ROTULO: Record<TipoRestricao, string> = {
  alergia: 'Alergia',
  preferencia: 'Preferência',
  religioso: 'Restrição religiosa',
};

function detectarConflitos(funcionarios: Funcionario[], dias: DiaCardapio[]): {
  diaIdx: number;
  funcionario: string;
  setor: string;
  tipo: TipoRestricao;
  alimento: string;
  prato: string;
}[] {
  const conflitos: ReturnType<typeof detectarConflitos> = [];
  const ativos = funcionarios.filter((f) => f.ativo && f.restricoes.length > 0);
  dias.forEach((dia, diaIdx) => {
    const pratos = [dia.principal, dia.guarnicaoFixa, dia.guarnicao, dia.salada, dia.sobremesa].filter(Boolean);
    ativos.forEach((f) => {
      f.restricoes.forEach((r) => {
        const normAlimento = normalizar(r.alimento);
        const pratoConflito = pratos.find((p) => normalizar(p).includes(normAlimento));
        if (pratoConflito) {
          conflitos.push({ diaIdx, funcionario: f.nome, setor: f.setor, tipo: r.tipo, alimento: r.alimento, prato: pratoConflito });
        }
      });
    });
  });
  return conflitos;
}

const DIAS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function FormFuncionario({
  inicial,
  aoSalvar,
  aoFechar,
  onDesativar,
  onRemover,
}: {
  inicial?: Partial<Funcionario>;
  aoSalvar: (f: Omit<Funcionario, 'id' | 'criadoEm'>) => void;
  aoFechar: () => void;
  onDesativar?: () => void;
  onRemover?: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [setor, setSetor] = useState(inicial?.setor ?? '');
  const [turno, setTurno] = useState<TurnoFuncionario>(inicial?.turno ?? 'almoco');
  const [restricoes, setRestricoes] = useState<RestricaoAlimentar[]>(inicial?.restricoes ?? []);
  const [novoAlimento, setNovoAlimento] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoRestricao>('alergia');
  const [novaObs, setNovaObs] = useState('');
  const [confirmRemover, setConfirmRemover] = useState(false);

  const adicionarRestricao = () => {
    const a = novoAlimento.trim();
    if (!a) return;
    setRestricoes((prev) => [...prev, { tipo: novoTipo, alimento: a, obs: novaObs.trim() || undefined }]);
    setNovoAlimento('');
    setNovaObs('');
  };

  const handleSalvar = () => {
    if (!nome.trim()) return;
    aoSalvar({ nome: nome.trim(), setor: setor.trim(), turno, restricoes, ativo: inicial?.ativo ?? true });
    aoFechar();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={estiloRotulo}>Nome</label>
          <input autoFocus className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
        </div>
        <div>
          <label className={estiloRotulo}>Setor</label>
          <input className={estiloInput} value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Cozinha, Salão…" />
        </div>
      </div>

      <div>
        <label className={estiloRotulo}>Turno</label>
        <div className="flex gap-2">
          {(['almoco', 'jantar', 'ambos'] as TurnoFuncionario[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTurno(t)}
              className={`flex-1 rounded-2xl border py-2 text-sm font-semibold transition ${
                turno === t
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'border-carvao-200 text-carvao-500 hover:border-carvao-400 dark:border-carvao-600 dark:text-texto-suave'
              }`}
            >
              {TURNO_ROTULO[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className={estiloRotulo}>Restrições alimentares</p>
        {restricoes.length > 0 && (
          <div className="space-y-1.5">
            {restricoes.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-carvao-50 px-3 py-2 dark:bg-carvao-800">
                <span className={`h-2 w-2 shrink-0 rounded-full ${RESTRICAO_DOT[r.tipo]}`} />
                <span className="flex-1 text-sm font-semibold capitalize text-carvao-800 dark:text-areia-100">{r.alimento}</span>
                <span className="text-xs text-texto-suave">{RESTRICAO_ROTULO[r.tipo]}</span>
                {r.obs && <span className="text-xs text-texto-suave">· {r.obs}</span>}
                <button type="button" onClick={() => setRestricoes((prev) => prev.filter((_, j) => j !== i))} className="text-texto-suave hover:text-red-500">
                  <Icone nome="fechar" tam={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <select
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value as TipoRestricao)}
            className="min-h-11 rounded-2xl border border-carvao-200 bg-white px-3 text-sm text-carvao-800 dark:border-carvao-600 dark:bg-carvao-900 dark:text-areia-100"
          >
            <option value="alergia">Alergia</option>
            <option value="preferencia">Preferência</option>
            <option value="religioso">Religioso</option>
          </select>
          <input
            className={`${estiloInput} flex-1`}
            value={novoAlimento}
            onChange={(e) => setNovoAlimento(e.target.value)}
            placeholder="Alimento (ex: frango, glúten…)"
            onKeyDown={(e) => e.key === 'Enter' && adicionarRestricao()}
          />
          <button
            type="button"
            onClick={adicionarRestricao}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-carvao-700 dark:text-brand-300"
          >
            <Icone nome="somar" tam={18} />
          </button>
        </div>
        {(restricoes.length > 0 || novoAlimento) && (
          <input className={`${estiloInput} text-sm`} value={novaObs} onChange={(e) => setNovaObs(e.target.value)} placeholder="Observação (opcional)" />
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Botao variante="secundario" className="flex-1" onClick={aoFechar}>Cancelar</Botao>
        <Botao className="flex-1" onClick={handleSalvar} disabled={!nome.trim()}>Salvar</Botao>
      </div>

      {(onDesativar || onRemover) && (
        <div className="flex items-center justify-center gap-5 border-t border-carvao-100 pt-3 dark:border-carvao-700">
          {onDesativar && (
            <button onClick={() => { onDesativar(); aoFechar(); }} className="text-xs font-semibold text-texto-suave hover:text-ouro-600">
              Desativar
            </button>
          )}
          {onRemover && (
            confirmRemover ? (
              <button onClick={() => { onRemover(); aoFechar(); }} className="text-xs font-bold text-red-600">
                Confirmar remoção
              </button>
            ) : (
              <button onClick={() => setConfirmRemover(true)} className="text-xs font-semibold text-texto-suave hover:text-red-500">
                Remover
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function AbaFuncionarios({
  funcionarios,
  dias,
  onSalvar,
  onAtualizar,
  onRemover,
}: {
  funcionarios: Funcionario[];
  dias: DiaCardapio[];
  onSalvar: (f: Omit<Funcionario, 'id' | 'criadoEm'>) => void;
  onAtualizar: (id: string, f: Partial<Funcionario>) => void;
  onRemover: (id: string) => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [importAberto, setImportAberto] = useState(false);
  const [textoConversa, setTextoConversa] = useState('');
  const [extraindo, setExtraindo] = useState(false);
  const [extraidos, setExtraidos] = useState<{ nome: string; setor: string | null; turno: string; restricoes: { tipo: string; alimento: string; obs: string | null }[] }[]>([]);
  const [importadosIdx, setImportadosIdx] = useState<Set<number>>(new Set());

  const TURNOS_VALIDOS: TurnoFuncionario[] = ['almoco', 'jantar', 'ambos'];
  const TIPOS_VALIDOS: TipoRestricao[] = ['alergia', 'preferencia', 'religioso'];

  const extrairDaConversa = async () => {
    if (!textoConversa.trim()) return;
    setExtraindo(true);
    setExtraidos([]);
    setImportadosIdx(new Set());
    const resultado = await extrairRestricoesDaConversa(textoConversa);
    setExtraidos(resultado);
    setExtraindo(false);
  };

  const importarExtraido = (idx: number) => {
    const e = extraidos[idx];
    if (!e || importadosIdx.has(idx)) return;
    const turno: TurnoFuncionario = TURNOS_VALIDOS.includes(e.turno as TurnoFuncionario) ? (e.turno as TurnoFuncionario) : 'almoco';
    const restricoes: RestricaoAlimentar[] = e.restricoes
      .filter((r) => TIPOS_VALIDOS.includes(r.tipo as TipoRestricao))
      .map((r) => ({ tipo: r.tipo as TipoRestricao, alimento: r.alimento, ...(r.obs ? { obs: r.obs } : {}) }));
    onSalvar({ nome: e.nome, setor: e.setor ?? '', turno, restricoes, ativo: true });
    setImportadosIdx((prev) => new Set(prev).add(idx));
  };

  const importarTodos = () => extraidos.forEach((_, idx) => importarExtraido(idx));

  const conflitos = detectarConflitos(funcionarios, dias);
  const ativos = funcionarios.filter((f) => f.ativo);
  const inativos = funcionarios.filter((f) => !f.ativo);

  const abrirEditar = (f: Funcionario) => { setEditando(f); setModalAberto(true); };

  const handleSalvarEdicao = (dados: Omit<Funcionario, 'id' | 'criadoEm'>) => {
    if (editando) onAtualizar(editando.id, dados);
    else onSalvar(dados);
    setEditando(null);
    setModalAberto(false);
  };

  const totalRestricoes = funcionarios.reduce((n, f) => n + f.restricoes.length, 0);

  return (
    <div className="space-y-5">
      <Modal
        titulo={editando ? `Editar — ${editando.nome}` : 'Novo integrante'}
        aberto={modalAberto}
        aoFechar={() => { setModalAberto(false); setEditando(null); }}
      >
        <FormFuncionario
          inicial={editando ?? undefined}
          aoSalvar={handleSalvarEdicao}
          aoFechar={() => { setModalAberto(false); setEditando(null); }}
          onDesativar={editando ? () => onAtualizar(editando.id, { ativo: false }) : undefined}
          onRemover={editando ? () => onRemover(editando.id) : undefined}
        />
      </Modal>

      {/* Painel de conflitos — compacto, sem cards aninhados */}
      {conflitos.length > 0 && (
        <div className="rounded-2xl bg-red-50/80 px-4 py-3 ring-1 ring-red-200 dark:bg-red-950/20 dark:ring-red-800/40">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
            ▲ {conflitos.length} conflito{conflitos.length > 1 ? 's' : ''} nesta semana
          </p>
          <ul className="space-y-1">
            {conflitos.map((c, i) => (
              <li key={i} className="text-xs text-red-700 dark:text-red-300">
                <span className="font-semibold">{c.funcionario}</span>
                <span className="mx-1.5 text-red-300">·</span>
                {DIAS_PT[c.diaIdx]}
                <span className="mx-1.5 text-red-300">·</span>
                {RESTRICAO_ROTULO[c.tipo].toLowerCase()} de <span className="font-semibold">{c.alimento}</span>
                <span className="mx-1.5 text-red-300">→</span>
                {c.prato}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats inline + ações */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>
            <strong className="font-bold text-carvao-900 dark:text-white">{ativos.length}</strong>
            <span className="ml-1 text-texto-suave">ativo{ativos.length !== 1 ? 's' : ''}</span>
          </span>
          {totalRestricoes > 0 && (
            <span>
              <strong className="font-bold text-carvao-900 dark:text-white">{totalRestricoes}</strong>
              <span className="ml-1 text-texto-suave">restrição{totalRestricoes !== 1 ? 'ões' : ''}</span>
            </span>
          )}
          {conflitos.length > 0 && (
            <span>
              <strong className="font-bold text-perigo">{conflitos.length}</strong>
              <span className="ml-1 text-texto-suave">conflito{conflitos.length !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setImportAberto((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              importAberto
                ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-carvao-800 dark:text-brand-300'
                : 'border-carvao-200 text-carvao-500 hover:border-brand-400 hover:text-brand-600 dark:border-carvao-600 dark:text-texto-suave'
            }`}
            title="Importar restrições de conversa"
          >
            <Icone nome="raio" tam={14} />
            <span className="hidden sm:inline">IA</span>
          </button>
          <Botao onClick={() => { setEditando(null); setModalAberto(true); }} className="!min-h-[36px] !px-4 !py-2 text-sm">
            <Icone nome="somar" tam={16} /> Novo
          </Botao>
        </div>
      </div>

      {/* Painel de importação por IA */}
      {importAberto && (
        <div className="space-y-3 rounded-2xl bg-carvao-50 p-4 dark:bg-carvao-800/40">
          <div className="space-y-1">
            <p className="text-sm font-bold text-carvao-700 dark:text-areia-100">Importar via conversa</p>
            <p className="text-xs text-texto-suave">
              Cole um texto do WhatsApp — o Gemini extrai nomes e restrições automaticamente.
            </p>
          </div>
          {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
              Configure <code>NEXT_PUBLIC_GEMINI_API_KEY</code> para habilitar a extração por IA.
            </p>
          )}
          <textarea
            rows={5}
            value={textoConversa}
            onChange={(e) => setTextoConversa(e.target.value)}
            placeholder={'Ex.:\nJoão não come frango por questão religiosa\nMaria tem alergia a glúten (celíaca)'}
            className="w-full rounded-2xl border border-carvao-200 bg-white px-4 py-3 text-xs leading-relaxed dark:border-carvao-600 dark:bg-carvao-900"
          />
          <Botao onClick={extrairDaConversa} disabled={extraindo || !textoConversa.trim()} className="w-full">
            {extraindo ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extraindo…
              </span>
            ) : 'Extrair com IA'}
          </Botao>

          {extraidos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-carvao-500">{extraidos.length} encontrado(s)</p>
                <button onClick={importarTodos} className="rounded-full bg-brand-600 px-3 py-1.5 text-caption font-bold text-white hover:bg-brand-700">
                  Importar todos
                </button>
              </div>
              {extraidos.map((e, idx) => {
                const feito = importadosIdx.has(idx);
                return (
                  <div key={idx} className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${feito ? 'border-brand-200 bg-brand-50 dark:border-brand-800/40 dark:bg-brand-950/20' : 'border-carvao-100 dark:border-carvao-700'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-carvao-800 dark:text-areia-100">
                        {e.nome}
                        {e.setor && <span className="ml-1.5 text-xs font-normal text-texto-suave">[{e.setor}]</span>}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.restricoes.map((r, ri) => (
                          <span key={ri} className={`rounded-full px-2 py-0.5 text-micro font-semibold ${RESTRICAO_COR[r.tipo as TipoRestricao] ?? 'bg-carvao-100 text-carvao-600'}`}>
                            {r.alimento}
                          </span>
                        ))}
                        {e.restricoes.length === 0 && <span className="text-xs text-texto-suave">sem restrições identificadas</span>}
                      </div>
                    </div>
                    {feito ? (
                      <span className="shrink-0 text-xs font-bold text-brand-600">✓ Importado</span>
                    ) : (
                      <button onClick={() => importarExtraido(idx)} className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-caption font-bold text-brand-700 hover:bg-brand-100 dark:bg-carvao-700 dark:text-brand-300">
                        Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {funcionarios.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-carvao-500">Nenhum integrante cadastrado</p>
          <p className="mt-1 text-xs text-texto-suave">Cadastre a equipe para detectar conflitos no cardápio automaticamente.</p>
        </div>
      )}

      {/* Lista de ativos — sem Cartao por pessoa */}
      {ativos.length > 0 && (
        <ul className="overflow-hidden rounded-2xl bg-white divide-y divide-carvao-100 dark:divide-carvao-700/50 dark:bg-carvao-850 dark:ring-1 dark:ring-carvao-700/60">
          {ativos.map((f) => {
            const temConflito = conflitos.some((c) => c.funcionario === f.nome);
            return (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {temConflito && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-perigo" />}
                    <p className="font-bold text-carvao-900 dark:text-white">{f.nome}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-texto-suave">
                    {f.setor ? `${f.setor} · ` : ''}{TURNO_ROTULO[f.turno]}
                  </p>
                  {f.restricoes.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {f.restricoes.map((r, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs text-carvao-500 dark:text-texto-suave">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${RESTRICAO_DOT[r.tipo]}`} />
                          {r.alimento}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-carvao-300 dark:text-carvao-600">sem restrições</p>
                  )}
                </div>
                <button
                  onClick={() => abrirEditar(f)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-carvao-300 transition hover:bg-carvao-100 hover:text-carvao-600 dark:hover:bg-carvao-700"
                  title="Editar"
                >
                  <Icone nome="ajustes" tam={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Inativos — recolhidos */}
      {inativos.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-xs font-bold uppercase tracking-widest text-texto-suave hover:text-carvao-600">
            {inativos.length} inativo{inativos.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-px">
            {inativos.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-1 py-2 opacity-50">
                <span className="text-sm font-semibold text-carvao-600 dark:text-carvao-300">{f.nome}</span>
                <button onClick={() => onAtualizar(f.id, { ativo: true })} className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
