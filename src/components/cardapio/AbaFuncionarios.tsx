'use client';

import { useState } from 'react';
import { Botao, Cartao, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { normalizar } from '@/lib/cardapio/motor';
import { extrairRestricoesDaConversa } from '@/lib/cardapio/ia-cliente';
import type { DiaCardapio, Funcionario, RestricaoAlimentar, TipoRestricao, TurnoFuncionario } from '@/lib/cardapio/tipos';

const TURNO_ROTULO: Record<TurnoFuncionario, string> = {
  almoco: 'Almoço',
  jantar: 'Jantar',
  ambos: 'Almoço e Jantar',
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

const RESTRICAO_EMOJI: Record<TipoRestricao, string> = {
  alergia: '⚠️',
  preferencia: '🚫',
  religioso: '✡️',
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
          conflitos.push({
            diaIdx,
            funcionario: f.nome,
            setor: f.setor,
            tipo: r.tipo,
            alimento: r.alimento,
            prato: pratoConflito,
          });
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
}: {
  inicial?: Partial<Funcionario>;
  aoSalvar: (f: Omit<Funcionario, 'id' | 'criadoEm'>) => void;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [setor, setSetor] = useState(inicial?.setor ?? '');
  const [turno, setTurno] = useState<TurnoFuncionario>(inicial?.turno ?? 'almoco');
  const [restricoes, setRestricoes] = useState<RestricaoAlimentar[]>(inicial?.restricoes ?? []);
  const [novoAlimento, setNovoAlimento] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoRestricao>('alergia');
  const [novaObs, setNovaObs] = useState('');

  const adicionarRestricao = () => {
    const a = novoAlimento.trim();
    if (!a) return;
    setRestricoes((prev) => [...prev, { tipo: novoTipo, alimento: a, obs: novaObs.trim() || undefined }]);
    setNovoAlimento('');
    setNovaObs('');
  };

  const handleSalvar = () => {
    if (!nome.trim()) return;
    aoSalvar({
      nome: nome.trim(),
      setor: setor.trim(),
      turno,
      restricoes,
      ativo: inicial?.ativo ?? true,
    });
    aoFechar();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={estiloRotulo}>Nome</label>
        <input
          className={estiloInput}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do funcionário"
        />
      </div>
      <div>
        <label className={estiloRotulo}>Setor</label>
        <input
          className={estiloInput}
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
          placeholder="Bar, Cozinha, Salão…"
        />
      </div>
      <div>
        <label className={estiloRotulo}>Turno</label>
        <div className="flex gap-2">
          {(['almoco', 'jantar', 'ambos'] as TurnoFuncionario[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTurno(t)}
              className={`flex-1 rounded-2xl border py-2.5 text-sm font-semibold transition ${
                turno === t
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'border-carvao-200 text-carvao-500 hover:border-carvao-400 dark:border-carvao-600 dark:text-carvao-400'
              }`}
            >
              {TURNO_ROTULO[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className={estiloRotulo}>Restrições alimentares</p>
        {restricoes.length > 0 && (
          <div className="space-y-1.5">
            {restricoes.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-carvao-50 px-3 py-2 dark:bg-carvao-800">
                <span className={`rounded px-1.5 py-0.5 text-micro font-bold uppercase ${RESTRICAO_COR[r.tipo]}`}>
                  {RESTRICAO_EMOJI[r.tipo]} {RESTRICAO_ROTULO[r.tipo]}
                </span>
                <span className="flex-1 text-sm font-semibold capitalize text-carvao-800 dark:text-areia-100">
                  {r.alimento}
                </span>
                {r.obs && <span className="text-xs text-carvao-400">{r.obs}</span>}
                <button
                  type="button"
                  onClick={() => setRestricoes((prev) => prev.filter((_, j) => j !== i))}
                  className="text-carvao-400 hover:text-red-500"
                >
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
            className="min-h-12 rounded-2xl border border-carvao-200 bg-white px-3 text-sm text-carvao-800 dark:border-carvao-600 dark:bg-carvao-900 dark:text-areia-100"
          >
            <option value="alergia">⚠️ Alergia</option>
            <option value="preferencia">🚫 Preferência</option>
            <option value="religioso">✡️ Religioso</option>
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
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-carvao-700 dark:text-brand-300"
          >
            <Icone nome="somar" tam={18} />
          </button>
        </div>
        <input
          className={`${estiloInput} text-sm`}
          value={novaObs}
          onChange={(e) => setNovaObs(e.target.value)}
          placeholder="Observação (opcional)"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Botao variante="secundario" className="flex-1" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao className="flex-1" onClick={handleSalvar} disabled={!nome.trim()}>
          Salvar
        </Botao>
      </div>
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
  const [confirmRemover, setConfirmRemover] = useState<string | null>(null);
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
    const turno: TurnoFuncionario = TURNOS_VALIDOS.includes(e.turno as TurnoFuncionario)
      ? (e.turno as TurnoFuncionario)
      : 'almoco';
    const restricoes: RestricaoAlimentar[] = e.restricoes
      .filter((r) => TIPOS_VALIDOS.includes(r.tipo as TipoRestricao))
      .map((r) => ({
        tipo: r.tipo as TipoRestricao,
        alimento: r.alimento,
        ...(r.obs ? { obs: r.obs } : {}),
      }));
    onSalvar({ nome: e.nome, setor: e.setor ?? '', turno, restricoes, ativo: true });
    setImportadosIdx((prev) => new Set(prev).add(idx));
  };

  const importarTodos = () => {
    extraidos.forEach((_, idx) => importarExtraido(idx));
  };

  const conflitos = detectarConflitos(funcionarios, dias);
  const ativos = funcionarios.filter((f) => f.ativo);
  const inativos = funcionarios.filter((f) => !f.ativo);

  const abrirEditar = (f: Funcionario) => {
    setEditando(f);
    setModalAberto(true);
  };

  const handleSalvarEdicao = (dados: Omit<Funcionario, 'id' | 'criadoEm'>) => {
    if (editando) {
      onAtualizar(editando.id, dados);
    } else {
      onSalvar(dados);
    }
    setEditando(null);
    setModalAberto(false);
  };

  return (
    <div className="space-y-5">
      <Modal
        titulo={editando ? 'Editar funcionário' : 'Novo funcionário'}
        aberto={modalAberto}
        aoFechar={() => { setModalAberto(false); setEditando(null); }}
      >
        <FormFuncionario
          inicial={editando ?? undefined}
          aoSalvar={handleSalvarEdicao}
          aoFechar={() => { setModalAberto(false); setEditando(null); }}
        />
      </Modal>

      {/* Alertas de conflito */}
      {conflitos.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/30">
          <p className="mb-3 text-sm font-bold text-red-700 dark:text-red-400">
            ⚠️ {conflitos.length} conflito{conflitos.length > 1 ? 's' : ''} detectado{conflitos.length > 1 ? 's' : ''} nesta semana
          </p>
          <div className="space-y-2">
            {conflitos.map((c, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-carvao-900">
                <span className="mt-0.5 text-base">{RESTRICAO_EMOJI[c.tipo]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-carvao-800 dark:text-areia-100">
                    {c.funcionario}
                    <span className="ml-1 text-xs font-normal text-carvao-400">[{c.setor}]</span>
                  </p>
                  <p className="text-xs text-carvao-500">
                    {DIAS_PT[c.diaIdx]} · {RESTRICAO_ROTULO[c.tipo].toLowerCase()} de <strong>{c.alimento}</strong> → {c.prato}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-carvao-50 p-3 text-center dark:bg-carvao-800">
          <p className="text-2xl font-bold text-carvao-900 dark:text-white">{ativos.length}</p>
          <p className="text-xs text-carvao-400">Ativos</p>
        </div>
        <div className="rounded-2xl bg-carvao-50 p-3 text-center dark:bg-carvao-800">
          <p className="text-2xl font-bold text-carvao-900 dark:text-white">
            {funcionarios.reduce((n, f) => n + f.restricoes.length, 0)}
          </p>
          <p className="text-xs text-carvao-400">Restrições</p>
        </div>
        <div className={`rounded-2xl p-3 text-center ${conflitos.length > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-carvao-50 dark:bg-carvao-800'}`}>
          <p className={`text-2xl font-bold ${conflitos.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-carvao-900 dark:text-white'}`}>
            {conflitos.length}
          </p>
          <p className="text-xs text-carvao-400">Conflitos</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Botao onClick={() => { setEditando(null); setModalAberto(true); }} className="flex-1">
          <Icone nome="somar" tam={18} /> Adicionar funcionário
        </Botao>
        <button
          onClick={() => setImportAberto((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl border border-carvao-200 px-3 py-2.5 text-sm font-semibold text-carvao-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-carvao-600 dark:text-carvao-400"
          title="Importar restrições a partir de conversa"
        >
          <span className="text-base">💬</span>
          <span className="hidden sm:inline">Importar da conversa</span>
        </button>
      </div>

      {importAberto && (
        <Cartao className="space-y-3">
          <p className="text-sm font-bold text-carvao-700 dark:text-areia-100">
            💬 Importar restrições via conversa
          </p>
          <p className="text-xs text-carvao-400">
            Cole abaixo uma conversa do WhatsApp (ou qualquer texto) onde restrições alimentares de funcionários são mencionadas. O Gemini extrai os nomes e restrições automaticamente.
          </p>
          {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
              ⚠️ Configure <code>NEXT_PUBLIC_GEMINI_API_KEY</code> para habilitar a extração por IA.
            </p>
          )}
          <textarea
            rows={6}
            value={textoConversa}
            onChange={(e) => setTextoConversa(e.target.value)}
            placeholder={'Ex.:\nJoão não come frango por questão religiosa\nMaria tem alergia a glúten (celíaca)\n[12/05] Carlos: O Pedro evita carne de porco\nAna Silva - intolerante à lactose'}
            className="w-full rounded-2xl border border-carvao-200 bg-white px-4 py-3 text-xs leading-relaxed dark:border-carvao-600 dark:bg-carvao-900"
          />
          <Botao
            onClick={extrairDaConversa}
            disabled={extraindo || !textoConversa.trim()}
            className="w-full"
          >
            {extraindo ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extraindo…
              </span>
            ) : (
              '✨ Extrair com IA'
            )}
          </Botao>

          {extraidos.length === 0 && !extraindo && textoConversa.trim() && (
            <p className="text-center text-xs text-carvao-400">
              Nenhuma restrição encontrada. Tente incluir mais contexto na conversa.
            </p>
          )}

          {extraidos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-carvao-500">
                  {extraidos.length} funcionário(s) encontrado(s)
                </p>
                <button
                  onClick={importarTodos}
                  className="rounded-full bg-brand-600 px-3 py-1.5 text-caption font-bold text-white hover:bg-brand-700"
                >
                  Importar todos
                </button>
              </div>
              {extraidos.map((e, idx) => {
                const feito = importadosIdx.has(idx);
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${feito ? 'border-brand-200 bg-brand-50 dark:border-brand-800/40 dark:bg-brand-950/20' : 'border-carvao-100 dark:border-carvao-700'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-carvao-800 dark:text-areia-100">
                        {e.nome}
                        {e.setor && <span className="ml-1.5 text-xs font-normal text-carvao-400">[{e.setor}]</span>}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.restricoes.map((r, ri) => (
                          <span key={ri} className={`rounded-full px-2 py-0.5 text-micro font-semibold ${RESTRICAO_COR[r.tipo as TipoRestricao] ?? 'bg-carvao-100 text-carvao-600'}`}>
                            {RESTRICAO_EMOJI[r.tipo as TipoRestricao] ?? '🚫'} {r.alimento}
                          </span>
                        ))}
                        {e.restricoes.length === 0 && (
                          <span className="text-xs text-carvao-400">sem restrições identificadas</span>
                        )}
                      </div>
                    </div>
                    {feito ? (
                      <span className="shrink-0 text-xs font-bold text-brand-600">✓ Importado</span>
                    ) : (
                      <button
                        onClick={() => importarExtraido(idx)}
                        className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-caption font-bold text-brand-700 hover:bg-brand-100 dark:bg-carvao-700 dark:text-brand-300"
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Cartao>
      )}

      {funcionarios.length === 0 && (
        <div className="rounded-2xl bg-carvao-50 py-10 text-center dark:bg-carvao-800/50">
          <p className="text-4xl">👥</p>
          <p className="mt-2 text-sm font-semibold text-carvao-500">
            Nenhum funcionário cadastrado
          </p>
          <p className="mt-1 text-xs text-carvao-400">
            Cadastre a equipe para detectar conflitos automáticos no cardápio
          </p>
        </div>
      )}

      {/* Lista ativos */}
      {ativos.length > 0 && (
        <div className="space-y-2">
          {ativos.map((f) => (
            <Cartao key={f.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-carvao-900 dark:text-white">{f.nome}</p>
                    <span className="rounded bg-carvao-100 px-1.5 py-0.5 text-micro font-bold text-carvao-500 dark:bg-carvao-700 dark:text-carvao-300">
                      {f.setor}
                    </span>
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-micro font-bold text-brand-600 dark:bg-carvao-700 dark:text-brand-400">
                      {TURNO_ROTULO[f.turno]}
                    </span>
                  </div>
                  {f.restricoes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {f.restricoes.map((r, i) => (
                        <span key={i} className={`rounded-full px-2 py-0.5 text-caption font-semibold ${RESTRICAO_COR[r.tipo]}`}>
                          {RESTRICAO_EMOJI[r.tipo]} {r.alimento}
                          {r.obs && ` · ${r.obs}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-carvao-400">Sem restrições</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => abrirEditar(f)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-carvao-400 hover:bg-carvao-100 hover:text-carvao-700 dark:hover:bg-carvao-700"
                  >
                    <Icone nome="ajustes" tam={15} />
                  </button>
                  <button
                    onClick={() => onAtualizar(f.id, { ativo: false })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-carvao-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30"
                    title="Desativar"
                  >
                    <Icone nome="subtrair" tam={15} />
                  </button>
                  {confirmRemover === f.id ? (
                    <button
                      onClick={() => { onRemover(f.id); setConfirmRemover(null); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      <Icone nome="check" tam={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmRemover(f.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-carvao-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                    >
                      <Icone nome="fechar" tam={15} />
                    </button>
                  )}
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      )}

      {/* Inativos */}
      {inativos.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-xs font-bold uppercase tracking-widest text-carvao-400 hover:text-carvao-600">
            {inativos.length} inativo{inativos.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-3 space-y-2">
            {inativos.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-2xl border border-carvao-100 bg-carvao-50 px-4 py-3 opacity-60 dark:border-carvao-700 dark:bg-carvao-800">
                <span className="text-sm font-semibold text-carvao-600 dark:text-carvao-300 line-through">{f.nome}</span>
                <button
                  onClick={() => onAtualizar(f.id, { ativo: true })}
                  className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
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
