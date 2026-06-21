/* =====================================================================
   Manual do Sistema — Tatá House
   Documentação completa para toda a equipe.
   ===================================================================== */

import { Icone } from '@/components/Icones';
import { BotaoBaixarManual } from './BotaoBaixarManual';

export const metadata = {
  title: 'Manual do Sistema — Tatá House',
  description: 'Guia completo do sistema de gestão do Tatá House — cardápio, compras, estoque, IA e muito mais.',
};

/* ── Componentes de layout ──────────────────────────────────── */

function Capa() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f3d26] via-[#1a5c3a] to-[#0f3d26] px-8 py-14 text-center shadow-2xl">
      {/* padrão de pontos decorativo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* brilho central */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 shadow-xl ring-1 ring-white/20">
          <Icone nome="gerencial" tam={48} className="text-white" />
        </div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-green-300/70">
          Sistema de Gestão
        </p>
        <h1 className="font-display text-4xl font-bold text-white drop-shadow-md">
          Tatá House
        </h1>
        <p className="mt-2 text-xl font-semibold text-green-200">Manual Completo do Sistema</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { num: '5', label: 'abas principais' },
            { num: '20+', label: 'funcionalidades' },
            { num: '3 anos', label: 'de histórico' },
            { num: 'IA', label: 'integrada' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-2 text-center ring-1 ring-white/10">
              <p className="font-display text-lg font-bold text-white">{s.num}</p>
              <p className="text-micro text-green-200">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-green-300/80">
          Guia oficial para toda a equipe — cozinha, compras, recebimento e gestão
        </p>
      </div>
    </div>
  );
}

function Indice() {
  const capitulos = [
    { num: '01', nome: 'Como entrar no sistema', ancora: 'acesso' },
    { num: '02', nome: 'Início — o painel de comando', ancora: 'painel' },
    { num: '03', nome: 'Contador de refeições', ancora: 'contador' },
    { num: '04', nome: 'Cardápio — montar a semana', ancora: 'cardapio' },
    { num: '05', nome: 'Como Fazer — receitas inteligentes', ancora: 'comofazer' },
    { num: '06', nome: 'Avaliação e desperdício', ancora: 'avaliacao' },
    { num: '07', nome: 'Cotação — preços com IA', ancora: 'cotacao' },
    { num: '08', nome: 'Nota Fiscal — leitura automática', ancora: 'nf' },
    { num: '09', nome: 'Lista de compras', ancora: 'compras' },
    { num: '10', nome: 'Estoque — o que temos', ancora: 'estoque' },
    { num: '11', nome: 'Fornecedores e Pedidos', ancora: 'fornecedores' },
    { num: '12', nome: 'Relatórios — visão gerencial', ancora: 'relatorios' },
    { num: '13', nome: 'DNA e Rankings da casa', ancora: 'dna' },
    { num: '14', nome: 'Previsão de demanda', ancora: 'previsao' },
    { num: '15', nome: 'Simulador de cenários', ancora: 'simulador' },
    { num: '16', nome: 'Assistente de IA', ancora: 'assistente' },
    { num: '17', nome: 'Equipe e restrições alimentares', ancora: 'equipe' },
    { num: '18', nome: 'Etapas da semana — o Fluxo', ancora: 'fluxo' },
    { num: '19', nome: 'Quem pode fazer o quê', ancora: 'papeis' },
    { num: '20', nome: 'Perguntas frequentes', ancora: 'faq' },
  ];

  return (
    <section id="indice" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a5c3a]/10 text-xl">
          📖
        </div>
        <h2 className="font-display text-xl font-bold text-gray-800">O que tem neste manual</h2>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {capitulos.map((it) => (
          <a
            key={it.ancora}
            href={`#${it.ancora}`}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-green-50 active:bg-green-100"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a5c3a] text-[10px] font-bold text-white">
              {it.num}
            </span>
            <span className="text-sm font-medium text-gray-700">{it.nome}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ── Blocos reutilizáveis ──────────────────────────────────── */

function Secao({
  id, emoji, titulo, subtitulo, badge, children,
}: {
  id: string; emoji: string; titulo: string; subtitulo?: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a5c3a]/10 text-2xl">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-gray-800">{titulo}</h2>
            {badge && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
                {badge}
              </span>
            )}
          </div>
          {subtitulo && <p className="mt-0.5 text-sm text-gray-500">{subtitulo}</p>}
        </div>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

function Destaque({
  icone, texto, cor = 'green',
}: {
  icone?: string; texto: string; cor?: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
}) {
  const cores: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${cores[cor]}`}>
      {icone && <span className="shrink-0 text-xl leading-none">{icone}</span>}
      <p className="text-sm font-medium leading-relaxed">{texto}</p>
    </div>
  );
}

function Passo({ num, titulo, texto }: { num: number; titulo: string; texto: string }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c3a] text-sm font-bold text-white">
        {num}
      </span>
      <div>
        <p className="font-semibold text-gray-800">{titulo}</p>
        <p className="mt-0.5 text-sm text-gray-600">{texto}</p>
      </div>
    </div>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-2">
      {itens.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-0.5 shrink-0 text-[#1a5c3a]">✓</span>
          <span className="text-sm">{it}</span>
        </li>
      ))}
    </ul>
  );
}

function CardInfo({ titulo, desc, cor = 'gray' }: { titulo: string; desc: string; cor?: string }) {
  const bg: Record<string, string> = {
    gray: 'bg-gray-50',
    green: 'bg-green-50 border border-green-100',
    blue: 'bg-blue-50 border border-blue-100',
    yellow: 'bg-yellow-50 border border-yellow-100',
    purple: 'bg-purple-50 border border-purple-100',
    orange: 'bg-orange-50 border border-orange-100',
  };
  const title: Record<string, string> = {
    gray: 'text-gray-800', green: 'text-green-800', blue: 'text-blue-800',
    yellow: 'text-yellow-800', purple: 'text-purple-800', orange: 'text-orange-800',
  };
  const sub: Record<string, string> = {
    gray: 'text-gray-600', green: 'text-green-700', blue: 'text-blue-700',
    yellow: 'text-yellow-700', purple: 'text-purple-700', orange: 'text-orange-700',
  };
  return (
    <div className={`rounded-2xl p-4 ${bg[cor]}`}>
      <p className={`mb-1 font-bold ${title[cor]}`}>{titulo}</p>
      <p className={`text-sm ${sub[cor]}`}>{desc}</p>
    </div>
  );
}

function SubAba({ rotulo, desc }: { rotulo: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#1a5c3a] text-[9px] font-bold text-white">
        →
      </span>
      <div>
        <p className="text-sm font-bold text-gray-800">{rotulo}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

function Badge({ label, cor = 'green' }: { label: string; cor?: string }) {
  const c: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-200 text-gray-700',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c[cor]}`}>
      {label}
    </span>
  );
}

function TabelaPapeis() {
  const linhas = [
    {
      papel: 'Gestor', cor: 'bg-[#1a5c3a]',
      pode: [
        'Montar o cardápio da semana',
        'Ver todos os relatórios e análises',
        'Aprovar e avançar todas as etapas',
        'Configurar o sistema e PINs',
        'Acessar o painel de inteligência',
        'Simular cenários financeiros',
        'Ver auditoria de alterações',
      ],
    },
    {
      papel: 'Cozinha', cor: 'bg-orange-500',
      pode: [
        'Ver o cardápio da semana',
        'Consultar o "Como Fazer" de cada prato',
        'Avançar a etapa "Cozinha"',
        'Registrar sobras e desperdício',
        'Ver o contador de refeições',
      ],
    },
    {
      papel: 'Compras', cor: 'bg-blue-600',
      pode: [
        'Ver e imprimir a lista de compras',
        'Marcar itens como comprados',
        'Registrar preços pagos',
        'Lançar cotações de fornecedores',
        'Fotografar nota fiscal (leitura por IA)',
        'Avançar a etapa "Compras"',
      ],
    },
    {
      papel: 'Recebimento', cor: 'bg-purple-600',
      pode: [
        'Marcar itens como recebidos',
        'Registrar preço real pago',
        'Avançar a etapa "Recebimento"',
        'Ver o estoque atual',
      ],
    },
    {
      papel: 'Administrador', cor: 'bg-gray-700',
      pode: [
        'Tudo que o Gestor faz',
        'Exportar auditoria completa',
        'Gerenciar usuários e permissões',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {linhas.map((l) => (
        <div key={l.papel} className="rounded-2xl bg-gray-50 p-4">
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white ${l.cor}`}>
            {l.papel}
          </span>
          <ul className="mt-3 space-y-1">
            {l.pode.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-green-600">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ── Página principal ──────────────────────────────────────── */

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm 1.8cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { break-inside: avoid; page-break-inside: avoid; }
          section + section { margin-top: 1.5rem; }
          .shadow-sm, .shadow-2xl, .shadow-xl { box-shadow: none !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">

        <Capa />
        <BotaoBaixarManual />
        <Indice />

        {/* ═══════════════════════════════════════════════════
            01 — ACESSO
        ════════════════════════════════════════════════════ */}
        <Secao id="acesso" emoji="🔐" titulo="Como entrar no sistema"
          subtitulo="Primeiro acesso — celular, tablet ou computador. Sem instalar nada.">

          <Destaque cor="green" icone="✅"
            texto="O sistema funciona direto no navegador — Chrome, Safari ou Edge. Não precisa baixar nenhum aplicativo." />

          <div className="space-y-4">
            <Passo num={1} titulo="Abra o navegador do seu celular"
              texto='Use Chrome (Android) ou Safari (iPhone). Procure o ícone colorido na tela inicial.' />
            <Passo num={2} titulo="Digite o endereço fornecido pelo gestor"
              texto='O endereço fica salvo no seu histórico depois do primeiro acesso. Peça ao gestor se não tiver.' />
            <Passo num={3} titulo="Escolha o seu cargo"
              texto='Na tela inicial selecione: Gestor, Cozinha, Compras, Recebimento ou Administrador.' />
            <Passo num={4} titulo="Pronto — você está dentro"
              texto='O sistema lembra do seu cargo mesmo se você fechar o celular ou desligar a tela.' />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto='Dica de ouro: adicione o site na tela inicial do celular. Toque em "Compartilhar" (iPhone) ou "⋮ → Adicionar à tela inicial" (Android). Fica igual a um app e abre mais rápido!' />

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-bold text-gray-800">🔄 Mudar de cargo</p>
            <p className="text-sm text-gray-600">
              Acesse <strong>Ajustes → Configurações de acesso</strong> e informe o PIN do cargo desejado.
              Cada cargo tem um PIN específico definido pelo gestor.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            02 — PAINEL
        ════════════════════════════════════════════════════ */}
        <Secao id="painel" emoji="🏠" titulo="Início — o painel de comando"
          subtitulo="A primeira tela que aparece ao entrar. Mostra tudo o que importa agora.">

          <Destaque cor="green" icone="🌅"
            texto='Abra o sistema toda manhã e leia o Briefing do dia. Ele reúne os alertas mais importantes antes de você começar a trabalhar.' />

          <p>O Início tem cinco blocos principais:</p>

          <div className="space-y-3">
            <CardInfo
              titulo="📋 Briefing do dia"
              desc="Card inteligente no topo que reúne alertas urgentes (vermelho), atenções (amarelo) e boas notícias (verde). Avisa sobre estoque baixo, pratos sem preço, desperdício alto e muito mais."
              cor="green"
            />
            <CardInfo
              titulo="📊 KPIs da semana"
              desc="Quatro números de leitura rápida: custo total da semana, custo por refeição, aceitação média dos pratos e percentual de desperdício. Atualizam em tempo real conforme você registra dados."
              cor="blue"
            />
            <CardInfo
              titulo="⚡ Destaque da IA"
              desc="Quando o Assistente identifica algo crítico — preço que subiu muito, prato rejeitado, orçamento estorado — aparece aqui como um aviso dourado. Toque para ver a análise completa."
              cor="yellow"
            />
            <CardInfo
              titulo="🔄 Fluxo da semana"
              desc="Barra de progresso mostrando em qual etapa a semana está: Rascunho → Cozinha → Compras → Recebimento → Concluído. Cada equipe avança a sua etapa."
              cor="gray"
            />
            <CardInfo
              titulo="🍽️ Contador de refeições"
              desc="Logo abaixo do fluxo: registre almoço e jantar do dia, veja a semana, o ano e o total histórico. Explica mais no capítulo 03."
              cor="green"
            />
          </div>

          <Destaque cor="blue" icone="📱"
            texto="O Painel se adapta ao cargo. A equipe de cozinha vê o cardápio e o contador. O gestor vê tudo. Não se preocupe se a tela de um colega parecer diferente da sua." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            03 — CONTADOR DE REFEIÇÕES
        ════════════════════════════════════════════════════ */}
        <Secao id="contador" emoji="🍽️" titulo="Contador de Refeições" badge="Novo"
          subtitulo="Registre quantas pessoas comeram. O sistema já tem 3 anos de histórico pré-carregado.">

          <Destaque cor="green" icone="📈"
            texto="O sistema já vem com 32.837 refeições registradas desde setembro de 2024 — extraídas do histórico do WhatsApp da equipe. Você nunca parte do zero." />

          <p>O contador fica na aba <strong>Início</strong>, logo abaixo do Fluxo da semana. Ele mostra:</p>

          <div className="space-y-3">
            <CardInfo titulo="Hoje" desc="Campos de Almoço e Jantar. Digite os números e pressione Enter ou toque em OK. Se errou, toque em Editar para corrigir." cor="green" />
            <CardInfo titulo="Esta semana" desc="Total de refeições de segunda-feira até hoje, somando almoço e jantar." cor="blue" />
            <CardInfo titulo="Este ano" desc="Total do ano atual, com comparação percentual em relação ao ano anterior. Ex: +12% vs 2025." cor="blue" />
            <CardInfo titulo="Ano passado" desc="Total do ano anterior para referência direta." cor="gray" />
            <CardInfo titulo="Total histórico" desc="Todas as refeições registradas desde o início — o patrimônio de dados do Tatá House." cor="gray" />
            <CardInfo titulo="Gráfico de 12 meses" desc="Barras mensais dos últimos 12 meses. Passe o dedo ou o mouse sobre uma barra para ver o número exato." cor="purple" />
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="mb-2 font-bold text-orange-800">⚠️ Alerta de Pico</p>
            <p className="text-sm text-orange-700">
              Se o total do dia ultrapassar <strong>120% da média histórica</strong> daquele dia da semana,
              o card fica dourado e aparece a tag "Pico ↑X%". O sistema avisa:
              <em> "Dia acima da média — revise porções e estoque."</em>
            </p>
            <p className="mt-2 text-sm text-orange-700">
              Essa média vem de mais de 1.400 registros reais do WhatsApp ao longo de 3 anos —
              é uma base sólida para saber quando algo está fora do normal.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 font-bold text-blue-800">💰 Custo estimado do dia</p>
            <p className="text-sm text-blue-700">
              Se os preços da semana estiverem lançados, o sistema mostra automaticamente
              o <strong>custo total estimado do dia</strong> (número de refeições × custo/refeição da semana).
              Ex: 72 refeições × R$ 8,40 = <strong>R$ 604,80</strong> hoje.
            </p>
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Anote o número de almoços"
              texto='Ao final do almoço, conte ou pergunte à equipe. Digite no campo "Almoço".' />
            <Passo num={2} titulo="Anote o número de jantares"
              texto='Ao final do jantar, faça o mesmo no campo "Jantar".' />
            <Passo num={3} titulo="Toque em OK"
              texto='O botão fica verde com ✓ por 3 segundos confirmando o registro. As estatísticas atualizam imediatamente.' />
            <Passo num={4} titulo="Se errar, toque em Editar"
              texto='Os campos são preenchidos de volta com os valores salvos. Corrija e toque em OK novamente.' />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto="Os campos mostram a média esperada para aquele dia como placeholder. Ex: na Sexta, o campo já mostra 38 (almoço) e 33 (jantar) como referência — a média real dos últimas 3 anos." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            04 — CARDÁPIO
        ════════════════════════════════════════════════════ */}
        <Secao id="cardapio" emoji="📅" titulo="Cardápio — montar a semana"
          subtitulo="Define o que será servido em cada dia. Gerado automaticamente para a lista de compras.">

          <Destaque cor="green" icone="👨‍🍳"
            texto="Quem monta o cardápio é o Gestor. A Cozinha pode ver tudo mas não altera. A lista de compras é gerada automaticamente a partir do cardápio." />

          <p>A aba Cardápio tem três sub-abas:</p>

          <div className="space-y-2">
            <SubAba rotulo="Cardápio — montar" desc="Selecionar pratos, guarnições, saladas e sobremesas para cada dia da semana." />
            <SubAba rotulo="Operação" desc="Passo a passo das receitas, quantidades do dia, avaliação de pratos e registro de sobras." />
            <SubAba rotulo="Avaliação" desc="Visualização das notas e comentários recebidos. Aparece após a semana avançar para Recebimento ou Conclusão." />
          </div>

          <p className="font-semibold text-gray-800">Montando o cardápio:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Escolha a semana"
              texto='Toque na data no topo da tela. Aparece uma lista de semanas registradas — selecione a que quer montar ou use as setas ← →.' />
            <Passo num={2} titulo="Clique em cada dia"
              texto='Toque em Segunda, Terça, etc. Selecione o prato principal digitando o nome ou escolhendo da lista.' />
            <Passo num={3} titulo="Preencha os complementos"
              texto='Guarnição, Salada e Sobremesa. Arroz e Feijão já aparecem automaticamente — você só altera se mudar.' />
            <Passo num={4} titulo="Ajuste o número de pessoas"
              texto='Cada dia tem um campo de refeições. O sistema sugere com base no histórico real. Você pode mudar se souber de um evento especial.' />
            <Passo num={5} titulo="Salve — automático"
              texto='O sistema salva a cada mudança. Não existe botão de salvar — nunca perca dados por esquecer.' />
          </div>

          <p className="font-semibold text-gray-800">Recursos inteligentes do cardápio:</p>

          <div className="space-y-2">
            <CardInfo titulo="🤖 Sugestão do Chef IA"
              desc="O sistema analisa o histórico de aceitação, custo e variedade e sugere pratos para cada dia. Toque em 'Chef IA' para ver as sugestões com justificativa."
              cor="green" />
            <CardInfo titulo="🔄 Anti-monotonia"
              desc="Se a mesma proteína aparecer muitas vezes na semana, um alerta avisa. Ex: 'Frango 3× esta semana — considere variar.'"
              cor="yellow" />
            <CardInfo titulo="🥗 Indicador nutricional"
              desc="Mostra o equilíbrio entre proteína, carboidrato, verdura e fibra ao longo da semana. Priorize o verde para uma semana equilibrada."
              cor="blue" />
            <CardInfo titulo="💰 Custo estimado"
              desc="Conforme os preços são lançados, o custo por pessoa aparece ao lado de cada prato e o total da semana atualiza em tempo real."
              cor="gray" />
            <CardInfo titulo="🔖 QR Code para avaliação"
              desc="Gere um QR Code para colar no refeitório. A equipe escaneia com o celular e avalia o prato do dia em segundos."
              cor="purple" />
          </div>

          <Destaque cor="yellow" icone="⚠️"
            texto='Se um prato aparecer com "!" é porque o preço ainda não foi lançado. Sem preço, o custo da semana fica incompleto e a lista de compras pode estar errada.' />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            05 — COMO FAZER
        ════════════════════════════════════════════════════ */}
        <Secao id="comofazer" emoji="👩‍🍳" titulo="Como Fazer — receitas inteligentes" badge="Novo"
          subtitulo="Passo a passo de cada prato, com quantidades calculadas automaticamente para o dia de hoje.">

          <Destaque cor="green" icone="✨"
            texto="O botão 'Como fazer' fica em cada prato do cardápio. Toque nele para ver o passo a passo completo, os ingredientes e as quantidades já calculadas para hoje — sem precisar fazer conta." />

          <p>O que aparece ao tocar em <strong>Como fazer</strong>:</p>

          <div className="space-y-2">
            <CardInfo titulo="⚡ Resumo rápido"
              desc="Chips coloridos no topo: classe do prato (Econômica / Equilibrada / Premium), tempo de preparo em minutos, complexidade (Fácil / Médio / Elaborado) e porção média em gramas."
              cor="blue" />
            <CardInfo titulo="📋 Modo de preparo"
              desc="Passo a passo numerado da receita, do início ao fim. Linguagem simples, direto ao ponto. A cozinha pode consultar no celular durante o preparo."
              cor="gray" />
            <CardInfo titulo="🎯 Para hoje — quantidades automáticas"
              desc="A seção mais importante. Mostra cada ingrediente com a quantidade calculada para o número médio de refeições do dia atual. Ex: numa Sexta (~70 refeições): Frango 14 kg, Alho 200 g, etc."
              cor="green" />
            <CardInfo titulo="👤 Por pessoa — referência"
              desc="Quantidades base por porção individual. Útil para calcular para qualquer número diferente da média do dia."
              cor="gray" />
            <CardInfo titulo="🥦 Nutrição por porção"
              desc="Tabela com Calorias, Proteínas, Carboidratos, Gorduras, Fibras e Sódio. Referência para cardápios equilibrados."
              cor="purple" />
            <CardInfo titulo="🔀 Substituições"
              desc="Lista de ingredientes alternativos caso falte algum item. Ex: 'frango pode ser substituído por tilápia ou grão-de-bico'."
              cor="yellow" />
            <CardInfo titulo="💡 Dica de produção"
              desc="Truque específico do prato. Ex: 'Marinar por 2 horas antes de grelhar para melhor resultado'."
              cor="orange" />
          </div>

          <div className="rounded-2xl bg-[#1a5c3a]/5 p-4 ring-1 ring-[#1a5c3a]/10">
            <p className="mb-2 font-bold text-[#1a5c3a]">📊 Como as quantidades são calculadas?</p>
            <p className="text-sm text-gray-700">
              O sistema usa a <strong>média histórica real</strong> de cada dia da semana — calculada a partir de
              mais de 1.400 registros reais do WhatsApp ao longo de 3 anos. Na Sexta-feira, por exemplo,
              a média é de <strong>~70 refeições</strong> (38 almoço + 33 jantar). Todos os ingredientes
              são multiplicados por esse número automaticamente.
            </p>
            <p className="mt-2 text-sm text-gray-700">
              Médias por dia: Domingo ~82 · Segunda ~63 · Terça ~58 · Quarta ~65 · Quinta ~68 · Sexta ~70 · Sábado ~65
            </p>
          </div>

          <Destaque cor="blue" icone="📱"
            texto="A receita fica numa janela que desliza da base da tela. Você pode rolar enquanto cozinha sem sair do cardápio. Feche tocando em X ou arrastando para baixo." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            06 — AVALIAÇÃO E DESPERDÍCIO
        ════════════════════════════════════════════════════ */}
        <Secao id="avaliacao" emoji="⭐" titulo="Avaliação e desperdício"
          subtitulo="Quanto a equipe gostou do prato e o que sobrou — dados que melhoram o cardápio automaticamente.">

          <p className="font-semibold text-gray-800">Avaliação — o que a equipe achou:</p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">QR Code no refeitório (recomendado)</p>
              <p className="mb-3 text-sm text-gray-600">
                Imprima o QR Code na sub-aba Cardápio e cole na parede do refeitório.
                A equipe escaneia com o celular e avalia com um toque — menos de 20 segundos.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[['😍', 'Ótimo', 'green'], ['😐', 'Regular', 'yellow'], ['😞', 'Ruim', 'red']].map(([emoji, rot, cor]) => (
                  <div key={rot} className={`rounded-xl p-2 text-center ring-1 ${cor === 'green' ? 'bg-green-50 ring-green-100' : cor === 'yellow' ? 'bg-yellow-50 ring-yellow-100' : 'bg-red-50 ring-red-100'}`}>
                    <div className="text-2xl">{emoji}</div>
                    <div className={`mt-1 text-xs font-bold ${cor === 'green' ? 'text-green-700' : cor === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>{rot}</div>
                  </div>
                ))}
              </div>
            </div>
            <CardInfo titulo="Avaliação manual pelo gestor"
              desc="Na sub-aba Avaliação do Cardápio, o gestor pode registrar nota de 1 a 5 e adicionar comentário para cada prato."
              cor="gray" />
          </div>

          <p className="font-semibold text-gray-800">O que o sistema faz com as avaliações:</p>
          <Lista itens={[
            'Calcula a nota média de cada prato ao longo do tempo',
            'Pratos com nota baixa aparecem em vermelho no Painel de Aceitação',
            'O sistema sugere retirar do cardápio pratos rejeitados repetidamente',
            'Pratos favoritos aparecem com destaque no DNA da casa',
            'O Chef IA evita sugerir pratos mal avaliados',
          ]} />

          <p className="font-semibold text-gray-800">Desperdício — o que sobrou:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Acesse Cardápio → Operação após o serviço"
              texto='A seção de desperdício aparece no final da semana, na sub-aba Operação.' />
            <Passo num={2} titulo="Informe o produzido e o consumido"
              texto='Ex: produziu 80 porções, consumiu 67. O sistema calcula: 13 sobras = 16% de desperdício.' />
            <Passo num={3} titulo="Adicione o motivo (opcional mas valioso)"
              texto='"Prato não agradou", "evento cancelado", "quantidade calculada errada". Ajuda o sistema a aprender.' />
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-bold text-gray-800">📉 O que o sistema calcula automaticamente:</p>
            <Lista itens={[
              'Custo em reais do que foi jogado fora (kg desperdiçado × custo do ingrediente)',
              'Ranking dos pratos que mais desperdiçam',
              'Sugestão de reduzir produção na próxima vez que o prato entrar no cardápio',
              'Alerta no Painel quando o desperdício semanal ultrapassa 15%',
            ]} />
          </div>

          <Destaque cor="green" icone="💰"
            texto="Reduzir o desperdício de 18% para 8% pode economizar R$ 800 ou mais por mês. Vale muito a pena registrar toda semana — mesmo que seja um número aproximado." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            07 — COTAÇÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="cotacao" emoji="💬" titulo="Cotação — preços com IA"
          subtitulo="Cole a mensagem do fornecedor e a IA lê tudo automaticamente — itens, preços e fornecedor.">

          <Destaque cor="blue" icone="🤖"
            texto="Cole o texto que chegou no WhatsApp do fornecedor. A IA identifica automaticamente cada item e seu preço — sem precisar digitar nada manualmente." />

          <p>A Cotação fica em <strong>Compras → Cotação</strong> (no sistema atual integrada na aba Compras).</p>

          <p className="font-semibold text-gray-800">Como lançar uma cotação:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Copie a mensagem do fornecedor"
              texto='Abra o WhatsApp, toque e segure na mensagem do fornecedor com os preços, depois copie.' />
            <Passo num={2} titulo='Cole na caixa de texto e clique em "Analisar"'
              texto='A IA lê o texto, identifica os itens (Frango, Acém, etc.) e os preços, e monta a tabela de cotação.' />
            <Passo num={3} titulo="Revise o resultado"
              texto='Verifique se o fornecedor foi identificado corretamente. Todos os fornecedores cadastrados (WG, Apetito, Vita Frango, Jampac, Frito Sul...) são reconhecidos automaticamente.' />
            <Passo num={4} titulo='Clique em "Aplicar preços"'
              texto='Os preços entram no sistema e o custo estimado da semana atualiza imediatamente.' />
          </div>

          <p className="font-semibold text-gray-800">Se tiver mais de um fornecedor:</p>
          <Lista itens={[
            'Lance as cotações de cada fornecedor separadamente',
            'O sistema compara automaticamente e marca o mais barato de cada item',
            'Você vê lado a lado qual fornecedor é melhor para cada produto',
            'Use a validação histórica para saber se o preço está dentro do esperado',
          ]} />

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="mb-2 font-bold text-green-800">✅ Validação histórica de preços</p>
            <p className="text-sm text-green-700">
              O sistema compara o preço cotado com o histórico do mesmo item nas semanas anteriores.
              Se o preço estiver muito fora do padrão (acima de 15%), aparece um alerta vermelho.
              Se estiver abaixo, aparece uma sugestão de aproveitar e comprar mais para o estoque.
            </p>
          </div>

          <Destaque cor="yellow" icone="⚡"
            texto="Não sabe o preço de algum item? Deixe em branco e o sistema usa o último preço registrado. A lista de compras ainda funciona, mas com o custo do período anterior." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            08 — NOTA FISCAL
        ════════════════════════════════════════════════════ */}
        <Secao id="nf" emoji="🧾" titulo="Nota Fiscal — leitura automática" badge="IA"
          subtitulo="Fotografe a nota fiscal e a IA extrai os itens e preços automaticamente.">

          <Destaque cor="purple" icone="📸"
            texto="Tecnologia de visão computacional: a IA analisa a foto da nota e identifica produto, quantidade, valor unitário e total — mesmo em notas rasgadas ou com letra pequena." />

          <p>A leitura de NF fica em <strong>Compras → Nota fiscal</strong>.</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Toque em 'Fotografar ou enviar NF'"
              texto='Pode tirar uma foto na hora ou escolher uma imagem da galeria do celular. Aceita JPG, PNG e PDF.' />
            <Passo num={2} titulo="Aguarde a leitura (5 a 15 segundos)"
              texto='A IA processa a imagem e extrai todos os itens identificados. Uma barra de progresso mostra o andamento.' />
            <Passo num={3} titulo="Revise os itens encontrados"
              texto='Confira os valores extraídos. Você pode corrigir qualquer item antes de aplicar.' />
            <Passo num={4} titulo='Toque em "Aplicar preços"'
              texto='Os preços pagos são registrados e o sistema calcula o custo real da semana.' />
          </div>

          <div className="space-y-2">
            <CardInfo titulo="📦 Identificação de fornecedor"
              desc="Se o CNPJ ou o nome do fornecedor aparecer na nota, o sistema vincula automaticamente ao perfil de fornecedor cadastrado."
              cor="green" />
            <CardInfo titulo="🔗 Vinculação de itens"
              desc="O sistema tenta cruzar o nome do produto na nota com os ingredientes do cardápio. O que não reconhece fica em amarelo para você revisar."
              cor="yellow" />
            <CardInfo titulo="📝 Registro automático"
              desc="Além de registrar os preços, a NF fica salva no histórico para auditoria posterior."
              cor="gray" />
          </div>

          <Destaque cor="blue" icone="💡"
            texto="Para melhor resultado: fotografe a nota em ambiente bem iluminado, sem sombras. Notas dobradas podem ser abertas antes de fotografar. PDFs têm qualidade ainda melhor que fotos." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            09 — LISTA DE COMPRAS
        ════════════════════════════════════════════════════ */}
        <Secao id="compras" emoji="🛒" titulo="Lista de compras"
          subtitulo="Gerada automaticamente a partir do cardápio. Descontando o que já tem no estoque.">

          <Destaque cor="green" icone="🎯"
            texto="A lista é calculada automaticamente! Você monta o cardápio, define o número de pessoas, e a lista aparece pronta com cada ingrediente e a quantidade exata." />

          <p>Três status para cada item:</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { emoji: '⬜', nome: 'A comprar', bg: 'bg-gray-100', texto: 'text-gray-700' },
              { emoji: '🛍️', nome: 'Comprado', bg: 'bg-yellow-50', texto: 'text-yellow-800' },
              { emoji: '✅', nome: 'Recebido', bg: 'bg-green-50', texto: 'text-green-800' },
            ].map((e) => (
              <div key={e.nome} className={`rounded-2xl p-3 ${e.bg}`}>
                <div className="text-2xl">{e.emoji}</div>
                <div className={`mt-1 text-xs font-bold ${e.texto}`}>{e.nome}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Vá em Compras → Lista de compras"
              texto='A lista já aparece calculada com base no cardápio da semana e no estoque disponível.' />
            <Passo num={2} titulo="Verifique as quantidades"
              texto='Se o estoque já tem 5 kg de frango e precisa de 15 kg, a lista mostra 10 kg. O desconto é automático.' />
            <Passo num={3} titulo="Imprima se preferir papel"
              texto='Toque no ícone de impressão para gerar um PDF ou imprimir direto. Útil para quem vai ao mercado sem internet.' />
            <Passo num={4} titulo="Marque conforme compra"
              texto='Toque no item e marque como "Comprado". O progresso aparece no Painel como barra de compras.' />
            <Passo num={5} titulo="No recebimento, marque como recebido"
              texto='Quando a entrega chegar, marque como recebido e registre o preço real pago. Isso alimenta o custo real da semana.' />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto="Se você ajustou a quantidade de um item (comprou mais ou menos do que o sistema sugeria), registre a quantidade real comprada. Isso melhora as sugestões futuras." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            10 — ESTOQUE
        ════════════════════════════════════════════════════ */}
        <Secao id="estoque" emoji="📦" titulo="Estoque — o que temos"
          subtitulo="Controle do que está na despensa. Desconta automaticamente da lista de compras.">

          <Lista itens={[
            'Saber o saldo de cada ingrediente sem ir fisicamente à dispensa',
            'Descontar automaticamente da lista de compras o que já tem em casa',
            'Receber alerta quando um item está abaixo do mínimo',
            'Rastrear quanto cada ingrediente foi consumido nas últimas semanas',
          ]} />

          <div className="space-y-4">
            <Passo num={1} titulo="Entrada — chegou mercadoria"
              texto='Vá em Compras → Estoque, procure o item, toque em "+" e informe a quantidade que chegou.' />
            <Passo num={2} titulo="Baixa automática ao concluir a semana"
              texto='Quando você avança a semana para "Concluído", os ingredientes usados são descontados do estoque automaticamente.' />
            <Passo num={3} titulo="Definir estoque mínimo"
              texto='Toque em um item e defina a quantidade mínima aceitável. Abaixo disso, aparece alerta no Painel.' />
            <Passo num={4} titulo="Inventário físico mensal"
              texto='Uma vez por mês, conte fisicamente e ajuste se houver diferença. Vá em Estoque → item → Ajustar saldo.' />
          </div>

          <Destaque cor="yellow" icone="⚠️"
            texto="Se o saldo do estoque parece errado, não entre em pânico. Faça o ajuste manual. É melhor ajustar do que deixar com dado errado — o sistema não vai te punir por corrigir." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            11 — FORNECEDORES E PEDIDOS
        ════════════════════════════════════════════════════ */}
        <Secao id="fornecedores" emoji="🤝" titulo="Fornecedores e Pedidos"
          subtitulo="Gerencie o relacionamento com cada fornecedor e envie pedidos diretamente.">

          <p>A aba <strong>Compras</strong> tem duas sub-abas dedicadas a fornecedores:</p>

          <div className="space-y-2">
            <SubAba rotulo="Fornecedores — Inteligência"
              desc="Perfil de cada fornecedor com histórico de preços, avaliações e comparativo. Veja qual fornece mais barato cada categoria." />
            <SubAba rotulo="Pedido — enviar pedido"
              desc="Gera automaticamente o texto do pedido baseado na lista de compras e envia por WhatsApp diretamente para o fornecedor." />
          </div>

          <p className="font-semibold text-gray-800">No perfil de cada fornecedor você vê:</p>
          <Lista itens={[
            'Histórico de preços por item ao longo do tempo',
            'Avaliações de pontualidade, qualidade e atendimento',
            'Quais itens ele fornece melhor (mais barato ou melhor qualidade)',
            'Observações e anotações da equipe de compras',
            'CNPJ e dados de contato',
          ]} />

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="mb-2 font-bold text-green-800">📲 Pedido automático por WhatsApp</p>
            <p className="text-sm text-green-700">
              Na sub-aba Pedido, selecione quais itens vai pedir para qual fornecedor.
              O sistema gera o texto do pedido formatado e abre o WhatsApp do fornecedor com a mensagem pronta.
              Você só confirma o envio.
            </p>
          </div>

          <p className="font-semibold text-gray-800">Fornecedores reconhecidos automaticamente:</p>
          <p className="text-sm text-gray-600">
            WG · Apetito Foods · Vita Frango · Jampac · Frito Sul — e qualquer fornecedor
            que você adicionar nas configurações. Nas cotações e notas fiscais, o sistema
            identifica o fornecedor pelo nome sem precisar configurar nada.
          </p>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            12 — RELATÓRIOS
        ════════════════════════════════════════════════════ */}
        <Secao id="relatorios" emoji="📊" titulo="Relatórios — visão gerencial"
          subtitulo="Análise financeira completa, histórico e auditoria. Acesso do Gestor e Administrador.">

          <Destaque cor="yellow" icone="🔒"
            texto="Relatórios é exclusivo do Gestor e Administrador. A equipe de cozinha, compras e recebimento não acessa essa área." />

          <p>A aba Relatórios tem seis sub-abas:</p>

          <div className="space-y-2">
            <SubAba rotulo="Visão geral"
              desc="KPIs financeiros da semana: custo total, custo por refeição, aceitação média e percentual de desperdício. Leitura de 5 segundos." />
            <SubAba rotulo="Custos"
              desc="Detalhamento de onde o dinheiro está sendo gasto. Custo por categoria (proteína, verdura, etc.) e por dia da semana." />
            <SubAba rotulo="DNA & Rankings"
              desc="Perfil alimentar da empresa: proteínas mais usadas, pratos favoritos, pratos rejeitados e pratos que mais desperdiçam." />
            <SubAba rotulo="Previsão"
              desc="Projeção de demanda para as próximas semanas com três cenários: pessimista, esperado e otimista." />
            <SubAba rotulo="Fornecedores"
              desc="Comparativo de preços entre fornecedores, evolução histórica e alertas de variação." />
            <SubAba rotulo="Auditoria"
              desc="Histórico completo de tudo que foi alterado: quem mudou, o quê e quando. Disponível apenas para Administrador." />
          </div>

          <div className="rounded-2xl bg-[#1a5c3a]/5 p-4 ring-1 ring-[#1a5c3a]/10">
            <p className="mb-2 font-bold text-[#1a5c3a]">📈 KPIs que aparecem no topo dos Relatórios</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Custo total da semana', 'Soma de tudo que foi gasto ou cotado'],
                ['Custo / refeição', 'Quanto custou cada prato servido'],
                ['Aceitação média', 'Nota média de 1 a 5 dos pratos avaliados'],
                ['Desperdício %', 'Percentual de comida produzida e não consumida'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                  <p className="text-xs font-bold text-gray-700">{k}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            13 — DNA
        ════════════════════════════════════════════════════ */}
        <Secao id="dna" emoji="🧬" titulo="DNA e Rankings da casa"
          subtitulo="O sistema aprende o perfil do Tatá House e mostra quem são os campeões e os vilões do cardápio.">

          <p>
            O DNA é o cartão de identidade alimentar do Tatá House. Com o tempo, o sistema identifica padrões
            e monta um perfil preciso da operação.
          </p>

          <div className="space-y-3">
            <CardInfo titulo="🥩 Proteínas mais servidas"
              desc="Ranking de qual proteína domina o cardápio. Ex: Frango 42% · Boi 28% · Peixe 15%. Útil para negociar contratos fixos com fornecedores."
              cor="blue" />
            <CardInfo titulo="🏆 Pratos campeões"
              desc="Os favoritos da equipe — nota alta, consumo total, pouca sobra. Esses pratos devem entrar no cardápio com frequência."
              cor="green" />
            <CardInfo titulo="❌ Pratos a evitar"
              desc="Pratos com nota baixa e alto desperdício. O sistema sugere tirar do rodízio ou reformular a receita."
              cor="red" />
            <CardInfo titulo="📅 Padrões por dia"
              desc="O que funciona em cada dia da semana. Ex: 'Fritura na Sexta tem 18% mais aceitação que na Segunda'."
              cor="purple" />
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 font-bold text-blue-800">🎯 Objetivo da semana</p>
            <p className="mb-3 text-sm text-blue-700">
              No DNA, você pode selecionar um objetivo e o sistema monta um plano de ação concreto:
            </p>
            <div className="space-y-1">
              {[
                ['Reduzir custo', 'Sugere substituir ingredientes caros e quais pratos têm menor custo por porção'],
                ['Reduzir desperdício', 'Indica quais pratos produzir menos e em quais dias o desperdício é maior'],
                ['Melhorar aceitação', 'Coloca os favoritos nos dias de maior frequência'],
                ['Equilibrar proteínas', 'Distribui melhor entre frango, boi, peixe e proteínas alternativas'],
              ].map(([obj, acao]) => (
                <div key={obj} className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-blue-800">{obj}</p>
                  <p className="text-[11px] text-blue-600">{acao}</p>
                </div>
              ))}
            </div>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            14 — PREVISÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="previsao" emoji="🔮" titulo="Previsão de demanda"
          subtitulo="O sistema prevê quantas pessoas vão comer em cada dia, com base em semanas anteriores.">

          <p>
            A previsão fica em <strong>Relatórios → Previsão</strong>. O sistema analisa o histórico
            de refeições das últimas semanas e projeta os números para a semana que está sendo montada.
          </p>

          <div className="rounded-2xl bg-[#1a5c3a]/5 p-4 ring-1 ring-[#1a5c3a]/10">
            <p className="mb-2 font-bold text-[#1a5c3a]">3 cenários para cada dia:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['😟', 'Pessimista', 'Pior caso — bom para evitar desperdício'],
                ['😊', 'Esperado', 'O mais provável, com base na média'],
                ['😄', 'Otimista', 'Demanda alta — ideal para eventos'],
              ].map(([e, n, d]) => (
                <div key={n} className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                  <div className="text-xl">{e}</div>
                  <p className="mt-1 text-xs font-bold text-gray-700">{n}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Visualize a previsão"
              texto='Em Relatórios → Previsão, veja os três cenários para cada dia da semana atual.' />
            <Passo num={2} titulo='Toque em "Usar essa previsão"'
              texto='O número de pessoas do cardápio atualiza automaticamente para o cenário escolhido.' />
            <Passo num={3} titulo="A lista de compras recalcula"
              texto='Com os novos números de pessoas, todas as quantidades de ingredientes são recalculadas instantaneamente.' />
          </div>

          <Destaque cor="green" icone="📈"
            texto="Quanto mais semanas registradas, mais precisa fica a previsão. O sistema considera sazonalidade, dia da semana e tendências recentes." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            15 — SIMULADOR
        ════════════════════════════════════════════════════ */}
        <Secao id="simulador" emoji="🎮" titulo="Simulador de cenários"
          subtitulo="E se...? Teste mudanças sem afetar os dados reais.">

          <p>
            O Simulador fica em <strong>Relatórios → Cenários</strong>. Permite testar hipóteses antes de tomar decisões reais.
          </p>

          <div className="space-y-2">
            <CardInfo titulo="📉 E se eu reduzir 10% do desperdício?"
              desc="O simulador calcula quanto você economizaria por semana e por mês, com base nos dados reais de produção."
              cor="green" />
            <CardInfo titulo="👥 E se a demanda crescer 20%?"
              desc="Veja como o custo sobe, quais itens precisam de mais estoque e o impacto no custo por refeição."
              cor="blue" />
            <CardInfo titulo="🥩 E se o frango subir de preço?"
              desc="Simule substituir por outra proteína e veja o impacto no custo total e na aceitação esperada."
              cor="yellow" />
            <CardInfo titulo="💡 E se eu trocar um prato caro por um mais econômico?"
              desc="Calcule quanto economizaria por semana sem comprometer a satisfação da equipe."
              cor="gray" />
          </div>

          <Destaque cor="purple" icone="🎯"
            texto="O Simulador nunca muda dados reais. Tudo o que você testa aqui é hipotético. Use à vontade para planejar antes de decidir." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            16 — ASSISTENTE
        ════════════════════════════════════════════════════ */}
        <Secao id="assistente" emoji="🤖" titulo="Assistente de IA"
          subtitulo="Um especialista em gestão de restaurante disponível 24h. Responde com base nos seus dados reais.">

          <Destaque cor="blue" icone="💬"
            texto="O Assistente analisa os dados reais do Tatá House e responde em linguagem simples. Não é uma IA genérica — ele conhece os pratos, fornecedores e histórico da sua casa." />

          <p>Para abrir o Assistente, toque no ícone <strong>💬</strong> no canto inferior direito da tela.</p>

          <p className="font-semibold text-gray-800">Exemplos de perguntas que funcionam bem:</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              'Onde estou gastando mais esta semana?',
              'Quais pratos a equipe mais gosta?',
              'Como reduzir o custo por refeição?',
              'Quais itens subiram de preço?',
              'Qual fornecedor está mais barato?',
              'O que está acabando no estoque?',
              'Quais pratos geram mais desperdício?',
              'Como montar um cardápio econômico?',
            ].map((p) => (
              <div key={p} className="rounded-2xl bg-gray-100 px-3 py-2.5 text-sm text-gray-700">
                "{p}"
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-bold text-gray-800">Quando aparece o badge vermelho no botão:</p>
            <p className="text-sm text-gray-600">
              O Assistente identificou proativamente algo que precisa da sua atenção —
              preço fora do normal, estoque crítico, prato com nota baixa, ou orçamento em risco.
              Toque para ver o alerta completo com sugestão de ação.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            17 — EQUIPE
        ════════════════════════════════════════════════════ */}
        <Secao id="equipe" emoji="👥" titulo="Equipe e restrições alimentares"
          subtitulo="Cadastre os funcionários e suas restrições. O sistema alerta quando um prato não atende a todos.">

          <p>Acesse em <strong>Ajustes → Equipe e restrições alimentares</strong>.</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Cadastre cada funcionário"
              texto='Nome, cargo e qualquer restrição alimentar (intolerância a lactose, alergia a glúten, vegetariano, etc.).' />
            <Passo num={2} titulo="O sistema monitora o cardápio"
              texto='Se um prato do cardápio contém um ingrediente que algum funcionário não pode comer, aparece um alerta no Cardápio.' />
            <Passo num={3} titulo="Sugira alternativas"
              texto='O alerta mostra quantos funcionários são afetados e quais substituições são possíveis para atender a todos.' />
          </div>

          <Destaque cor="yellow" icone="⚠️"
            texto="Não é obrigatório cadastrar restrições, mas vale muito — especialmente em casas com muitos funcionários com restrições. Evita situações desconfortáveis na hora da refeição." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            18 — FLUXO
        ════════════════════════════════════════════════════ */}
        <Secao id="fluxo" emoji="🔄" titulo="Etapas da semana — o Fluxo"
          subtitulo="Cada semana avança por 5 etapas. Cada equipe cuida da sua parte.">

          <p>O Fluxo fica visível no Início (Painel) como uma barra de progresso. Cada etapa é liberada pela equipe responsável.</p>

          <div className="space-y-3">
            {[
              {
                num: '1', nome: 'Rascunho', quem: 'Gestor',
                cor: 'bg-gray-200 text-gray-700',
                desc: 'O gestor está montando o cardápio. Pode alterar qualquer coisa. A lista de compras ainda não é final.',
              },
              {
                num: '2', nome: 'Cozinha', quem: 'Cozinha',
                cor: 'bg-orange-100 text-orange-700',
                desc: 'A cozinha revisou o cardápio e aprovou. Sabe o que vai cozinhar. Avança quando a equipe confirmar.',
              },
              {
                num: '3', nome: 'Compras', quem: 'Compras',
                cor: 'bg-blue-100 text-blue-700',
                desc: 'A lista de compras foi finalizada. O responsável saiu para comprar. Avança ao confirmar os itens comprados.',
              },
              {
                num: '4', nome: 'Recebimento', quem: 'Recebimento',
                cor: 'bg-purple-100 text-purple-700',
                desc: 'As compras chegaram. A equipe confere item a item e registra o preço real pago. Avança quando tudo estiver conferido.',
              },
              {
                num: '5', nome: 'Concluído', quem: 'Gestor',
                cor: 'bg-green-100 text-green-700',
                desc: 'Semana encerrada. O custo real foi calculado, o estoque atualizado e os dados ficam disponíveis nos relatórios.',
              },
            ].map((e) => (
              <div key={e.num} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${e.cor}`}>
                  {e.num}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-800">{e.nome}</p>
                    <Badge label={e.quem} cor={
                      e.quem === 'Gestor' ? 'green' :
                      e.quem === 'Cozinha' ? 'orange' :
                      e.quem === 'Compras' ? 'blue' : 'purple'
                    } />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Destaque cor="green" icone="⚡"
            texto="O sistema não avança sozinho. Cada equipe toca no botão de avançar quando termina a sua parte. Isso garante que nenhuma etapa seja pulada acidentalmente." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            19 — PAPÉIS
        ════════════════════════════════════════════════════ */}
        <Secao id="papeis" emoji="🎭" titulo="Quem pode fazer o quê"
          subtitulo="Cada cargo tem acesso exatamente ao que precisa para o seu trabalho.">

          <TabelaPapeis />

          <Destaque cor="yellow" icone="🔑"
            texto="Para trocar de cargo, vá em Ajustes → Configurações de acesso e informe o PIN. Os PINs são definidos pelo gestor — peça a ele se precisar de acesso diferente." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            20 — FAQ
        ════════════════════════════════════════════════════ */}
        <Secao id="faq" emoji="❓" titulo="Perguntas frequentes"
          subtitulo="As dúvidas mais comuns — e as respostas diretas.">

          <div className="space-y-4">
            {[
              {
                p: 'Apaguei algo sem querer. Perdi os dados?',
                r: 'Não. O sistema salva automaticamente e mantém histórico. Vá em Relatórios → Auditoria para ver o que foi alterado e quando. O administrador pode restaurar qualquer valor.',
              },
              {
                p: 'A lista de compras está com quantidade errada. O que fazer?',
                r: 'Verifique se: (1) todos os dias do cardápio têm prato preenchido, (2) o número de pessoas de cada dia está correto, (3) o estoque está atualizado. A lista é gerada automaticamente a partir dessas três informações.',
              },
              {
                p: 'O custo da semana está zerado ou errado. Por quê?',
                r: 'O custo só aparece depois que os preços são lançados em Cotação. Sem preço, o sistema não tem como calcular. Lance os preços dos fornecedores primeiro e o custo aparece em tempo real.',
              },
              {
                p: 'O sistema ficou lento ou travou. O que fazer?',
                r: 'Feche e abra o navegador. Todos os dados ficam salvos — você não perde nada. Se continuar lento, verifique sua conexão com a internet. O sistema funciona mesmo offline, mas precisa de internet para sincronizar.',
              },
              {
                p: 'Posso usar em mais de um celular ao mesmo tempo?',
                r: 'Sim! Mas os dados ficam salvos em cada celular separadamente (localStorage). Para sincronização em tempo real entre celulares diferentes, o gestor precisa ativar a sincronização em nuvem nas Configurações.',
              },
              {
                p: 'Como adicionar um fornecedor novo para ser reconhecido automaticamente?',
                r: 'Vá em Compras → Fornecedores, toque em "Adicionar fornecedor" e cadastre o nome. A partir daí, nas cotações e leituras de NF, o nome aparece automaticamente vinculado ao perfil.',
              },
              {
                p: 'A IA não encontrou os fornecedores corretos na cotação. O que fazer?',
                r: 'Verifique se o nome do fornecedor está cadastrado em Compras → Fornecedores. O sistema reconhece WG, Apetito, Vita Frango, Jampac e Frito Sul automaticamente. Para outros, basta cadastrar uma vez.',
              },
              {
                p: 'Como imprimir a lista de compras?',
                r: 'Em Compras → Lista de compras, toque no ícone de impressora no canto superior. Gera um PDF pronto para imprimir ou salvar no celular.',
              },
              {
                p: 'Posso ver semanas anteriores?',
                r: 'Sim. Toque na data no topo da tela para abrir o seletor de semanas. Você pode navegar por qualquer semana registrada e ver o cardápio, custos, compras e avaliações daquela semana.',
              },
              {
                p: 'O que é o orçamento da semana?',
                r: 'É um valor máximo que você define para o custo da semana. Configure em Ajustes → Configurações. Se o custo estimado ultrapassar esse valor, o sistema mostra um alerta no Painel e no card de KPIs.',
              },
              {
                p: 'A leitura da nota fiscal não reconheceu alguns itens. O que fazer?',
                r: 'Revise manualmente os itens em amarelo (não reconhecidos) antes de aplicar. Você pode editar o nome para corresponder ao ingrediente correto. Com o tempo, o sistema aprende os itens mais comuns da sua operação.',
              },
              {
                p: 'Como saber se o sistema está funcionando com IA?',
                r: 'Se o campo de Cotação mostra "Analisar com IA" e o botão de leitura de NF está ativo, a IA está funcionando. Se aparecer "IA indisponível", contate o gestor — a chave de IA pode precisar ser reativada.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-gray-50 p-4">
                <p className="mb-2 font-bold text-gray-800">Q: {item.p}</p>
                <p className="text-sm text-gray-600">A: {item.r}</p>
              </div>
            ))}
          </div>
        </Secao>

        <BotaoBaixarManual />

        {/* Rodapé */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f3d26] via-[#1a5c3a] to-[#0f3d26] p-8 text-center text-white shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10">
            <div className="mb-3 text-4xl">🌿</div>
            <p className="font-display text-2xl font-bold">Tatá House</p>
            <p className="mt-1 text-green-200">Sistema de Gestão — versão 2026</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-green-200">
              <span>32.837+ refeições registradas</span>
              <span className="opacity-40">·</span>
              <span>1.400+ amostras históricas</span>
              <span className="opacity-40">·</span>
              <span>3 anos de dados</span>
            </div>
            <p className="mt-6 text-sm text-green-300/70">
              Dúvidas? Fale com o gestor responsável da sua unidade.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
