'use client';

import { Botao, Cartao, EstadoVazio, Kpi, Pilula, Secao } from '@/components/ui';
import { useAuditoria } from '@/lib/cardapio/estado';
import { PAPEIS, ROTULO_PAPEL, pode } from '@/lib/cardapio/org';
import type { Papel, Permissao } from '@/lib/cardapio/tipos';

const PERMISSOES: { id: Permissao; rotulo: string }[] = [
  { id: 'cardapio:editar', rotulo: 'Editar cardápio' },
  { id: 'cardapio:aprovar', rotulo: 'Aprovar' },
  { id: 'compras:gerenciar', rotulo: 'Compras' },
  { id: 'recebimento:registrar', rotulo: 'Recebimento' },
  { id: 'estoque:gerenciar', rotulo: 'Estoque' },
  { id: 'precos:editar', rotulo: 'Preços' },
  { id: 'auditoria:ver', rotulo: 'Auditoria' },
  { id: 'config:gerenciar', rotulo: 'Config' },
];

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  return String(v);
}

export function AbaAuditoria({ papel }: { papel: Papel }) {
  const { registros, limpar } = useAuditoria();
  const podeVer = pode(papel, 'auditoria:ver');

  if (!podeVer) {
    return (
      <EstadoVazio
        icone="🔒"
        titulo="Acesso restrito"
        texto="A trilha de auditoria é visível apenas para Gerência. Saia e entre com o perfil de Gerência para visualizar."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Kpi rotulo="Ações registradas" valor={registros.length} tom="azul" icone="🛡️" />
        <Kpi rotulo="Última ação" valor={registros[0] ? new Date(registros[0].em).toLocaleDateString('pt-BR') : '—'} tom="neutro" icone="🕒" />
      </div>

      {/* Matriz de permissões (M10) */}
      <Secao titulo="🔑 Acessos por papel">
        <Cartao className="overflow-x-auto !p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-carvao-100 dark:border-carvao-700/60">
                <th className="px-3 py-2.5 text-left text-caption font-extrabold uppercase tracking-wider text-carvao-400">Papel</th>
                {PERMISSOES.map((p) => (
                  <th key={p.id} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase text-carvao-400">
                    {p.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAPEIS.map((pa) => (
                <tr key={pa.id} className="border-b border-carvao-50 last:border-0 dark:border-carvao-800">
                  <td className="px-3 py-2 font-semibold">{pa.rotulo}</td>
                  {PERMISSOES.map((pe) => (
                    <td key={pe.id} className="px-2 py-2 text-center">
                      {pode(pa.id, pe.id) ? (
                        <span className="text-brand-600 dark:text-brand-400">●</span>
                      ) : (
                        <span className="text-carvao-200 dark:text-carvao-700">○</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Cartao>
        <p className="text-xs text-carvao-400">
          Esta matriz é a fonte única de permissões — pronta para virar regras RLS por empresa/unidade quando migrar para o
          Supabase.
        </p>
      </Secao>

      {/* Trilha de auditoria */}
      <Secao
        titulo="🛡️ Trilha de auditoria"
        acao={
          registros.length > 0 && (
            <Botao variante="secundario" className="!min-h-9 !px-3 !py-1.5 !text-caption" onClick={limpar}>
              Limpar
            </Botao>
          )
        }
      >
        {registros.length === 0 ? (
          <EstadoVazio icone="🛡️" titulo="Nenhuma ação registrada ainda" texto="Alterações de preço, fornecedor, estoque, etapas do fluxo e desperdício aparecem aqui automaticamente." />
        ) : (
          <Cartao className="!p-0">
            <ul className="divide-y divide-carvao-100 dark:divide-carvao-700/60">
              {registros.slice(0, 200).map((r, i) => (
                <li key={i} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{r.acao}</span>{' '}
                      <span className="text-carvao-500 dark:text-areia-200">· {r.alvo}</span>
                    </p>
                    <p className="text-caption text-carvao-400">
                      {(r.de !== undefined || r.para !== undefined) && (
                        <>
                          {fmt(r.de)} → <strong>{fmt(r.para)}</strong> ·{' '}
                        </>
                      )}
                      {new Date(r.em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Pilula tom="neutro">{ROTULO_PAPEL[r.papel]}</Pilula>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </Secao>
    </div>
  );
}
