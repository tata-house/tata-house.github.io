'use client';

import { useMemo, useState } from 'react';
import { Cartao, Kpi, estiloInput, estiloRotulo } from '@/components/ui';
import { Botao } from '@/components/ui';
import type { ContagemRefeicoesDia } from '@/lib/cardapio/tipos';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function dataParaDisplay(data: string): string {
  const [y, m, d] = data.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

function dataParaDiaSemana(data: string): string {
  const [y, m, d] = data.split('-').map(Number);
  const dia = new Date(y, m - 1, d).getDay();
  return DIAS_SEMANA[dia];
}

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mediasPorDiaSemana(contagens: ContagemRefeicoesDia[]): Record<number, { almoco: number; jantar: number; marmitas: number; n: number }> {
  const acc: Record<number, { almoco: number; jantar: number; marmitas: number; n: number }> = {};
  contagens.forEach((c) => {
    const [y, m, d] = c.data.split('-').map(Number);
    const diaSem = new Date(y, m - 1, d).getDay();
    if (!acc[diaSem]) acc[diaSem] = { almoco: 0, jantar: 0, marmitas: 0, n: 0 };
    acc[diaSem].almoco += c.almoco;
    acc[diaSem].jantar += c.jantar;
    acc[diaSem].marmitas += c.marmitas;
    acc[diaSem].n += 1;
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

export function AbaContagem({
  contagens,
  onRegistrar,
}: {
  contagens: ContagemRefeicoesDia[];
  onRegistrar: (c: Omit<ContagemRefeicoesDia, 'registradoEm'>) => void;
}) {
  const dataHoje = hoje();
  const registroHoje = contagens.find((c) => c.data === dataHoje);

  const [data, setData] = useState(dataHoje);
  const [almoco, setAlmoco] = useState('');
  const [jantar, setJantar] = useState('');
  const [marmitas, setMarmitas] = useState('');
  const [obs, setObs] = useState('');
  const [salvo, setSalvo] = useState(false);

  const preencherExistente = (c: ContagemRefeicoesDia) => {
    setData(c.data);
    setAlmoco(String(c.almoco));
    setJantar(String(c.jantar));
    setMarmitas(String(c.marmitas));
    setObs(c.obs ?? '');
  };

  const handleSalvar = () => {
    const a = Number(almoco);
    const j = Number(jantar);
    const m = Number(marmitas);
    if (!(a >= 0) || !(j >= 0) || !(m >= 0)) return;
    onRegistrar({ data, almoco: a, jantar: j, marmitas: m, obs: obs.trim() || undefined });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
    if (data === dataHoje) {
      setAlmoco('');
      setJantar('');
      setMarmitas('');
      setObs('');
    }
  };

  const ultimas30 = contagens.slice(0, 30);
  const medias = useMemo(() => mediasPorDiaSemana(ultimas30), [ultimas30]);

  const totalSemana = useMemo(() => {
    const ultimos7 = contagens.filter((c) => {
      const d = new Date(dataHoje);
      const dc = new Date(c.data);
      return (d.getTime() - dc.getTime()) / 86400000 < 7;
    });
    return ultimos7.reduce((s, c) => ({ almoco: s.almoco + c.almoco, jantar: s.jantar + c.jantar, marmitas: s.marmitas + c.marmitas }), { almoco: 0, jantar: 0, marmitas: 0 });
  }, [contagens, dataHoje]);

  const maxMedMedia = Math.max(...Object.values(medias).map((v) => Math.max(v.almoco, v.jantar, v.marmitas)), 1);

  return (
    <div className="space-y-5">
      {/* Formulário de registro */}
      <Cartao>
        <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-carvao-400">
          🍽️ Registrar refeições
        </p>

        <div className="mb-4">
          <label className={estiloRotulo}>Data</label>
          <input
            type="date"
            className={`${estiloInput} dark:[color-scheme:dark]`}
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              const existente = contagens.find((c) => c.data === e.target.value);
              if (existente) preencherExistente(existente);
              else { setAlmoco(''); setJantar(''); setMarmitas(''); setObs(''); }
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={estiloRotulo}>Almoço</label>
            <input
              type="number"
              min={0}
              className={estiloInput}
              value={almoco}
              onChange={(e) => setAlmoco(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className={estiloRotulo}>Jantar</label>
            <input
              type="number"
              min={0}
              className={estiloInput}
              value={jantar}
              onChange={(e) => setJantar(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className={estiloRotulo}>Marmitas</label>
            <input
              type="number"
              min={0}
              className={estiloInput}
              value={marmitas}
              onChange={(e) => setMarmitas(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-3">
          <input
            className={estiloInput}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Observação (opcional)"
          />
        </div>

        <Botao
          onClick={handleSalvar}
          className="mt-4 w-full"
          variante={salvo ? 'sucesso' : 'primario'}
          disabled={almoco === '' && jantar === '' && marmitas === ''}
        >
          {salvo ? '✓ Salvo!' : 'Salvar contagem'}
        </Botao>

        {registroHoje && data === dataHoje && (
          <p className="mt-2 text-center text-xs text-carvao-400">
            Hoje já registrado: {registroHoje.almoco} almoço · {registroHoje.jantar} jantar · {registroHoje.marmitas} marmitas
          </p>
        )}
      </Cartao>

      {/* KPIs da semana */}
      {contagens.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Kpi rotulo="Almoços (7d)" valor={totalSemana.almoco} tom="neutro" icone="☀️" />
            <Kpi rotulo="Jantares (7d)" valor={totalSemana.jantar} tom="neutro" icone="🌙" />
            <Kpi rotulo="Marmitas (7d)" valor={totalSemana.marmitas} tom="neutro" icone="📦" />
          </div>

          {/* Médias por dia da semana */}
          <Cartao>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-carvao-400">
              📊 Médias por dia da semana
            </p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((diaSem) => {
                const m = medias[diaSem];
                if (!m) return null;
                return (
                  <div key={diaSem}>
                    <div className="mb-1 flex justify-between text-xs text-carvao-500">
                      <span className="font-semibold">{DIAS_SEMANA[diaSem]}</span>
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
            <div className="mt-4 flex gap-4 text-[11px] text-carvao-400">
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-brand-500" />Almoço</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-ouro-400" />Jantar</span>
              <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-[#2d6f8e]" />Marmitas</span>
            </div>
          </Cartao>

          {/* Histórico recente */}
          <Cartao>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-carvao-400">
              📋 Histórico recente
            </p>
            <div className="space-y-1.5">
              {ultimas30.slice(0, 14).map((c) => (
                <button
                  key={c.data}
                  onClick={() => preencherExistente(c)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-carvao-50 dark:hover:bg-carvao-800"
                >
                  <span className="w-10 shrink-0 text-xs font-bold text-carvao-400">{dataParaDiaSemana(c.data)}</span>
                  <span className="w-10 text-xs text-carvao-500 tabular-nums">{dataParaDisplay(c.data)}</span>
                  <span className="flex-1 text-xs text-carvao-600 dark:text-carvao-300 tabular-nums">
                    ☀️ {c.almoco} · 🌙 {c.jantar} · 📦 {c.marmitas}
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
          <p className="text-4xl">📊</p>
          <p className="mt-2 text-sm font-semibold text-carvao-500">Sem registros ainda</p>
          <p className="mt-1 text-xs text-carvao-400">
            Registre a contagem de refeições diariamente para gerar métricas e padrões
          </p>
        </div>
      )}
    </div>
  );
}
