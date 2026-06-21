'use client';

import { useEffect, useRef } from 'react';
import { QrCode } from '@/components/QrCode';
import { Botao } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { datasDaSemana } from '@/lib/cardapio/estado';
import { imagemParaDataUrl, useLogo } from '@/lib/cardapio/logo';
import { proteinaDoPrato } from '@/lib/cardapio/motor';
import { infoNutricional } from '@/lib/cardapio/nutricional';
import type { EstadoSemana } from '@/lib/cardapio/tipos';

/* =====================================================================
   Pôster da semana — arte impressa (A4 retrato) gerada do cardápio.
   Layout em colunas alinhadas: dia · pratos · nutrição. Sem percentual
   de "saudável" — só as informações nutricionais reais (kcal e macros).
   ===================================================================== */

const DIAS_POSTER = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const COR_PROTEINA: Record<string, string> = {
  bovina: '#e0867c',
  frango: '#e3b45c',
  suina: '#dd92b4',
  peixe: '#7cb8d4',
  ovo: '#dcc492',
  outros: '#cdd6cf',
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
  const { logo, setLogo } = useLogo();
  const inputLogo = useRef<HTMLInputElement>(null);

  // Nutrição — puxada dos mesmos dados do app (kcal e macros reais)
  const infosDia = estado.dias.map((d) => infoNutricional(d.principal));
  const comInfo = infosDia.filter((x): x is NonNullable<typeof x> => !!x);
  const mediaNutri = comInfo.length
    ? {
        kcal: Math.round(comInfo.reduce((a, p) => a + p.kcal, 0) / comInfo.length),
        proteinas: Math.round(comInfo.reduce((a, p) => a + p.proteinas, 0) / comInfo.length),
        carboidratos: Math.round(comInfo.reduce((a, p) => a + p.carboidratos, 0) / comInfo.length),
        gorduras: Math.round(comInfo.reduce((a, p) => a + p.gorduras, 0) / comInfo.length),
        fibras: Math.round(comInfo.reduce((a, p) => a + p.fibras, 0) / comInfo.length),
      }
    : null;

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

  // Baixar como imagem PNG — desenha o pôster num canvas (igual à plaquinha),
  // funciona em qualquer aparelho, sem depender da impressão do navegador.
  const baixarImagem = async () => {
    try {
      const W = 1000, H = 1500, M = 56;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const rrect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
        else ctx.rect(x, y, w, h);
      };
      const fit = (text: string, maxW: number) => {
        if (ctx.measureText(text).width <= maxW) return text;
        let t = text;
        while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
        return t + '…';
      };

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Cabeçalho
      ctx.textAlign = 'left';
      ctx.fillStyle = '#92713a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('TATÁ HOUSE', M, 74);
      ctx.fillStyle = '#055d2f';
      ctx.font = '900 52px Georgia, serif';
      ctx.fillText('Cardápio da semana', M, 130);
      // pílula do período
      ctx.font = 'bold 20px sans-serif';
      const pw = ctx.measureText(periodo.toUpperCase()).width + 36;
      ctx.fillStyle = '#007638';
      rrect(M, 152, pw, 38, 19); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(periodo.toUpperCase(), M + 18, 178);

      // QR no canto superior direito
      try {
        const qr = new Image();
        qr.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => {
          qr.onload = () => res();
          qr.onerror = () => rej(new Error('qr'));
          qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=1&data=${encodeURIComponent(urlAvaliar)}`;
        });
        ctx.drawImage(qr, W - M - 150, 50, 150, 150);
        ctx.fillStyle = '#7c828c';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Avalie o prato', W - M - 75, 218);
        ctx.textAlign = 'left';
      } catch { /* segue sem QR */ }

      // régua
      ctx.fillStyle = '#c8a96b';
      ctx.fillRect(M, 238, W - 2 * M, 4);

      // Dias
      const x0 = M, cw = W - 2 * M;
      const cardH = 132, gap = 10;
      let y = 262;
      estado.dias.forEach((dia, i) => {
        const fim = i >= 5;
        ctx.fillStyle = fim ? '#055d2f' : '#007638';
        rrect(x0, y, cw, cardH, 18); ctx.fill();

        // dia + data
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px Georgia, serif';
        ctx.fillText(DIAS_POSTER[i], x0 + 78, y + cardH / 2 - 4);
        ctx.fillStyle = '#c9f5da';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(ddmm(datas[i]), x0 + 78, y + cardH / 2 + 22);

        // separador
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0 + 156, y + 18); ctx.lineTo(x0 + 156, y + cardH - 18); ctx.stroke();

        const dx = x0 + 178;
        const nut = infosDia[i];
        const colDir = 150; // largura reservada à nutrição
        const maxTexto = cw - 178 - colDir;

        if (dia.principal) {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 25px sans-serif';
          ctx.fillText(fit(dia.principal, maxTexto), dx, y + 44);
          const guarn = [dia.guarnicaoFixa, dia.guarnicao].filter(Boolean).join(' · ');
          if (guarn) {
            ctx.fillStyle = '#c9f5da';
            ctx.font = '600 17px sans-serif';
            ctx.fillText(fit(guarn, maxTexto), dx, y + 72);
          }
          const extras: string[] = [];
          if (dia.salada) extras.push('Salada ' + dia.salada);
          if (dia.sobremesa) extras.push('Sobremesa ' + dia.sobremesa);
          if (extras.length) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '500 15px sans-serif';
            ctx.fillText(fit(extras.join('   •   '), maxTexto), dx, y + 98);
          }
          // nutrição
          if (nut) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#e3b45c';
            ctx.font = '900 30px Georgia, serif';
            ctx.fillText(String(nut.kcal), x0 + cw - 24, y + cardH / 2 - 2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('KCAL', x0 + cw - 24, y + cardH / 2 + 16);
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '600 14px sans-serif';
            ctx.fillText(`${nut.proteinas}g prot.`, x0 + cw - 24, y + cardH / 2 + 38);
          }
        } else {
          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.font = 'italic 700 18px sans-serif';
          ctx.fillText('A definir', dx, y + cardH / 2 + 6);
        }
        y += cardH + gap;
      });

      // Faixa nutricional
      if (mediaNutri) {
        const bandH = 132;
        ctx.fillStyle = '#e9fbf0';
        rrect(x0, y, cw, bandH, 18); ctx.fill();
        ctx.strokeStyle = '#96eab7'; ctx.lineWidth = 1.5;
        rrect(x0, y, cw, bandH, 18); ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#055d2f';
        ctx.font = '900 22px sans-serif';
        ctx.fillText('Informação nutricional', x0 + 28, y + 38);
        ctx.fillStyle = '#007638';
        ctx.font = '600 14px sans-serif';
        ctx.fillText('Média por prato principal · cuidamos do que você come', x0 + 28, y + 60);
        const macros: [string, string][] = [
          [`${mediaNutri.kcal}`, 'Calorias'],
          [`${mediaNutri.proteinas}g`, 'Proteína'],
          [`${mediaNutri.carboidratos}g`, 'Carboidrato'],
          [`${mediaNutri.gorduras}g`, 'Gordura'],
          [`${mediaNutri.fibras}g`, 'Fibras'],
        ];
        const bw = (cw - 56 - 4 * 12) / 5;
        macros.forEach(([val, rot], j) => {
          const bx = x0 + 28 + j * (bw + 12);
          const by = y + 74;
          ctx.fillStyle = '#ffffff';
          rrect(bx, by, bw, 44, 12); ctx.fill();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#23262c';
          ctx.font = '900 20px Georgia, serif';
          ctx.fillText(val, bx + bw / 2, by + 22);
          ctx.fillStyle = '#7c828c';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(rot.toUpperCase(), bx + bw / 2, by + 38);
        });
        y += bandH;
      }

      // Rodapé
      ctx.textAlign = 'center';
      ctx.fillStyle = '#055d2f';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillText('BOM APETITE', W / 2, H - 46);
      ctx.fillStyle = '#aab0b9';
      ctx.font = '600 12px sans-serif';
      ctx.fillText('Cardápio sujeito a alteração', W / 2, H - 24);

      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'cardapio-tata-house.png';
      a.click();
    } catch {
      alert('Não consegui baixar a imagem aqui. Use “Baixar / Imprimir” e escolha “Salvar como PDF”.');
    }
  };

  return (
    <div className="min-h-screen bg-carvao-200 py-6 dark:bg-carvao-950 print:bg-white print:py-0">
      {/* Controles (somem na impressão) */}
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4 print:hidden">
        <button
          onClick={aoFechar}
          className="text-sm font-bold text-carvao-500 transition hover:text-carvao-800 dark:text-areia-200"
        >
          ← Voltar ao app
        </button>
        <div className="flex items-center gap-2">
          <input ref={inputLogo} type="file" accept="image/*" onChange={aoEscolherLogo} className="hidden" />
          <Botao variante="secundario" onClick={() => inputLogo.current?.click()} className="!min-h-10 !px-4 !py-2 text-sm">
            <Icone nome="imagem" tam={16} /> {logo ? 'Trocar logo' : 'Enviar logo'}
          </Botao>
          {logo && (
            <button onClick={() => setLogo(null)} className="text-xs font-bold text-carvao-400 transition hover:text-perigo">
              Remover
            </button>
          )}
          <Botao variante="secundario" onClick={baixarImagem} className="!min-h-10 !px-4 !py-2 text-sm">
            <Icone nome="imagem" tam={16} /> Baixar imagem
          </Botao>
          <Botao variante="sucesso" onClick={() => window.print()} className="!min-h-10 !px-5 !py-2 text-sm">
            <Icone nome="exportar" tam={16} /> Imprimir
          </Botao>
        </div>
      </div>

      {/* Dica — duas formas de salvar */}
      <p className="mx-auto mb-4 max-w-[210mm] px-4 text-center text-xs text-carvao-500 dark:text-carvao-400 print:hidden">
        <strong>Baixar imagem</strong> salva um PNG no aparelho · <strong>Imprimir</strong> abre a opção “Salvar como PDF”.
      </p>

      {/* Folha A4 */}
      <div className="poster mx-auto flex min-h-[287mm] w-full max-w-[210mm] flex-col overflow-hidden bg-white text-carvao-900 shadow-flutuante print:min-h-[275mm] print:max-w-none print:shadow-none">
        {/* Cabeçalho */}
        <header className="px-10 pb-6 pt-9">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 pt-1">
              <p className="font-display text-[13px] font-bold uppercase tracking-[0.32em] text-ouro-600">
                Tatá House
              </p>
              <h1 className="mt-1 font-display text-[44px] font-black leading-[0.95] tracking-tight text-brand-800">
                Cardápio da semana
              </h1>
              <div className="mt-3 inline-flex items-center rounded-full bg-brand-700 px-5 py-1.5 text-[14px] font-bold uppercase tracking-[0.18em] text-white">
                {periodo}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-14 w-auto max-w-[130px] object-contain" />
              ) : null}
              <QrCode url={urlAvaliar} size={92} className="rounded-lg ring-1 ring-brand-200" />
              <div className="max-w-[104px] text-center text-[8px] font-bold uppercase leading-tight tracking-[0.14em] text-carvao-400">
                Aponte a câmera e avalie o prato
              </div>
            </div>
          </div>
          <div className="mt-5 h-1 w-full rounded-full bg-gradient-to-r from-brand-700 via-ouro-400 to-brand-700" />
        </header>

        {/* Dias — grade alinhada em colunas: dia · pratos · nutrição */}
        <main className="flex grow flex-col gap-2 px-10">
          {estado.dias.map((dia, i) => {
            const prot = dia.principal ? proteinaDoPrato(dia.principal) : 'outros';
            const guarnicoes = [dia.guarnicaoFixa, dia.guarnicao].filter(Boolean).join(' · ');
            const fimDeSemana = i >= 5;
            const nut = infosDia[i];
            return (
              <section
                key={i}
                className={`grid grid-cols-[96px_1fr_auto] items-stretch gap-5 rounded-2xl px-5 py-3 text-white ${
                  fimDeSemana
                    ? 'bg-brand-800 ring-1 ring-ouro-400/70'
                    : 'bg-brand-700'
                }`}
              >
                {/* Coluna 1 — dia + data */}
                <div className="flex flex-col items-center justify-center border-r border-white/20 pr-4 text-center">
                  <span className="font-display text-[15px] font-black leading-tight">{DIAS_POSTER[i]}</span>
                  <span className="mt-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-100">
                    {ddmm(datas[i])}
                  </span>
                </div>

                {/* Coluna 2 — pratos */}
                <div className="min-w-0 self-center">
                  {dia.principal ? (
                    <>
                      <p className="flex items-center gap-2 text-[16px] font-extrabold leading-snug">
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white/50"
                          style={{ backgroundColor: COR_PROTEINA[prot] }}
                          aria-hidden
                        />
                        <span className="min-w-0">{dia.principal}</span>
                      </p>
                      {guarnicoes && (
                        <p className="mt-1 pl-5 text-[11.5px] font-semibold text-brand-100">{guarnicoes}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 pl-5 text-[11px] text-white/85">
                        {dia.salada && (
                          <span>
                            <span className="font-bold text-ouro-300">Salada</span> {dia.salada}
                          </span>
                        )}
                        {dia.sobremesa && (
                          <span>
                            <span className="font-bold text-ouro-300">Sobremesa</span> {dia.sobremesa}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="py-2 text-sm font-bold italic text-white/55">A definir</p>
                  )}
                </div>

                {/* Coluna 3 — nutrição do dia (kcal + proteína) */}
                <div className="flex w-[78px] flex-col items-end justify-center text-right">
                  {dia.principal && nut ? (
                    <>
                      <span className="font-display text-[18px] font-black leading-none text-ouro-300 tabular-nums">
                        {nut.kcal}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-white/60">kcal</span>
                      <span className="mt-1 text-[10px] font-semibold text-white/85 tabular-nums">
                        {nut.proteinas}g prot.
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-white/30">—</span>
                  )}
                </div>
              </section>
            );
          })}
        </main>

        {/* Informação nutricional média — só os números, sem score */}
        {mediaNutri && (
          <section className="mx-10 mt-4 rounded-2xl border border-brand-200 bg-brand-50/70 px-5 py-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white">
                <Icone nome="nutricao" tam={16} />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-black text-brand-800">Informação nutricional</p>
                <p className="text-[10px] font-semibold text-brand-700/70">Média por prato principal · cuidamos do que você come</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { rot: 'Calorias', val: `${mediaNutri.kcal}`, un: 'kcal' },
                { rot: 'Proteína', val: `${mediaNutri.proteinas}`, un: 'g' },
                { rot: 'Carboidrato', val: `${mediaNutri.carboidratos}`, un: 'g' },
                { rot: 'Gordura', val: `${mediaNutri.gorduras}`, un: 'g' },
                { rot: 'Fibras', val: `${mediaNutri.fibras}`, un: 'g' },
              ].map((m) => (
                <div key={m.rot} className="rounded-xl bg-white px-1 py-2 text-center ring-1 ring-brand-100">
                  <p className="font-display text-[18px] font-black leading-none text-carvao-800 tabular-nums">
                    {m.val}
                    <span className="ml-0.5 text-[9px] font-bold text-carvao-400">{m.un}</span>
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-carvao-400">{m.rot}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="px-10 pb-7 pt-5">
          <div className="mx-auto h-px w-full max-w-[150mm] bg-carvao-200" />
          <p className="mt-3 text-center font-display text-[12px] font-bold uppercase tracking-[0.24em] text-brand-800">
            Bom apetite
          </p>
          <p className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-carvao-400">
            Cardápio sujeito a alteração
          </p>
        </footer>
      </div>
    </div>
  );
}
