'use client';

import { useEffect, useRef } from 'react';
import { QrCode } from '@/components/QrCode';
import { Botao } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { datasDaSemana } from '@/lib/cardapio/estado';
import { imagemParaDataUrl, useLogo } from '@/lib/cardapio/logo';
import { proteinaDoPrato } from '@/lib/cardapio/motor';
import { infoNutricional, indiceNutricionalSemana } from '@/lib/cardapio/nutricional';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

/* =====================================================================
   Pôster da semana — a arte impressa para os funcionários, gerada
   automaticamente a partir do cardápio montado. Formato A4 retrato.
   Identidade TATÁ: verde vivo, caixa alta, logo em destaque.
   ===================================================================== */

const DIAS_POSTER = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];

const COR_PROTEINA: Record<string, string> = {
  bovina: '#ffb3a7',
  frango: '#ffd98a',
  suina: '#ffc2d8',
  peixe: '#a8dcf0',
  ovo: '#ffe9b0',
  outros: '#d8e8dc',
};

function ddmm(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function PosterSemana({
  estado,
  semanaId,
  aoFechar,
}: {
  estado: EstadoSemana;
  semanaId: string;
  aoFechar: () => void;
}) {
  const datas = datasDaSemana(semanaId);
  const periodo = `${ddmm(datas[0])} a ${ddmm(datas[6])}`;
  const urlAvaliar = (typeof window !== 'undefined' ? window.location.origin : '') + '/avaliar';

  // Nutrição — puxada dos mesmos dados do app, para mostrar o cuidado da casa
  const infosDia = estado.dias.map((d) => infoNutricional(d.principal));
  const comInfo = infosDia.filter((x): x is NonNullable<typeof x> => !!x);
  const indice = indiceNutricionalSemana(estado.dias);
  const mediaNutri = comInfo.length
    ? {
        kcal: Math.round(comInfo.reduce((a, p) => a + p.kcal, 0) / comInfo.length),
        proteinas: Math.round(comInfo.reduce((a, p) => a + p.proteinas, 0) / comInfo.length),
        carboidratos: Math.round(comInfo.reduce((a, p) => a + p.carboidratos, 0) / comInfo.length),
        gorduras: Math.round(comInfo.reduce((a, p) => a + p.gorduras, 0) / comInfo.length),
        fibras: Math.round(comInfo.reduce((a, p) => a + p.fibras, 0) / comInfo.length),
      }
    : null;
  const { logo, setLogo } = useLogo();
  const inputLogo = useRef<HTMLInputElement>(null);

  const aoEscolherLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setLogo(await imagemParaDataUrl(file));
    } catch {
      alert('Não consegui ler essa imagem. Tente um PNG ou JPG.');
    }
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  return (
    <div className="min-h-screen bg-carvao-200 py-6 dark:bg-carvao-950 print:bg-white print:py-0">
      {/* Controles (somem na impressão) */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4 print:hidden">
        <button
          onClick={aoFechar}
          className="text-sm font-bold uppercase tracking-wide text-carvao-500 hover:text-carvao-800 dark:text-areia-200"
        >
          ← Voltar ao app
        </button>
        <div className="flex items-center gap-2">
          <input ref={inputLogo} type="file" accept="image/*" onChange={aoEscolherLogo} className="hidden" />
          <Botao
            variante="secundario"
            onClick={() => inputLogo.current?.click()}
            className="!min-h-10 !px-4 !py-2 text-sm"
          >
            <Icone nome="imagem" tam={16} /> {logo ? 'Trocar logo' : 'Enviar logo'}
          </Botao>
          {logo && (
            <button
              onClick={() => setLogo(null)}
              className="text-xs font-bold uppercase tracking-wide text-carvao-400 hover:text-perigo"
            >
              Remover
            </button>
          )}
          <Botao variante="sucesso" onClick={() => window.print()} className="!min-h-10 !px-5 !py-2 text-sm">
            <Icone nome="exportar" tam={16} /> Imprimir pôster
          </Botao>
        </div>
      </div>

      {/* Folha A4 */}
      <div className="poster mx-auto flex min-h-[287mm] w-full max-w-[210mm] flex-col overflow-hidden bg-white text-carvao-900 shadow-flutuante print:min-h-[275mm] print:max-w-none print:shadow-none">
        {/* Cabeçalho */}
        <header className="px-9 pb-5 pt-8">
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0">
              <h1 className="font-display text-[46px] font-black leading-[0.95] tracking-tight text-brand-800">
                Cardápio
                <br />
                Semanal
              </h1>
              <div className="mt-3 inline-flex items-center rounded-full bg-brand-700 px-5 py-1.5 text-[15px] font-extrabold uppercase tracking-[0.22em] text-white">
                {periodo}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-16 w-auto max-w-[140px] object-contain" />
              ) : (
                <div className="text-center font-display text-[15px] font-black tracking-[0.3em] text-brand-800">
                  TATÁ HOUSE
                </div>
              )}
              <QrCode url={urlAvaliar} size={96} className="ring-1 ring-brand-200" />
              <div className="max-w-[110px] text-center text-[8px] font-extrabold uppercase leading-tight tracking-[0.18em] text-ouro-600">
                Aponte a câmera e avalie o prato do dia
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-gradient-to-r from-brand-700 via-brand-400 to-brand-700" />
        </header>

        {/* Dias */}
        <main className="flex grow flex-col justify-evenly gap-2.5 px-9 pb-4">
          {estado.dias.map((dia, i) => {
            const prot = dia.principal ? proteinaDoPrato(dia.principal) : 'outros';
            const guarnicoes = [dia.guarnicaoFixa, dia.guarnicao].filter(Boolean).join(' · ');
            const fimDeSemana = i >= 5;
            const nut = infosDia[i];
            return (
              <section
                key={i}
                className={`flex items-stretch gap-4 rounded-2xl px-5 py-3 text-white shadow-suave ${
                  fimDeSemana
                    ? 'bg-gradient-to-r from-brand-800 via-brand-700 to-brand-800 ring-2 ring-ouro-400'
                    : 'bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700'
                }`}
              >
                <div className="flex w-[84px] shrink-0 flex-col items-center justify-center border-r-2 border-white/25 pr-4">
                  <span className="font-display text-[15px] font-black tracking-[0.08em]">
                    {DIAS_POSTER[i]}
                  </span>
                  <span className="mt-0.5 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-brand-100">
                    {ddmm(datas[i])}
                  </span>
                </div>
                <div className="min-w-0 grow self-center py-0.5">
                  {dia.principal ? (
                    <>
                      <p className="text-[16px] font-extrabold uppercase leading-snug tracking-wide">
                        <span
                          className="mr-2 inline-block h-3 w-3 rounded-full align-middle ring-2 ring-white/60"
                          style={{ backgroundColor: COR_PROTEINA[prot] }}
                          aria-hidden
                        />
                        {dia.principal}
                      </p>
                      {guarnicoes && (
                        <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-wide text-brand-100">
                          {guarnicoes}
                        </p>
                      )}
                      {(dia.salada || dia.sobremesa) && (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                          {dia.salada && (
                            <>
                              <span className="font-black text-ouro-300">Salada</span> {dia.salada}
                            </>
                          )}
                          {dia.salada && dia.sobremesa && (
                            <span className="mx-2 text-ouro-300" aria-hidden>
                              ◆
                            </span>
                          )}
                          {dia.sobremesa && (
                            <>
                              <span className="font-black text-ouro-300">Sobremesa</span> {dia.sobremesa}
                            </>
                          )}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="py-2 text-sm font-bold uppercase italic text-white/60">A definir</p>
                  )}
                </div>
                {/* Nutrição do dia — kcal e proteína, dado real puxado do app */}
                {dia.principal && nut && (
                  <div className="flex shrink-0 flex-col items-end justify-center gap-1 border-l-2 border-white/20 pl-4 text-right">
                    <span className="font-display text-[17px] font-black leading-none text-ouro-300 tabular-nums">
                      {nut.kcal}
                      <span className="ml-0.5 text-[9px] font-bold uppercase tracking-wide text-white/70">kcal</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/85 tabular-nums">
                      {nut.proteinas}g proteína
                    </span>
                  </div>
                )}
              </section>
            );
          })}
        </main>

        {/* Compromisso nutricional da semana — o cuidado da casa, visível */}
        {mediaNutri && (
          <section className="mx-9 mb-4 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-white">
                  <Icone nome="nutricao" tam={18} />
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-black uppercase tracking-wide text-brand-800">Compromisso nutricional</p>
                  <p className="text-[10px] font-semibold text-brand-700/80">Média por prato principal · cuidamos do que você come</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-brand-300">
                <span className="font-display text-[18px] font-black leading-none text-brand-700 tabular-nums">{indice.score}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-700">{indice.rotulo}</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[
                { rot: 'Calorias', val: `${mediaNutri.kcal}`, un: 'kcal' },
                { rot: 'Proteína', val: `${mediaNutri.proteinas}`, un: 'g' },
                { rot: 'Carboid.', val: `${mediaNutri.carboidratos}`, un: 'g' },
                { rot: 'Gordura', val: `${mediaNutri.gorduras}`, un: 'g' },
                { rot: 'Fibras', val: `${mediaNutri.fibras}`, un: 'g' },
              ].map((m) => (
                <div key={m.rot} className="rounded-xl bg-white px-1 py-1.5 text-center ring-1 ring-brand-100">
                  <p className="text-[8px] font-bold uppercase tracking-wide text-carvao-400">{m.rot}</p>
                  <p className="font-display text-[16px] font-black leading-none text-carvao-800 tabular-nums">
                    {m.val}<span className="ml-0.5 text-[8px] font-bold text-carvao-400">{m.un}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="px-9 pb-6">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px grow bg-gradient-to-r from-transparent to-brand-600/50" aria-hidden />
            <p className="whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.26em] text-brand-800">
              Bom apetite! · TATÁ HOUSE
            </p>
            <span className="h-px grow bg-gradient-to-l from-transparent to-brand-600/50" aria-hidden />
          </div>
          <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-carvao-400">
            Atenção: cardápio sujeito a alteração
          </p>
        </footer>
      </div>
    </div>
  );
}
