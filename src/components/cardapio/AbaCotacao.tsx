'use client';

import { useEffect, useMemo, useState } from 'react';
import { Botao, Cartao } from '@/components/cardapio/ui';
import { agruparCotacao, parsearCotacao } from '@/lib/cardapio/cotacao';
import type { LinhaCotacao } from '@/lib/cardapio/cotacao';
import { DADOS, formatarReais, normalizar } from '@/lib/cardapio/motor';

const CHAVE_TEXTO = 'cardapio.v1.cotacao.texto';

/**
 * A cotação é a guia do cardápio: cole o texto da semana e o app extrai os
 * preços. Itens conhecidos recebem o menor preço automaticamente; produtos
 * novos podem ser cadastrados na hora — tudo cotado vira custo no app.
 */
export function AbaCotacao({
  definirPreco,
  definirFornecedor,
  cadastrarItem,
  itensExtras = {},
}: {
  definirPreco: (itemNorm: string, valor: number | null, nome?: string) => void;
  definirFornecedor?: (itemNorm: string, marca: string | null) => void;
  cadastrarItem?: (norm: string, nome: string, unid: string) => void;
  itensExtras?: Record<string, { n: string; u: string }>;
}) {
  const [texto, setTexto] = useState('');
  const [lido, setLido] = useState<LinhaCotacao[] | null>(null);
  const [ignorados, setIgnorados] = useState<Set<string>>(new Set());
  const [unidades, setUnidades] = useState<Record<number, string>>({});
  const [cadastrados, setCadastrados] = useState<Set<number>>(new Set());
  const [aplicado, setAplicado] = useState(0);

  useEffect(() => {
    try {
      setTexto(localStorage.getItem(CHAVE_TEXTO) ?? '');
    } catch {
      /* sem armazenamento: segue vazio */
    }
  }, []);

  const ler = () => {
    try {
      localStorage.setItem(CHAVE_TEXTO, texto);
    } catch {
      /* armazenamento indisponível */
    }
    setLido(parsearCotacao(texto));
    setIgnorados(new Set());
    setUnidades({});
    setCadastrados(new Set());
    setAplicado(0);
  };

  const { casados, soltos } = useMemo(
    () => (lido ? agruparCotacao(lido, itensExtras) : { casados: [], soltos: [] as LinhaCotacao[] }),
    [lido, itensExtras],
  );

  const selecionados = casados.filter((c) => !ignorados.has(c.item));

  const aplicar = () => {
    selecionados.forEach((c) => {
      definirPreco(normalizar(c.item), c.preco, c.item);
      definirFornecedor?.(normalizar(c.item), c.marca);
    });
    setAplicado(selecionados.length);
  };

  const cadastrar = (idx: number, s: LinhaCotacao) => {
    const norm = normalizar(s.nome);
    const unid = unidades[idx] ?? s.unid ?? 'kg';
    cadastrarItem?.(norm, s.nome, unid);
    definirPreco(norm, s.preco, s.nome);
    definirFornecedor?.(norm, s.marca);
    setCadastrados((c) => new Set(c).add(idx));
  };

  const cadastrarTodos = () => {
    if (!lido) return;
    const novos = new Set(cadastrados);
    soltos.forEach((s) => {
      const idx = lido.indexOf(s);
      if (novos.has(idx)) return;
      cadastrar(idx, s);
      novos.add(idx);
    });
    setCadastrados(novos);
  };

  const alternar = (item: string) =>
    setIgnorados((s) => {
      const novo = new Set(s);
      if (novo.has(item)) novo.delete(item);
      else novo.add(item);
      return novo;
    });

  /* Importa arquivo CSV, TXT ou Excel (convertido via FileReader) */
  const importarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const conteudo = ev.target?.result as string;
      if (!conteudo) return;
      // Normaliza separadores e converte para formato texto livre
      const linhas = conteudo
        .split(/\r?\n/)
        .map((l) => l.replace(/\t|;/g, ' ').trim())
        .filter(Boolean);
      const novoTexto = linhas.join('\n');
      setTexto((prev) => (prev ? prev + '\n' + novoTexto : novoTexto));
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="space-y-4">
      <Cartao className="space-y-3">
        <p className="text-sm text-carvao-500 dark:text-carvao-300">
          Cole abaixo a <strong>cotação da semana</strong> do jeito que ela chega no WhatsApp (pode colar tudo
          de uma vez: frango, bovinos, suínos, hortifrúti…). A cotação é a <strong>guia do cardápio</strong>:
          itens conhecidos recebem o menor preço automaticamente e produtos novos você{' '}
          <strong>cadastra na hora</strong> — assim o custo da semana cobre praticamente tudo.
        </p>

        {/* Upload de arquivo */}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-full border border-dashed border-carvao-300 px-4 py-2 text-[12px] font-bold text-carvao-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-carvao-600 dark:text-carvao-400">
            📂 Importar arquivo (CSV / TXT)
            <input
              type="file"
              accept=".csv,.txt,.tsv"
              className="hidden"
              onChange={importarArquivo}
            />
          </label>
          <span className="text-[11px] text-carvao-400">O conteúdo é adicionado à área de texto</span>
        </div>

        <textarea
          rows={8}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={'Ex.:\n7,00 Frango inteiro RF\nAcém Resf - Ribeiro *31,90*\nTiras de carnes\t\tR$ 43,00\nALHO KG 29,80'}
          className="w-full rounded-2xl border border-carvao-200 bg-white px-4 py-3 font-mono text-xs leading-relaxed dark:border-carvao-600 dark:bg-carvao-900"
        />
        <Botao variante="primario" className="w-full" disabled={!texto.trim()} onClick={ler}>
          🔍 Ler cotação
        </Botao>
      </Cartao>

      {lido && (
        <>
          {casados.length === 0 && soltos.length === 0 ? (
            <Cartao>
              <p className="text-sm text-carvao-400">
                Nenhum preço reconhecido. Confira se o texto tem valores no formato <code>12,34</code>.
              </p>
            </Cartao>
          ) : (
            <Cartao className="space-y-3 !p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
                <h3 className="font-display text-lg font-semibold">{casados.length} itens reconhecidos</h3>
                <span className="text-xs font-semibold text-carvao-400">
                  menor preço entre {lido.length} linhas lidas
                </span>
              </div>
              <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                {casados.map((c) => {
                  const fora = ignorados.has(c.item);
                  return (
                    <li
                      key={c.item}
                      className={`flex items-center justify-between gap-3 px-5 py-2.5 ${fora ? 'opacity-40' : ''}`}
                    >
                      <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={!fora}
                          onChange={() => alternar(c.item)}
                          className="h-4 w-4 shrink-0 accent-brand-600"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{c.item}</span>
                          <span className="block text-[11px] text-carvao-400">
                            {c.marca ? `${c.marca} · ` : ''}
                            {c.ofertas > 1 ? `melhor de ${c.ofertas} ofertas` : '1 oferta'}
                          </span>
                        </span>
                      </label>
                      <span className="shrink-0 text-sm font-bold">
                        {formatarReais(c.preco)}
                        <span className="font-normal text-carvao-400">/{c.unid}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="space-y-2 px-5 pb-4">
                <Botao
                  variante="sucesso"
                  className="w-full"
                  disabled={selecionados.length === 0}
                  onClick={aplicar}
                >
                  💰 Aplicar {selecionados.length} preços à tabela
                </Botao>
                {aplicado > 0 && (
                  <p className="text-center text-xs font-semibold text-brand-600">
                    ✓ {aplicado} preços aplicados! Agora vá em 🍽️ Cardápio e toque em “✨ Sugerir” — a sugestão
                    vai priorizar o melhor custo-benefício desta cotação.
                  </p>
                )}
              </div>
            </Cartao>
          )}

          {soltos.length > 0 && (
            <Cartao className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">
                  {soltos.length} produtos novos na cotação
                </h3>
                <button
                  onClick={cadastrarTodos}
                  className="rounded-full bg-brand-700 px-4 py-2 text-[12px] font-extrabold uppercase tracking-wide text-white shadow-suave hover:bg-brand-800"
                >
                  ➕ Cadastrar todos de uma vez
                </button>
              </div>
              <p className="text-xs text-carvao-400">
                Ainda não existem no catálogo. Cadastre todos com um toque (preço e fornecedor entram juntos)
                ou um a um ajustando a unidade — tudo cotado vira custo no app.
              </p>
              <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
                {soltos.map((s) => {
                  const idx = lido.indexOf(s);
                  const feito = cadastrados.has(idx);
                  return (
                    <li key={`${idx}-${s.nome}`} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{s.nome}</span>
                        <span className="block text-[11px] text-carvao-400">
                          {formatarReais(s.preco)}
                          {s.marca ? ` · ${s.marca}` : ''}
                        </span>
                      </span>
                      {feito ? (
                        <span className="shrink-0 text-xs font-bold uppercase text-brand-600">✓ Cadastrado</span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1.5">
                          <select
                            value={unidades[idx] ?? s.unid ?? 'kg'}
                            onChange={(e) => setUnidades((u) => ({ ...u, [idx]: e.target.value }))}
                            className="rounded-xl border border-carvao-200 bg-white px-2 py-1.5 text-xs font-bold dark:border-carvao-600 dark:bg-carvao-900"
                          >
                            {DADOS.unidades.map((u) => (
                              <option key={u}>{u}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => cadastrar(idx, s)}
                            className="rounded-full bg-brand-700 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white hover:bg-brand-800"
                          >
                            ➕ Cadastrar
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Cartao>
          )}
        </>
      )}
    </div>
  );
}
