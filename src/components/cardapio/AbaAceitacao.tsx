'use client';

import { useMemo, useState } from 'react';
import { toast } from '@/components/Toast';
import { QrCode } from '@/components/QrCode';
import { PlaquinhaQR } from './PlaquinhaQR';
import { BarraMini, Botao, Cartao, EstadoVazio, Pilula, Secao, estiloInput, estiloRotulo } from '@/components/ui';
import { DIAS_SEMANA, formatarQtd, normalizar } from '@/lib/cardapio/motor';
import type { Aceitacao, EstadoSemana, EventoDemanda, RegistroDesperdicio } from '@/lib/cardapio/tipos';

function media(a: { somaNotas: number; n: number }) {
  return a.n > 0 ? a.somaNotas / a.n : 0;
}

export function AbaAceitacao({
  estado,
  aceitacao,
  avaliar,
  eventos,
  addEvento,
  rmEvento,
  desperdicio,
  podeEditar,
}: {
  estado: EstadoSemana;
  aceitacao: Aceitacao;
  avaliar: (prato: string, voto: 'bom' | 'ok' | 'ruim') => void;
  eventos: EventoDemanda[];
  addEvento: (e: Omit<EventoDemanda, 'id'>) => void;
  rmEvento: (id: string) => void;
  desperdicio: RegistroDesperdicio[];
  podeEditar: boolean;
}) {
  const [data, setData] = useState('');
  const [rotulo, setRotulo] = useState('');
  const [fator, setFator] = useState('1.2');
  const [plaquinhaAberta, setPlaquinhaAberta] = useState(false);

  const ranking = useMemo(
    () =>
      Object.values(aceitacao)
        .filter((a) => a.n > 0)
        .map((a) => ({ prato: a.prato, media: media(a), n: a.n, bom: a.bom, ruim: a.ruim }))
        .sort((a, b) => b.media - a.media),
    [aceitacao],
  );

  // cruzamento aceitação × desperdício
  const cruzamento = useMemo(() => {
    const sobraPorPrato = new Map<string, number>();
    desperdicio.forEach((r) => {
      const k = normalizar(r.prato);
      sobraPorPrato.set(k, (sobraPorPrato.get(k) ?? 0) + Math.max(0, r.produzido - r.consumido));
    });
    return ranking
      .filter((r) => r.media < 3.5 && (sobraPorPrato.get(normalizar(r.prato)) ?? 0) > 0)
      .map((r) => ({ ...r, sobra: sobraPorPrato.get(normalizar(r.prato)) ?? 0 }));
  }, [ranking, desperdicio]);

  const lancarEvento = () => {
    if (!data || !rotulo.trim()) {
      toast('Informe a data e o nome do evento', 'erro');
      return;
    }
    addEvento({ data, rotulo: rotulo.trim(), fator: Number(fator) || 1 });
    toast('Evento adicionado à previsão');
    setData('');
    setRotulo('');
    setFator('1.2');
  };

  const VOTOS: { v: 'bom' | 'ok' | 'ruim'; e: string; rot: string; tom: 'verde' | 'ouro' | 'vermelho' }[] = [
    { v: 'bom', e: '😋', rot: 'Gostei', tom: 'verde' },
    { v: 'ok', e: '😐', rot: 'Neutro', tom: 'ouro' },
    { v: 'ruim', e: '👎', rot: 'Não', tom: 'vermelho' },
  ];

  const pratosSemana = estado.dias.map((d) => d.principal).filter(Boolean);
  const urlAvaliar = (typeof window !== 'undefined' ? window.location.origin : '') + '/avaliar';

  return (
    <div className="space-y-5">
      <PlaquinhaQR aberto={plaquinhaAberta} aoFechar={() => setPlaquinhaAberta(false)} url={urlAvaliar} />
      {/* Pesquisa por QR — funcionários avaliam o prato do dia */}
      <Secao titulo="📱 Pesquisa por QR">
        <Cartao className="flex flex-col items-center gap-4 sm:flex-row">
          <QrCode url={urlAvaliar} size={132} className="shrink-0 ring-1 ring-carvao-200" />
          <div className="min-w-0 space-y-1.5 text-center sm:text-left">
            <p className="text-sm text-carvao-600 dark:text-areia-200">
              Imprima no pôster ou deixe num tablet na saída do refeitório. A equipe aponta a câmera e avalia o{' '}
              <strong>prato do dia</strong> com um toque — os votos entram aqui automaticamente.
            </p>
            <a
              href={urlAvaliar}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-xs font-semibold text-brand-600 underline dark:text-brand-300"
            >
              {urlAvaliar}
            </a>
            <Botao variante="secundario" className="!min-h-10 !px-4 !py-2 text-sm" onClick={() => setPlaquinhaAberta(true)}>
              🖼️ Plaquinha para imprimir
            </Botao>
          </div>
        </Cartao>
      </Secao>

      {/* Avaliação dos pratos da semana */}
      <Secao titulo="🗳️ Avaliar pratos da semana">
        {pratosSemana.length === 0 ? (
          <EstadoVazio icone="🍽️" titulo="Sem pratos para avaliar" texto="Monte o cardápio para registrar a aceitação de cada prato." />
        ) : (
          <div className="space-y-2">
            {estado.dias.map((d, i) =>
              d.principal ? (
                <Cartao key={i} className="flex flex-wrap items-center justify-between gap-3 !py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.principal}</p>
                    <p className="text-caption text-carvao-400">
                      {DIAS_SEMANA[i]}
                      {(() => {
                        const a = aceitacao[normalizar(d.principal)];
                        return a && a.n > 0 ? ` · nota ${media(a).toFixed(1)} (${a.n})` : ' · sem avaliação';
                      })()}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {VOTOS.map((b) => (
                      <button
                        key={b.v}
                        disabled={!podeEditar}
                        onClick={() => {
                          avaliar(d.principal, b.v);
                          toast(`${b.e} registrado para ${d.principal}`, 'info');
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-areia-100 text-xl transition hover:scale-110 disabled:opacity-40 dark:bg-carvao-700"
                        title={b.rot}
                      >
                        {b.e}
                      </button>
                    ))}
                  </div>
                </Cartao>
              ) : null,
            )}
          </div>
        )}
      </Secao>

      {/* Rankings */}
      {ranking.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Secao titulo="🏆 Mais aceitos">
            <Cartao className="space-y-3">
              {ranking.slice(0, 5).map((r) => (
                <div key={r.prato} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{r.prato}</span>
                    <span className="shrink-0 font-bold text-brand-600 dark:text-brand-300">{r.media.toFixed(1)}</span>
                  </div>
                  <BarraMini valor={r.media / 5} tom="verde" />
                </div>
              ))}
            </Cartao>
          </Secao>
          <Secao titulo="⚠️ Pior aceitação">
            <Cartao className="space-y-3">
              {ranking
                .slice()
                .reverse()
                .slice(0, 5)
                .map((r) => (
                  <div key={r.prato} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-semibold">{r.prato}</span>
                      <span className="shrink-0 font-bold text-perigo">{r.media.toFixed(1)}</span>
                    </div>
                    <BarraMini valor={r.media / 5} tom="vermelho" />
                  </div>
                ))}
            </Cartao>
          </Secao>
        </div>
      )}

      {/* Cruzamento aceitação × desperdício */}
      {cruzamento.length > 0 && (
        <Secao titulo="🔎 Baixa aceitação + sobra">
          <Cartao className="!p-0">
            <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
              {cruzamento.map((c) => (
                <li key={c.prato} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.prato}</p>
                    <p className="text-caption text-carvao-400">
                      nota {c.media.toFixed(1)} · {formatarQtd(c.sobra)} de sobra
                    </p>
                  </div>
                  <Pilula tom="vermelho">candidato a sair</Pilula>
                </li>
              ))}
            </ul>
          </Cartao>
          <p className="text-xs font-semibold text-carvao-400">
            Pratos que a equipe não curtiu e ainda sobraram: bons candidatos a substituir no cardápio.
          </p>
        </Secao>
      )}

      {/* Eventos de demanda (M6) */}
      <Secao titulo="📅 Eventos e feriados (previsão)">
        {podeEditar && (
          <Cartao className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className={estiloRotulo}>Data</label>
                <input type="date" className={estiloInput} value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={estiloRotulo}>Evento</label>
                <input className={estiloInput} placeholder="ex.: Feriado, evento da empresa" value={rotulo} onChange={(e) => setRotulo(e.target.value)} />
              </div>
              <div>
                <label className={estiloRotulo}>Fator</label>
                <select className={estiloInput} value={fator} onChange={(e) => setFator(e.target.value)}>
                  <option value="0">Fechado (0%)</option>
                  <option value="0.5">Reduzido (−50%)</option>
                  <option value="0.8">Menos (−20%)</option>
                  <option value="1.2">Mais (+20%)</option>
                  <option value="1.5">Pico (+50%)</option>
                </select>
              </div>
            </div>
            <Botao onClick={lancarEvento} className="w-full">
              Adicionar evento
            </Botao>
          </Cartao>
        )}
        {eventos.length > 0 && (
          <Cartao className="!p-0">
            <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
              {eventos
                .slice()
                .sort((a, b) => a.data.localeCompare(b.data))
                .map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.rotulo}</p>
                      <p className="text-caption text-carvao-400">{e.data.split('-').reverse().join('/')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pilula tom={e.fator < 1 ? 'vermelho' : 'verde'}>
                        {e.fator === 0 ? 'fechado' : `${e.fator > 1 ? '+' : ''}${Math.round((e.fator - 1) * 100)}%`}
                      </Pilula>
                      {podeEditar && (
                        <button onClick={() => rmEvento(e.id)} className="text-carvao-300 hover:text-perigo" aria-label="Remover">
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </Cartao>
        )}
      </Secao>
    </div>
  );
}
