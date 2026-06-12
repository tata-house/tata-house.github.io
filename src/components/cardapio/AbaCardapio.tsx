'use client';

import { Cartao, Botao } from '@/components/ui';
import {
  DADOS,
  DIAS_SEMANA,
  PESSOAS_PADRAO,
  proteinaDoPrato,
  ROTULO_PROTEINA,
  sugerirSemana,
  sugerirSemanaCriativa,
  temHistoricoExato,
  validarSemana,
  listaDoDia,
  custoDaLista,
  formatarReais,
} from '@/lib/cardapio/motor';
import type { DiaCardapio, EstadoSemana } from '@/lib/cardapio/tipos';
import { SeletorPrato } from './SeletorPrato';

const COR_PROTEINA: Record<string, string> = {
  bovina: 'bg-[#8a3b34]/10 text-[#8a3b34] ring-[#8a3b34]/25 dark:text-[#e0867c]',
  frango: 'bg-[#b07c1e]/10 text-[#9a6c17] ring-[#b07c1e]/25 dark:text-[#e3b45c]',
  suina: 'bg-[#b05a7e]/10 text-[#9c4a6c] ring-[#b05a7e]/25 dark:text-[#dd92b4]',
  peixe: 'bg-[#2d6f8e]/10 text-[#2d6f8e] ring-[#2d6f8e]/25 dark:text-[#7cb8d4]',
  ovo: 'bg-ouro-400/10 text-ouro-600 ring-ouro-400/25 dark:text-ouro-300',
  outros: 'bg-carvao-400/10 text-carvao-500 ring-carvao-400/25 dark:text-carvao-300',
};

function BadgeProteina({ prato }: { prato: string }) {
  if (!prato) return null;
  const p = proteinaDoPrato(prato);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${COR_PROTEINA[p]}`}
    >
      {ROTULO_PROTEINA[p]}
    </span>
  );
}

export function AbaCardapio({
  estado,
  atualizar,
  podeEditar,
  precos,
}: {
  estado: EstadoSemana;
  atualizar: (fn: (e: EstadoSemana) => EstadoSemana) => void;
  podeEditar: boolean;
  precos: Record<string, number>;
}) {
  const avisos = validarSemana(estado.dias);
  const temPrecos = Object.keys(precos).length > 0;

  const setDia = (i: number, patch: Partial<DiaCardapio>) =>
    atualizar((e) => ({
      ...e,
      dias: e.dias.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    }));

  const gerar = (criativo: boolean) => {
    const fn = criativo ? sugerirSemanaCriativa : sugerirSemana;
    const sugestao = fn(
      estado.dias.map((d) => d.pessoas),
      precos,
    );
    if (sugestao) atualizar((e) => ({ ...e, dias: sugestao }));
  };

  const custoSemana = estado.dias.reduce(
    (acc, d) => {
      if (!d.principal) return acc;
      const c = custoDaLista(listaDoDia(d), precos);
      return { total: acc.total + c.total, com: acc.com + c.itensComPreco, itens: acc.itens + c.itensTotal };
    },
    { total: 0, com: 0, itens: 0 },
  );

  return (
    <div className="space-y-4">
      {/* Orçamento + gerador */}
      <Cartao className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grow">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-carvao-400">
              Orçamento da semana (R$)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              disabled={!podeEditar}
              value={estado.orcamento ?? ''}
              placeholder="Informado pelo setor de compras"
              onChange={(e) =>
                atualizar((s) => ({ ...s, orcamento: e.target.value ? Number(e.target.value) : null }))
              }
              className="w-full min-h-12 rounded-2xl border border-carvao-200 bg-white px-4 py-3 text-base dark:border-carvao-600 dark:bg-carvao-900"
            />
          </label>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Botao variante="sucesso" disabled={!podeEditar} onClick={() => gerar(false)}>
              ✨ Sugerir pelo histórico
            </Botao>
            <Botao variante="secundario" disabled={!podeEditar} onClick={() => gerar(true)}>
              🧪 Criar semana nova
            </Botao>
          </div>
        </div>
        <p className="text-xs text-carvao-400">
          <strong>✨ Histórico</strong>: combinações que a equipe já aprovou. <strong>🧪 Criar nova</strong>:
          inventa pratos e combinações inéditas com a distribuição de alimentos da casa — e, com a cotação
          aplicada, puxa para as proteínas mais baratas da semana.
        </p>
        {temPrecos && custoSemana.com > 0 && (
          <p className="text-sm text-carvao-500 dark:text-carvao-300">
            Custo estimado da semana:{' '}
            <strong className="text-carvao-800 dark:text-areia-100">{formatarReais(custoSemana.total)}</strong>
            {estado.orcamento ? (
              <span
                className={
                  custoSemana.total <= estado.orcamento ? 'text-brand-600' : 'font-bold text-[#b04c41]'
                }
              >
                {' '}
                · {custoSemana.total <= estado.orcamento ? 'dentro do orçamento' : 'acima do orçamento'} (
                {formatarReais(estado.orcamento)})
              </span>
            ) : null}{' '}
            <span className="text-carvao-400">
              — com base em {custoSemana.com} de {custoSemana.itens} itens com preço cadastrado
            </span>
          </p>
        )}
        {!temPrecos && (
          <p className="text-xs text-carvao-400">
            Cadastre preços na aba <strong>Preços</strong> para ver o custo estimado e otimizar a sugestão.
          </p>
        )}
      </Cartao>

      {/* Validador de regras */}
      {avisos.length > 0 && (
        <Cartao className="space-y-1.5">
          {avisos.map((a, i) => (
            <p
              key={i}
              className={`flex items-start gap-2 text-sm font-medium ${
                a.nivel === 'erro'
                  ? 'text-[#b04c41]'
                  : a.nivel === 'alerta'
                    ? 'text-[#9a6c17] dark:text-[#e3b45c]'
                    : 'text-brand-600'
              }`}
            >
              <span aria-hidden>{a.nivel === 'erro' ? '⛔' : a.nivel === 'alerta' ? '⚠️' : '✅'}</span>
              {a.msg}
            </p>
          ))}
        </Cartao>
      )}

      {/* Dias */}
      <div className="grid gap-4 lg:grid-cols-2">
        {estado.dias.map((dia, i) => {
          const lista = dia.principal ? listaDoDia(dia) : [];
          const custo = custoDaLista(lista, precos);
          return (
            <Cartao key={i} className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{DIAS_SEMANA[i]}</h3>
                <label className="flex items-center gap-1.5 text-sm text-carvao-500">
                  <span aria-hidden>👥</span>
                  <input
                    type="number"
                    min={1}
                    disabled={!podeEditar}
                    value={dia.pessoas}
                    onChange={(e) => setDia(i, { pessoas: Number(e.target.value) || PESSOAS_PADRAO[i] })}
                    className="w-16 rounded-xl border border-carvao-200 bg-white px-2 py-1 text-center text-sm font-bold dark:border-carvao-600 dark:bg-carvao-900"
                  />
                </label>
              </div>

              <SeletorPrato
                rotulo="Principal"
                valor={dia.principal}
                opcoes={DADOS.listas.principais}
                aoEscolher={(v) => setDia(i, { principal: v })}
                desabilitado={!podeEditar}
                destaque={<BadgeProteina prato={dia.principal} />}
              />
              <div className="grid grid-cols-2 gap-2">
                <SeletorPrato
                  rotulo="Guarnição fixa"
                  valor={dia.guarnicaoFixa}
                  opcoes={DADOS.listas.guarnicoesFixas}
                  aoEscolher={(v) => setDia(i, { guarnicaoFixa: v })}
                  desabilitado={!podeEditar}
                />
                <SeletorPrato
                  rotulo="Guarnição"
                  valor={dia.guarnicao}
                  opcoes={DADOS.listas.guarnicoes}
                  aoEscolher={(v) => setDia(i, { guarnicao: v })}
                  desabilitado={!podeEditar}
                />
                <SeletorPrato
                  rotulo="Salada"
                  valor={dia.salada}
                  opcoes={DADOS.listas.saladas}
                  aoEscolher={(v) => setDia(i, { salada: v })}
                  desabilitado={!podeEditar}
                />
                <SeletorPrato
                  rotulo="Sobremesa"
                  valor={dia.sobremesa}
                  opcoes={DADOS.listas.sobremesas}
                  aoEscolher={(v) => setDia(i, { sobremesa: v })}
                  desabilitado={!podeEditar}
                />
              </div>

              {dia.principal && (
                <p className="text-xs text-carvao-400">
                  {temHistoricoExato(dia) ? (
                    <span className="font-semibold text-brand-600">● Combinação já usada antes</span>
                  ) : (
                    <span>○ Combinação nova — lista montada por componente</span>
                  )}
                  {' · '}
                  {lista.length} itens de compra
                  {custo.itensComPreco > 0 && <> · ≈ {formatarReais(custo.total)}</>}
                </p>
              )}
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}
