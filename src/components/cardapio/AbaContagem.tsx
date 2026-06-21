'use client';

import { useMemo, useState } from 'react';
import { Cartao, Kpi, estiloInput, estiloRotulo, Botao } from '@/components/ui';
import { DIAS_SEMANA, formatarReais, linhasDoDia } from '@/lib/cardapio/motor';
import type { ContagemRefeicoesDia, EstadoSemana, Papel } from '@/lib/cardapio/tipos';

const DIAS_ABREV = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function semanaAtual(): string[] {
  const agora = new Date();
  const diaSem = (agora.getDay() + 6) % 7;
  const segunda = new Date(agora);
  segunda.setDate(agora.getDate() - diaSem);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

function displayData(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function diaSemDaData(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return DIAS_ABREV[((new Date(y, m - 1, d).getDay() + 6) % 7)];
}

function mediasPorDiaSemana(contagens: ContagemRefeicoesDia[]): Record<number, { almoco: number; jantar: number; marmitas: number; n: number }> {
  const acc: Record<number, { almoco: number; jantar: number; marmitas: number; n: number }> = {};
  contagens.forEach((c) => {
    const [y, m, d] = c.data.split('-').map(Number);
    const ds = (new Date(y, m - 1, d).getDay() + 6) % 7;
    if (!acc[ds]) acc[ds] = { almoco: 0, jantar: 0, marmitas: 0, n: 0 };
    acc[ds].almoco += c.almoco;
    acc[ds].jantar += c.jantar;
    acc[ds].marmitas += c.marmitas;
    acc[ds].n += 1;
  });
  Object.values(acc).forEach((v) => {
    v.almoco = Math.round(v.almoco / v.n);
    v.jantar = Math.round(v.jantar / v.n);
    v.marmitas = Math.round(v.marmitas / v.n);
  });
  return acc;
}

function MiniBar({ valor, max, cor }: { valor: number; max: number; cor: string }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-carvao-100 dark:bg-carvao-700">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const DATAS_SEMANA = semanaAtual();
const DATA_HOJE = hoje();
const DIA_HOJE_IDX = DATAS_SEMANA.indexOf(DATA_HOJE);

export function AbaContagem({
  contagens,
  onRegistrar,
  estado,
  atualizar,
  precos = {},
  fatores,
  papel = 'gestor',
}: {
  contagens: ContagemRefeicoesDia[];
  onRegistrar: (c: Omit<ContagemRefeicoesDia, 'registradoEm'>) => void;
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  precos?: Record<string, number>;
  fatores?: Record<string, number>;
  papel?: Papel;
}) {
  const podeContar = papel === 'cozinha' || papel === 'gestor' || papel === 'administrador';

  /* ── Dia activo (padrão: hoje se na semana, senão segunda) ─────────── */
  const [diaAtivo, setDiaAtivo] = useState(DIA_HOJE_IDX >= 0 ? DIA_HOJE_IDX : 0);

  /* ── Formulário do dia activo ──────────────────────────────────────── */
  const [almoco, setAlmoco] = useState('');
  const [jantar, setJantar] = useState('');
  const [marmitas, setMarmitas] = useState('');
  const [obs, setObs] = useState('');
  const [salvo, setSalvo] = useState(false);

  const selecionar = (idx: number) => {
    setDiaAtivo(idx);
    setSalvo(false);
    const iso = DATAS_SEMANA[idx];
    const reg = contagens.find((c) => c.data === iso);
    if (reg) {
      setAlmoco(String(reg.almoco));
      setJantar(String(reg.jantar));
      setMarmitas(String(reg.marmitas));
      setObs(reg.obs ?? '');
    } else {
      setAlmoco('');
      setJantar('');
      setMarmitas('');
      setObs('');
    }
  };

  const handleSalvar = () => {
    const a = Number(almoco) || 0;
    const j = Number(jantar) || 0;
    const m = Number(marmitas) || 0;
    const iso = DATAS_SEMANA[diaAtivo];
    // grava no histórico detalhado
    onRegistrar({ data: iso, almoco: a, jantar: j, marmitas: m, obs: obs.trim() || undefined });
    // sincroniza o total no estado da semana
    atualizar((s) => ({
      ...s,
      refeicoes: { ...(s.refeicoes ?? {}), [diaAtivo]: a + j + m },
    }));
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  /* ── Totais por dia (histórico prevalece sobre estado.refeicoes) ───── */
  const totaisDia = useMemo(() =>
    DATAS_SEMANA.map((iso, i) => {
      const reg = contagens.find((c) => c.data === iso);
      if (reg) return reg.almoco + reg.jantar + reg.marmitas;
      return (estado.refeicoes ?? {})[i] ?? 0;
    }),
    [contagens, estado.refeicoes],
  );

  const totalSemana = totaisDia.reduce((s, n) => s + n, 0);

  /* ── Custo/refeição ─────────────────────────────────────────────────── */
  const custoSemana = useMemo(() =>
    estado.dias.reduce(
      (t, _, di) =>
        t + linhasDoDia(estado, di, fatores).reduce((s, l) => {
          const p = l.status.precoPago ?? precos[l.chave];
          return p > 0 ? s + p * (l.status.compradoQtd ?? l.qtd) : s;
        }, 0),
      0,
    ),
    [estado, precos, fatores],
  );

  const custoPorRefeicao = totalSemana > 0 && custoSemana > 0 ? custoSemana / totalSemana : null;

  /* ── Estatísticas históricas ─────────────────────────────────────────── */
  const ultimas30 = contagens.slice(0, 30);
  const medias = useMemo(() => mediasPorDiaSemana(ultimas30), [ultimas30]);
  const totalSemanaStats = useMemo(() => {
    const cutoff = new Date(DATA_HOJE);
    const ultimos7 = contagens.filter((c) => {
      const dc = new Date(c.data);
      return (cutoff.getTime() - dc.getTime()) / 86400000 < 7;
    });
    return ultimos7.reduce(
      (s, c) => ({ almoco: s.almoco + c.almoco, jantar: s.jantar + c.jantar, marmitas: s.marmitas + c.marmitas }),
      { almoco: 0, jantar: 0, marmitas: 0 },
    );
  }, [contagens]);

  const maxMedMedia = Math.max(...Object.values(medias).map((v) => Math.max(v.almoco, v.jantar, v.marmitas)), 1);

  /* ── Registro do dia activo ─────────────────────────────────────────── */
  const regAtivo = contagens.find((c) => c.data === DATAS_SEMANA[diaAtivo]);

  return (
    <div className="space-y-5">

      {/* ── Painel unificado ──────────────────────────────────────────── */}
      <Cartao className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-extrabold uppercase tracking-widest text-carvao-400">
            Refeições da semana
          </p>
          {custoPorRefeicao !== null && (
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-extrabold text-brand-700 ring-1 ring-brand-500/30 dark:text-brand-300">
              {formatarReais(custoPorRefeicao)} / refeição
            </span>
          )}
        </div>

        {/* Seletor de dia */}
        <div className="grid grid-cols-7 gap-1">
          {DATAS_SEMANA.map((iso, i) => {
            const total = totaisDia[i];
            const ativo = i === diaAtivo;
            const ehHoje = iso === DATA_HOJE;
            return (
              <button
                key={i}
                onClick={() => selecionar(i)}
                className={`flex flex-col items-center rounded-xl py-2 px-1 transition ${
                  ativo
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-carvao-50 text-carvao-600 hover:bg-carvao-100 dark:bg-carvao-800 dark:text-carvao-300 dark:hover:bg-carvao-700'
                }`}
              >
                <span className={`text-micro font-extrabold uppercase tracking-wide ${ativo ? 'text-white/70' : 'text-carvao-400'}`}>
                  {DIAS_SEMANA[i].slice(0, 3)}
                </span>
                <span className={`text-xs tabular-nums ${ehHoje && !ativo ? 'font-extrabold text-brand-600 dark:text-brand-400' : ''}`}>
                  {displayData(iso)}
                </span>
                <span className={`mt-0.5 text-sm font-bold ${total > 0 ? '' : ativo ? 'text-white/40' : 'text-carvao-300 dark:text-carvao-600'}`}>
                  {total > 0 ? total : '—'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Formulário do dia selecionado */}
        {podeContar && (
          <div className="space-y-3 rounded-2xl bg-carvao-50 p-4 dark:bg-carvao-800/50">
            <p className="text-xs font-bold text-carvao-500 dark:text-carvao-400">
              {DIAS_SEMANA[diaAtivo]}, {displayData(DATAS_SEMANA[diaAtivo])}
              {regAtivo && (
                <span className="ml-2 font-normal text-carvao-400">
                  · já registrado: {regAtivo.almoco}A · {regAtivo.jantar}J · {regAtivo.marmitas}M
                </span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={estiloRotulo}>Almoço</label>
                <input type="number" min={0} className={estiloInput} value={almoco}
                  onChange={(e) => setAlmoco(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={estiloRotulo}>Jantar</label>
                <input type="number" min={0} className={estiloInput} value={jantar}
                  onChange={(e) => setJantar(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className={estiloRotulo}>Marmitas</label>
                <input type="number" min={0} className={estiloInput} value={marmitas}
                  onChange={(e) => setMarmitas(e.target.value)} placeholder="0" />
              </div>
            </div>
            <input
              className={estiloInput} value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Observação (opcional)"
            />
            <Botao
              onClick={handleSalvar}
              className="w-full"
              variante={salvo ? 'sucesso' : 'primario'}
              disabled={almoco === '' && jantar === '' && marmitas === ''}
            >
              {salvo ? '✓ Salvo!' : `Salvar ${DIAS_SEMANA[diaAtivo]}`}
            </Botao>
          </div>
        )}

        {totalSemana > 0 && (
          <p className="text-xs font-semibold text-carvao-400">
            {totalSemana} refeições na semana
            {custoSemana > 0 && <> · custo da semana ≈ {formatarReais(custoSemana)}</>}
          </p>
        )}
      </Cartao>

      {/* ── Estatísticas ─────────────────────────────────────────────── */}
      {contagens.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Kpi rotulo="Almoços (7d)" valor={totalSemanaStats.almoco} tom="neutro" />
            <Kpi rotulo="Jantares (7d)" valor={totalSemanaStats.jantar} tom="neutro" />
            <Kpi rotulo="Marmitas (7d)" valor={totalSemanaStats.marmitas} tom="neutro" />
          </div>

          <Cartao>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-carvao-400">
              Médias por dia da semana
            </p>
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((ds) => {
                const m = medias[ds];
                if (!m) return null;
                return (
                  <div key={ds}>
                    <div className="mb-1 flex justify-between text-xs text-carvao-500">
                      <span className="font-semibold">{DIAS_ABREV[ds]}</span>
                      <span>{m.almoco} alm · {m.jantar} jan · {m.marmitas} mar</span>
                    </div>
                    <div className="space-y-1">
                      <MiniBar valor={m.almoco} max={maxMedMedia} cor="bg-brand-500" />
                      <MiniBar valor={m.jantar} max={maxMedMedia} cor="bg-ouro-400" />
                      <MiniBar valor={m.marmitas} max={maxMedMedia} cor="bg-[#2d6f8e]" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-caption text-carvao-400">
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-brand-500" />Almoço</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-ouro-400" />Jantar</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-[#2d6f8e]" />Marmitas</span>
            </div>
          </Cartao>

          <Cartao>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-carvao-400">
              Histórico recente
            </p>
            <div className="space-y-1.5">
              {ultimas30.slice(0, 14).map((c) => (
                <button
                  key={c.data}
                  onClick={() => {
                    const idx = DATAS_SEMANA.indexOf(c.data);
                    if (idx >= 0) selecionar(idx);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-carvao-50 dark:hover:bg-carvao-800"
                >
                  <span className="w-10 shrink-0 text-xs font-bold text-carvao-400">{diaSemDaData(c.data)}</span>
                  <span className="w-10 text-xs text-carvao-500 tabular-nums">{displayData(c.data)}</span>
                  <span className="flex-1 text-xs text-carvao-600 dark:text-carvao-300 tabular-nums">
                    {c.almoco} · {c.jantar} · {c.marmitas}
                  </span>
                  {c.obs && <span className="truncate text-xs text-carvao-400">{c.obs}</span>}
                </button>
              ))}
            </div>
          </Cartao>
        </>
      )}

      {contagens.length === 0 && (
        <div className="rounded-2xl bg-carvao-50 py-10 text-center dark:bg-carvao-800/50">
          <p className="text-sm font-semibold text-carvao-500">Sem registros ainda</p>
          <p className="mt-1 text-xs text-carvao-400">
            Clique num dia acima e registre as refeições para gerar métricas e padrões históricos.
          </p>
        </div>
      )}
    </div>
  );
}
