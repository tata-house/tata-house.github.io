'use client';

import { useMemo, useState } from 'react';
import { Botao, Cartao, EstadoVazio, Kpi, Modal, estiloInput, estiloRotulo } from '@/components/ui';
import { Icone } from '@/components/Icones';
import type { AvaliacaoFornecedor, PerfilFornecedor } from '@/lib/cardapio/tipos';

function Estrelas({ valor, onChange }: { valor: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`text-xl transition ${n <= valor ? 'text-ouro-400' : 'text-carvao-200 dark:text-carvao-700'} ${onChange ? 'hover:text-ouro-400' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function mediaQualidade(avs: AvaliacaoFornecedor[]): number | null {
  if (!avs.length) return null;
  return avs.reduce((s, a) => s + a.qualidade, 0) / avs.length;
}

function taxaEntregaOk(avs: AvaliacaoFornecedor[]): number | null {
  if (!avs.length) return null;
  return avs.filter((a) => a.entregaOk).length / avs.length;
}

function FormPerfil({
  inicial,
  aoSalvar,
  aoFechar,
}: {
  inicial: PerfilFornecedor;
  aoSalvar: (dados: Partial<Omit<PerfilFornecedor, 'nome' | 'avaliacoes'>>) => void;
  aoFechar: () => void;
}) {
  const [whatsapp, setWhatsapp] = useState(inicial.whatsapp ?? '');
  const [pedidoMinimo, setPedidoMinimo] = useState(inicial.pedidoMinimo ? String(inicial.pedidoMinimo) : '');
  const [prazo, setPrazo] = useState(inicial.prazoEntregaDias ? String(inicial.prazoEntregaDias) : '');
  const [pagamento, setPagamento] = useState(inicial.formaPagamento ?? '');
  const [obs, setObs] = useState(inicial.obs ?? '');

  return (
    <div className="space-y-4">
      <div>
        <label className={estiloRotulo}>WhatsApp / Contato</label>
        <input className={estiloInput} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-0000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={estiloRotulo}>Pedido mínimo (R$)</label>
          <input type="number" min={0} className={estiloInput} value={pedidoMinimo} onChange={(e) => setPedidoMinimo(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className={estiloRotulo}>Prazo (dias)</label>
          <input type="number" min={0} className={estiloInput} value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="1" />
        </div>
      </div>
      <div>
        <label className={estiloRotulo}>Forma de pagamento</label>
        <input className={estiloInput} value={pagamento} onChange={(e) => setPagamento(e.target.value)} placeholder="Pix, boleto 30d…" />
      </div>
      <div>
        <label className={estiloRotulo}>Observações</label>
        <input className={estiloInput} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Entrega só às terças, pedir até segunda…" />
      </div>
      <div className="flex gap-3 pt-2">
        <Botao variante="secundario" className="flex-1" onClick={aoFechar}>Cancelar</Botao>
        <Botao
          className="flex-1"
          onClick={() => {
            aoSalvar({
              whatsapp: whatsapp || undefined,
              pedidoMinimo: pedidoMinimo ? Number(pedidoMinimo) : undefined,
              prazoEntregaDias: prazo ? Number(prazo) : undefined,
              formaPagamento: pagamento || undefined,
              obs: obs || undefined,
            });
            aoFechar();
          }}
        >
          Salvar
        </Botao>
      </div>
    </div>
  );
}

function FormAvaliacao({
  onSalvar,
  aoFechar,
}: {
  onSalvar: (av: Omit<AvaliacaoFornecedor, 'em'>) => void;
  aoFechar: () => void;
}) {
  const [qualidade, setQualidade] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [entregaOk, setEntregaOk] = useState(true);
  const [obs, setObs] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className={estiloRotulo}>Qualidade dos produtos</label>
        <Estrelas valor={qualidade} onChange={(v) => setQualidade(v as 1 | 2 | 3 | 4 | 5)} />
      </div>
      <div>
        <label className={estiloRotulo}>Entrega</label>
        <div className="flex gap-3">
          {[true, false].map((ok) => (
            <button
              key={String(ok)}
              type="button"
              onClick={() => setEntregaOk(ok)}
              className={`flex-1 rounded-2xl border py-2.5 text-sm font-semibold transition ${
                entregaOk === ok
                  ? ok ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20' : 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20'
                  : 'border-carvao-200 text-carvao-400 dark:border-carvao-600'
              }`}
            >
              {ok ? '✓ Entregou no prazo' : '✗ Atrasou / problema'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={estiloRotulo}>Observação (opcional)</label>
        <input className={estiloInput} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="O que aconteceu?" />
      </div>
      <div className="flex gap-3 pt-2">
        <Botao variante="secundario" className="flex-1" onClick={aoFechar}>Cancelar</Botao>
        <Botao className="flex-1" onClick={() => { onSalvar({ qualidade, entregaOk, obs: obs || undefined }); aoFechar(); }}>
          Registrar
        </Botao>
      </div>
    </div>
  );
}

export function AbaFornecedorIntel({
  fornecedores,
  perfis,
  precos,
  onSalvarPerfil,
  onAdicionarAvaliacao,
}: {
  fornecedores: Record<string, string>; // item → fornecedor
  perfis: Record<string, PerfilFornecedor>;
  precos: Record<string, number>;
  onSalvarPerfil: (nome: string, dados: Partial<Omit<PerfilFornecedor, 'nome' | 'avaliacoes'>>) => void;
  onAdicionarAvaliacao: (nome: string, av: Omit<AvaliacaoFornecedor, 'em'>) => void;
}) {
  const [editando, setEditando] = useState<string | null>(null);
  const [avaliando, setAvaliando] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  // Agrupa itens por fornecedor
  const porFornecedor = useMemo(() => {
    const m = new Map<string, string[]>();
    Object.entries(fornecedores).forEach(([item, forn]) => {
      if (!forn) return;
      if (!m.has(forn)) m.set(forn, []);
      m.get(forn)!.push(item);
    });
    return m;
  }, [fornecedores]);

  // Todos os fornecedores conhecidos (do mapa de fornecedores + perfis cadastrados)
  const todosFornecedores = useMemo(() => {
    const nomes = new Set([...Array.from(porFornecedor.keys()), ...Object.keys(perfis)]);
    return Array.from(nomes).sort();
  }, [porFornecedor, perfis]);

  if (todosFornecedores.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhum fornecedor cadastrado"
        texto="Vincule fornecedores aos itens na aba Preços para começar a monitorar."
      />
    );
  }

  const perfilEditando = editando ? (perfis[editando] ?? { nome: editando, avaliacoes: [] }) : null;

  return (
    <div className="space-y-5">
      {editando && perfilEditando && (
        <Modal titulo={`Editar: ${editando}`} aberto aoFechar={() => setEditando(null)}>
          <FormPerfil
            inicial={perfilEditando}
            aoSalvar={(dados) => onSalvarPerfil(editando, dados)}
            aoFechar={() => setEditando(null)}
          />
        </Modal>
      )}
      {avaliando && (
        <Modal titulo={`Avaliar: ${avaliando}`} aberto aoFechar={() => setAvaliando(null)}>
          <FormAvaliacao
            onSalvar={(av) => onAdicionarAvaliacao(avaliando, av)}
            aoFechar={() => setAvaliando(null)}
          />
        </Modal>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi rotulo="Fornecedores" valor={todosFornecedores.length} tom="neutro" />
        <Kpi
          rotulo="Avaliados"
          valor={Object.values(perfis).filter((p) => p.avaliacoes.length > 0).length}
          tom="verde"
        />
        <Kpi
          rotulo="Alertas"
          valor={Object.values(perfis).filter((p) => {
            const taxa = taxaEntregaOk(p.avaliacoes);
            return taxa !== null && taxa < 0.7;
          }).length}
          tom="vermelho"
        />
      </div>

      {/* Lista de fornecedores */}
      <div className="space-y-3">
        {todosFornecedores.map((nome) => {
          const perfil = perfis[nome];
          const avs = perfil?.avaliacoes ?? [];
          const mediaQ = mediaQualidade(avs);
          const taxaOk = taxaEntregaOk(avs);
          const itens = porFornecedor.get(nome) ?? [];
          const exp = expandido === nome;

          return (
            <Cartao key={nome} className="!p-0">
              <div
                className="flex cursor-pointer items-start justify-between gap-3 p-4"
                onClick={() => setExpandido(exp ? null : nome)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-carvao-900 dark:text-white">{nome}</p>
                    {avs.length > 0 && (
                      <span className="text-xs text-ouro-500">
                        {'★'.repeat(Math.round(mediaQ ?? 0))}
                        {'☆'.repeat(5 - Math.round(mediaQ ?? 0))}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-carvao-400">
                    <span>{itens.length} item(ns)</span>
                    {perfil?.pedidoMinimo && <span>Mín. R$ {perfil.pedidoMinimo}</span>}
                    {perfil?.prazoEntregaDias && <span>{perfil.prazoEntregaDias}d prazo</span>}
                    {perfil?.formaPagamento && <span>{perfil.formaPagamento}</span>}
                    {taxaOk !== null && (
                      <span className={taxaOk < 0.7 ? 'text-red-500 dark:text-red-400' : 'text-brand-600 dark:text-brand-400'}>
                        {Math.round(taxaOk * 100)}% entrega ok
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setAvaliando(nome); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ouro-500 hover:bg-ouro-50 dark:hover:bg-carvao-700"
                    title="Avaliar entrega"
                  >
                    
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditando(nome); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-carvao-400 hover:bg-carvao-100 dark:hover:bg-carvao-700"
                    title="Editar perfil"
                  >
                    <Icone nome="ajustes" tam={15} />
                  </button>
                  <Icone nome={exp ? 'baixo' : 'proximo'} tam={15} className="text-carvao-300" />
                </div>
              </div>

              {exp && (
                <div className="border-t border-carvao-100 px-4 pb-4 pt-3 dark:border-carvao-700">
                  {/* Itens que fornece */}
                  {itens.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 text-micro font-bold uppercase tracking-widest text-carvao-400">Itens fornecidos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {itens.slice(0, 12).map((it) => (
                          <span key={it} className="rounded-full bg-carvao-100 px-2 py-0.5 text-caption font-semibold text-carvao-600 dark:bg-carvao-700 dark:text-carvao-300">
                            {it} {precos[it] ? `· R$ ${precos[it].toFixed(2)}` : ''}
                          </span>
                        ))}
                        {itens.length > 12 && <span className="text-xs text-carvao-400">+{itens.length - 12}</span>}
                      </div>
                    </div>
                  )}

                  {/* Contato */}
                  {perfil?.whatsapp && (
                    <p className="mb-2 text-sm text-carvao-600 dark:text-carvao-300">
                      {perfil.whatsapp}
                    </p>
                  )}
                  {perfil?.obs && (
                    <p className="mb-3 text-xs italic text-carvao-400">{perfil.obs}</p>
                  )}

                  {/* Histórico de avaliações */}
                  {avs.length > 0 && (
                    <div>
                      <p className="mb-2 text-micro font-bold uppercase tracking-widest text-carvao-400">Últimas avaliações</p>
                      <div className="space-y-1.5">
                        {avs.slice(0, 4).map((av, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-xl bg-carvao-50 px-3 py-2 dark:bg-carvao-800">
                            <span className="text-xs text-ouro-500">{'★'.repeat(av.qualidade)}</span>
                            <span className={`text-xs font-semibold ${av.entregaOk ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}>
                              {av.entregaOk ? '✓ entregou' : '✗ problema'}
                            </span>
                            {av.obs && <span className="text-xs text-carvao-400 truncate">{av.obs}</span>}
                            <span className="ml-auto shrink-0 text-micro text-carvao-300">
                              {new Date(av.em).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {avs.length === 0 && (
                    <p className="text-center text-xs text-carvao-400">
                      Sem avaliações ainda. Registre após cada entrega.
                    </p>
                  )}
                </div>
              )}
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}
