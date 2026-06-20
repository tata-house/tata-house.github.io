'use client';

import { useRef, useState } from 'react';
import { Botao, Cartao, Pilula, estiloInput, estiloRotulo } from '@/components/ui';
import { Icone } from '@/components/Icones';
import { normalizar } from '@/lib/cardapio/motor';
import { comprimirImagem, lerNotaFiscalViaIA } from '@/lib/cardapio/nf-leitura';
import type { ItemNotaExtraido, ResultadoLeituraNF } from '@/lib/cardapio/nf-leitura';

function formatarReais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function alerteVariacao(item: string, precoNovo: number, precos: Record<string, number>): { label: string; cor: string } | null {
  const norm = normalizar(item);
  const atual = precos[norm];
  if (!atual || atual <= 0) return null;
  const pct = ((precoNovo - atual) / atual) * 100;
  if (Math.abs(pct) < 5) return null;
  if (pct > 15) return { label: `+${pct.toFixed(0)}% vs atual`, cor: 'text-red-600 dark:text-red-400' };
  if (pct > 0) return { label: `+${pct.toFixed(0)}%`, cor: 'text-amber-600 dark:text-amber-400' };
  return { label: `${pct.toFixed(0)}%`, cor: 'text-brand-600 dark:text-brand-400' };
}

export function AbaNF({
  precos,
  onAplicarPrecos,
}: {
  precos: Record<string, number>;
  onAplicarPrecos: (itens: { norm: string; valor: number; nome: string }[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLeituraNF | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [aplicado, setAplicado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string } | null>(null);

  const handleArquivo = async (file: File) => {
    setResultado(null);
    setSelecionados(new Set());
    setAplicado(false);
    setErro(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target!.result as string);
    reader.readAsDataURL(file);

    try {
      const dados = await comprimirImagem(file);
      setFileData(dados);
    } catch {
      setErro('Não foi possível ler a imagem.');
    }
  };

  const analisar = async () => {
    if (!fileData) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await lerNotaFiscalViaIA(fileData.base64, fileData.mimeType);
      setResultado(res);
      if (res.erro) {
        setErro(res.erro);
      } else {
        setSelecionados(new Set(res.itens.map((_, i) => i)));
      }
    } finally {
      setCarregando(false);
    }
  };

  const toggleSelecionado = (i: number) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(i)) novo.delete(i);
      else novo.add(i);
      return novo;
    });
  };

  const handleAplicar = () => {
    if (!resultado) return;
    const itens = resultado.itens
      .filter((_, i) => selecionados.has(i) && _.precoUnit > 0)
      .map((it) => ({
        norm: normalizar(it.produto),
        valor: it.precoUnit,
        nome: it.produto,
      }));
    if (itens.length === 0) return;
    onAplicarPrecos(itens);
    setAplicado(true);
    setTimeout(() => setAplicado(false), 3000);
  };

  const temChave = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return (
    <div className="space-y-5">
      {!temChave && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
          ⚠️ Defina <code className="font-mono">NEXT_PUBLIC_GEMINI_API_KEY</code> para habilitar leitura de NF por IA.
        </div>
      )}

      {/* Upload */}
      <Cartao>
        <p className="mb-4 text-sm font-extrabold uppercase tracking-widest text-carvao-400">
          📄 Nota fiscal — leitura por IA
        </p>

        <div
          className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-carvao-200 bg-carvao-50 px-4 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50 dark:border-carvao-700 dark:bg-carvao-800/50 dark:hover:bg-carvao-800 cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleArquivo(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleArquivo(f);
            }}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="NF" className="max-h-52 w-auto rounded-xl object-contain shadow-sm" />
          ) : (
            <>
              <Icone nome="imagem" tam={36} className="mb-3 text-carvao-300" />
              <p className="text-sm font-semibold text-carvao-600 dark:text-carvao-300">Toque para fotografar ou carregar NF</p>
              <p className="mt-1 text-xs text-carvao-400">JPG, PNG ou PDF · arrastar e soltar</p>
            </>
          )}
        </div>

        {preview && !resultado && (
          <Botao
            onClick={analisar}
            disabled={carregando || !fileData || !temChave}
            className="mt-4 w-full"
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analisando…
              </span>
            ) : (
              '✨ Analisar com IA'
            )}
          </Botao>
        )}

        {preview && resultado && (
          <button
            onClick={() => { setPreview(null); setResultado(null); setFileData(null); setErro(null); }}
            className="mt-3 w-full text-center text-sm font-semibold text-carvao-400 hover:text-carvao-600"
          >
            Carregar outra nota
          </button>
        )}
      </Cartao>

      {erro && !resultado?.itens.length && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
          ⚠️ {erro}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <Cartao>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-carvao-900 dark:text-white">
                {resultado.fornecedor ?? 'Fornecedor não identificado'}
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-carvao-500">
                {resultado.cnpj && <span>CNPJ: {resultado.cnpj}</span>}
                {resultado.data && <span>Data: {resultado.data.split('-').reverse().join('/')}</span>}
                {resultado.totalNF && <span className="font-semibold text-carvao-700 dark:text-carvao-300">Total: {formatarReais(resultado.totalNF)}</span>}
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 dark:bg-carvao-700 dark:text-brand-300">
              {resultado.itens.length} {resultado.itens.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="space-y-1.5">
            {resultado.itens.map((it, i) => {
              const alerta = alerteVariacao(it.produto, it.precoUnit, precos);
              const sel = selecionados.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleSelecionado(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    sel
                      ? 'border-brand-300 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                      : 'border-transparent bg-carvao-50 opacity-50 dark:bg-carvao-800/50'
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${sel ? 'border-brand-600 bg-brand-600' : 'border-carvao-300 dark:border-carvao-600'}`}>
                    {sel && <Icone nome="check" tam={11} className="text-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold capitalize text-carvao-800 dark:text-areia-100">
                      {it.produto}
                    </p>
                    <p className="text-xs text-carvao-400">
                      {it.qtd} {it.unid} · {formatarReais(it.precoUnit)}/{it.unid.toLowerCase()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-carvao-700 dark:text-carvao-300">
                      {formatarReais(it.precoTotal)}
                    </p>
                    {alerta && (
                      <p className={`text-[10px] font-semibold ${alerta.cor}`}>{alerta.label}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                if (selecionados.size === resultado.itens.length) setSelecionados(new Set());
                else setSelecionados(new Set(resultado.itens.map((_, i) => i)));
              }}
              className="text-xs font-semibold text-carvao-400 hover:text-carvao-700"
            >
              {selecionados.size === resultado.itens.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            <Botao
              onClick={handleAplicar}
              disabled={selecionados.size === 0 || aplicado}
              variante={aplicado ? 'sucesso' : 'primario'}
              className="flex-1"
            >
              {aplicado
                ? '✓ Preços atualizados!'
                : `Aplicar ${selecionados.size} preço${selecionados.size !== 1 ? 's' : ''}`}
            </Botao>
          </div>

          {aplicado && (
            <p className="mt-2 text-center text-xs text-carvao-400">
              Os preços foram adicionados ao catálogo e ao histórico de preços.
            </p>
          )}
        </Cartao>
      )}

      <div className="rounded-2xl bg-carvao-50 px-4 py-4 dark:bg-carvao-800/50">
        <p className="text-xs font-semibold text-carvao-500">Como funciona</p>
        <ul className="mt-2 space-y-1.5 text-xs text-carvao-400">
          <li>1. Fotografe ou carregue uma imagem da nota fiscal.</li>
          <li>2. O Gemini extrai automaticamente: fornecedor, data, itens, quantidades e preços.</li>
          <li>3. Selecione os itens que deseja importar e clique em &quot;Aplicar preços&quot;.</li>
          <li>4. Os preços unitários alimentam o catálogo e o radar de preços.</li>
        </ul>
      </div>
    </div>
  );
}
