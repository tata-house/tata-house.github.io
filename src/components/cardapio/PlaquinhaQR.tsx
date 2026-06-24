'use client';

/* =====================================================================
   Plaquinha de mesa com QR — arte pronta para imprimir (tamanho pequeno,
   ~A6/table-tent) ou baixar como imagem. A pessoa senta, vê a plaquinha,
   aponta a câmera e avalia o prato do dia.
   ===================================================================== */

import { useEffect } from 'react';
import { QrCode } from '@/components/QrCode';
import { Botao } from '@/components/ui';
import { Icone } from '@/components/Icones';

export function PlaquinhaQR({
  aberto,
  aoFechar,
  url,
}: {
  aberto: boolean;
  aoFechar: () => void;
  url: string;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar]);

  if (!aberto) return null;

  const baixarImagem = async () => {
    try {
      const L = 720;
      const A = 1120;
      const c = document.createElement('canvas');
      c.width = L;
      c.height = A;
      const ctx = c.getContext('2d');
      if (!ctx) return;

      const g = ctx.createLinearGradient(0, 0, 0, A);
      g.addColorStop(0, '#055d2f');
      g.addColorStop(1, '#064c29');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, L, A);
      ctx.fillStyle = '#c8a96b';
      ctx.fillRect(0, 0, L, 12);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 70px Georgia, serif';
      ctx.fillText('TATÁ HOUSE', L / 2, 150);
      ctx.fillStyle = '#dcc492';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('REFEITÓRIO DO TATÁ SUSHI', L / 2, 188);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 54px Georgia, serif';
      ctx.fillText('AVALIE O PRATO', L / 2, 300);
      ctx.fillText('DO DIA', L / 2, 360);
      ctx.fillStyle = '#c9f5da';
      ctx.font = '500 26px sans-serif';
      ctx.fillText('Aponte a câmera e diga o que achou', L / 2, 420);

      const qr = new Image();
      qr.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        qr.onload = () => res();
        qr.onerror = () => rej(new Error('qr'));
        qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=460x460&margin=2&data=${encodeURIComponent(url)}`;
      });
      const s = 460;
      const qx = (L - s) / 2;
      const qy = 470;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qx - 24, qy - 24, s + 48, s + 48);
      ctx.drawImage(qr, qx, qy, s, s);

      // Escala de avaliação com rótulos
      const opcoes = [
        { e: '😋', r: 'Adorei' },
        { e: '😐', r: 'Ok' },
        { e: '👎', r: 'Não curti' },
      ];
      const colW = (L - 120) / 3;
      opcoes.forEach((o, i) => {
        const cx = 60 + colW * i + colW / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px sans-serif';
        ctx.fillText(o.e, cx, qy + s + 80);
        ctx.fillStyle = '#c9f5da';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(o.r.toUpperCase(), cx, qy + s + 116);
      });

      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'plaquinha-tata-house.png';
      a.click();
    } catch {
      alert('Não consegui baixar a imagem aqui. Use “Imprimir” e escolha “Salvar como PDF”.');
    }
  };

  return (
    <div className="min-h-screen bg-carvao-200 py-6 dark:bg-carvao-950 print:bg-white print:py-0">
      {/* Controles (somem na impressão) */}
      <div className="mx-auto mb-4 flex max-w-[120mm] flex-wrap items-center justify-between gap-2 px-4 print:hidden">
        <button
          onClick={aoFechar}
          className="text-sm font-bold uppercase tracking-wide text-carvao-500 hover:text-carvao-800 dark:text-areia-200"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-2">
          <Botao variante="secundario" onClick={baixarImagem} className="!min-h-10 !px-4 !py-2 text-sm">
            <Icone nome="imagem" tam={16} /> Baixar imagem
          </Botao>
          <Botao variante="sucesso" onClick={() => window.print()} className="!min-h-10 !px-5 !py-2 text-sm">
            <Icone nome="exportar" tam={16} /> Imprimir
          </Botao>
        </div>
      </div>

      {/* A plaquinha (table-tent) */}
      <div className="poster mx-auto flex w-[92mm] flex-col items-center overflow-hidden rounded-3xl bg-gradient-to-b from-brand-800 to-brand-900 text-center text-white shadow-flutuante print:rounded-none print:shadow-none">
        {/* Régua dourada no topo */}
        <div className="h-1.5 w-full bg-gradient-to-r from-ouro-400 via-ouro-300 to-ouro-400" />
        <div className="flex w-full flex-col items-center gap-5 px-7 pb-9 pt-7">
          <div>
            <div className="font-display text-3xl font-black tracking-[0.12em]">TATÁ HOUSE</div>
            <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.3em] text-ouro-300">
              Refeitório do Tatá Sushi
            </div>
          </div>

          <div className="h-px w-12 bg-white/25" aria-hidden />

          <div>
            <div className="font-display text-[26px] font-black leading-tight">
              Avalie o prato
              <br />
              do dia
            </div>
            <p className="mt-2 text-sm font-medium text-brand-100">Aponte a câmera e diga o que achou</p>
          </div>

          <div className="rounded-2xl bg-white p-3 shadow-lg">
            <QrCode url={url} size={200} />
          </div>

          {/* Escala de avaliação com rótulos — mais clara que emojis soltos */}
          <div className="flex w-full items-stretch justify-center gap-2">
            {[
              { e: '😋', r: 'Adorei' },
              { e: '😐', r: 'Ok' },
              { e: '👎', r: 'Não curti' },
            ].map((o) => (
              <div key={o.r} className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-white/10 py-2">
                <span className="text-2xl leading-none">{o.e}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-100">{o.r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-[120mm] px-4 text-center text-xs text-texto-suave print:hidden">
        Dica: imprima, dobre ao meio e deixe na mesa do refeitório. Para PDF, use “Imprimir → Salvar como PDF”.
      </p>
    </div>
  );
}
