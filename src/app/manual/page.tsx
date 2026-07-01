/* =====================================================================
   Manual do Sistema — Tatá House
   Documentação oficial. Versão 2026.
   ===================================================================== */

import { BotaoBaixarManual } from './BotaoBaixarManual';

export const metadata = {
  title: 'Manual do Sistema — Tatá House',
  description: 'Guia completo do sistema de gestão do Tatá House.',
};

/* ── Componentes de layout ──────────────────────────────────── */

function Capa() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a0e] via-[#1a5c3a] to-[#071a0e] px-8 py-16 text-center shadow-2xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-96 -translate-x-1/2 rounded-full bg-emerald-400/5 blur-3xl" />
      <div className="relative z-10">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 shadow-2xl ring-2 ring-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tata.png" alt="Tatá House" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert" fetchPriority="high" />
        </div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-300/60">
          Sistema de Gestão
        </p>
        <h1 className="font-display text-5xl font-bold text-white drop-shadow-md tracking-tight">Tatá House</h1>
        <p className="mt-3 text-xl font-light text-emerald-100">Manual do Sistema</p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { num: '485', label: 'dias de operação' },
            { num: '32.837+', label: 'refeições registradas' },
            { num: '3 anos', label: 'de histórico real' },
            { num: 'IA', label: 'integrada' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/8 px-3 py-3 ring-1 ring-white/10">
              <p className="font-display text-xl font-bold text-white">{s.num}</p>
              <p className="mt-0.5 text-[10px] text-emerald-200/70">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-sm mx-auto text-sm leading-relaxed text-emerald-200/60">
          Guia oficial para toda a equipe —<br />cozinha, compras, recebimento e gestão.
        </p>
      </div>
    </div>
  );
}

/* ── Manifesto ──────────────────────────────────────────────── */

function Manifesto() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a5c3a]/8 text-2xl">✦</span>
        <div>
          <h2 className="font-display text-xl font-bold text-gray-800">Por que este sistema existe</h2>
          <p className="mt-0.5 text-sm text-gray-500">A história por trás da ferramenta</p>
        </div>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-gray-700">
        <p>
          O Tatá House serve <strong>centenas de refeições por dia</strong> com uma operação que exige
          precisão: comprar na quantidade certa, no fornecedor mais barato, com o cardápio que a equipe
          mais aprecia — e ainda controlar desperdício, custo por prato e estoque.
        </p>
        <p>
          Este sistema foi construído <strong>de dentro para fora</strong>: partindo de 3 anos de registros
          reais do WhatsApp, 485 dias de operação digitalizados e mais de 1.400 amostras históricas.
          Cada número que você vê na tela tem raiz em dados reais desta casa.
        </p>
        <div className="rounded-2xl bg-[#1a5c3a]/5 px-4 py-4 ring-1 ring-[#1a5c3a]/10">
          <p className="font-semibold text-[#1a5c3a]">
            "O sistema não é uma ferramenta de relatório. É o gestor silencioso que trabalha 24h — lembra
            o que funcionou, alerta o que está subindo de preço e sugere o que a equipe vai adorar amanhã."
          </p>
        </div>
        <p>
          Não precisamos mais adivinhar quanto frango comprar na quinta-feira. Não precisamos mais
          descobrir depois que o fornecedor subiu 15% no tomate. <strong>O sistema já sabe — e avisa.</strong>
        </p>
      </div>
    </div>
  );
}

/* ── Fluxo central ──────────────────────────────────────────── */

function FluxoCentral() {
  const etapas = [
    { icone: '🏠', nome: 'Início', desc: 'Briefing + decisões' },
    { icone: '📅', nome: 'Cardápio', desc: 'Centro inteligente' },
    { icone: '🛒', nome: 'Compras', desc: 'Execução e estoque' },
    { icone: '📊', nome: 'Relatórios', desc: 'Análise gerencial' },
    { icone: '⚙️', nome: 'Ajustes', desc: 'Equipe e acesso' },
  ];
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Fluxo do sistema</p>
      <div className="flex items-start gap-1">
        {etapas.map((e, i) => (
          <div key={e.nome} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1a5c3a]/10 text-xl">
                {e.icone}
              </div>
              {i < etapas.length - 1 && (
                <div className="mx-1 h-px flex-1 bg-gray-200" />
              )}
            </div>
            <p className="text-center text-[10px] font-bold text-gray-700">{e.nome}</p>
            <p className="text-center text-[9px] text-gray-400">{e.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-[#1a5c3a]/5 px-4 py-3 ring-1 ring-[#1a5c3a]/10">
        <p className="text-xs font-semibold text-[#1a5c3a]">
          O <strong>Cardápio</strong> é o centro inteligente do sistema — é de lá que saem as decisões de compra, custo e planejamento. Tudo parte e volta para o cardápio.
        </p>
      </div>
    </div>
  );
}

function Indice() {
  const capitulos = [
    { num: '01', nome: 'Como entrar no sistema', ancora: 'acesso' },
    { num: '02', nome: 'Início — briefing e decisões', ancora: 'inicio' },
    { num: '03', nome: 'Cardápio — o centro inteligente', ancora: 'cardapio' },
    { num: '04', nome: 'Cardápio › Como Fazer', ancora: 'comofazer' },
    { num: '05', nome: 'Cardápio › Cotação integrada', ancora: 'cotacao' },
    { num: '06', nome: 'Cardápio › Operação diária', ancora: 'operacao' },
    { num: '07', nome: 'Cardápio › Avaliação e Desperdício', ancora: 'avaliacao' },
    { num: '08', nome: 'Compras — lista e execução', ancora: 'compras' },
    { num: '09', nome: 'Compras › Nota Fiscal com IA', ancora: 'nf' },
    { num: '10', nome: 'Compras › Estoque', ancora: 'estoque' },
    { num: '11', nome: 'Compras › Fornecedores e Pedidos', ancora: 'fornecedores' },
    { num: '12', nome: 'Relatórios — análise gerencial', ancora: 'relatorios' },
    { num: '13', nome: 'Relatórios › DNA e Rankings', ancora: 'dna' },
    { num: '14', nome: 'Relatórios › Previsão de demanda', ancora: 'previsao' },
    { num: '15', nome: 'Assistente de IA', ancora: 'assistente' },
    { num: '16', nome: 'Etapas da semana — o Fluxo', ancora: 'fluxo' },
    { num: '17', nome: 'Ajustes — equipe e acesso', ancora: 'ajustes' },
    { num: '18', nome: 'Quem pode fazer o quê', ancora: 'papeis' },
    { num: '19', nome: 'Perguntas frequentes', ancora: 'faq' },
  ];
  return (
    <section id="indice" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a5c3a]/10 text-xl">📖</span>
        <h2 className="font-display text-xl font-bold text-gray-800">Índice</h2>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {capitulos.map((it) => (
          <a
            key={it.ancora}
            href={`#${it.ancora}`}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-green-50"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a5c3a] text-[9px] font-bold text-white">
              {it.num}
            </span>
            <span className={`text-sm ${it.nome.includes(' › ') ? 'text-gray-500' : 'font-medium text-gray-700'}`}>
              {it.nome}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ── Blocos reutilizáveis ──────────────────────────────────── */

function Secao({ id, emoji, titulo, subtitulo, badge, children }: {
  id: string; emoji: string; titulo: string; subtitulo?: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a5c3a]/10 text-2xl">{emoji}</span>
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

function Destaque({ icone, texto, cor = 'green' }: {
  icone?: string; texto: string; cor?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'dark';
}) {
  const cores: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    dark: 'bg-gray-900 border-gray-700 text-white',
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c3a] text-sm font-bold text-white">{num}</span>
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

function Card({ titulo, desc, cor = 'gray' }: { titulo: string; desc: string; cor?: string }) {
  const bg: Record<string, string> = {
    gray: 'bg-gray-50', green: 'bg-green-50 border border-green-100',
    blue: 'bg-blue-50 border border-blue-100', yellow: 'bg-yellow-50 border border-yellow-100',
    purple: 'bg-purple-50 border border-purple-100', orange: 'bg-orange-50 border border-orange-100',
    red: 'bg-red-50 border border-red-100',
  };
  const titleCor: Record<string, string> = {
    gray: 'text-gray-800', green: 'text-green-800', blue: 'text-blue-800',
    yellow: 'text-yellow-800', purple: 'text-purple-800', orange: 'text-orange-800', red: 'text-red-800',
  };
  const descCor: Record<string, string> = {
    gray: 'text-gray-600', green: 'text-green-700', blue: 'text-blue-700',
    yellow: 'text-yellow-700', purple: 'text-purple700', orange: 'text-orange-700', red: 'text-red-700',
  };
  return (
    <div className={`rounded-2xl p-4 ${bg[cor] ?? bg.gray}`}>
      <p className={`mb-1 font-bold ${titleCor[cor] ?? titleCor.gray}`}>{titulo}</p>
      <p className={`text-sm ${descCor[cor] ?? descCor.gray}`}>{desc}</p>
    </div>
  );
}

function SubAbas({ abas }: { abas: { rotulo: string; desc: string }[] }) {
  return (
    <div className="flex overflow-x-auto rounded-2xl bg-gray-100 p-1">
      {abas.map((a, i) => (
        <div key={i} className={`flex-1 rounded-xl px-3 py-2 text-center ${i === 0 ? 'bg-white shadow-sm' : ''}`}>
          <p className="text-[11px] font-bold text-gray-700">{a.rotulo}</p>
          <p className="mt-0.5 text-[10px] text-gray-400">{a.desc}</p>
        </div>
      ))}
    </div>
  );
}

function TabelaPapeis() {
  const linhas = [
    {
      papel: 'Gestor', cor: 'bg-[#1a5c3a]',
      pode: ['Montar e editar o cardápio', 'Ver todos os relatórios', 'Aprovar todas as etapas', 'Configurar o sistema', 'Acessar inteligência e DNA', 'Ver auditoria'],
    },
    {
      papel: 'Cozinha', cor: 'bg-orange-500',
      pode: ['Ver o cardápio da semana', 'Consultar "Como Fazer" de cada prato', 'Avançar etapa "Cozinha"', 'Registrar desperdício e refeições do dia', 'Ver contador de refeições'],
    },
    {
      papel: 'Compras', cor: 'bg-blue-600',
      pode: ['Ver e imprimir a lista de compras', 'Marcar itens como comprados', 'Registrar preços pagos', 'Fotografar nota fiscal', 'Avançar etapa "Compras"'],
    },
    {
      papel: 'Recebimento', cor: 'bg-purple-600',
      pode: ['Marcar itens como recebidos', 'Registrar preço real pago', 'Avançar etapa "Recebimento"'],
    },
    {
      papel: 'Administrador', cor: 'bg-gray-700',
      pode: ['Tudo que o Gestor faz', 'Exportar auditoria completa', 'Gerenciar usuários e PINs'],
    },
  ];
  return (
    <div className="space-y-4">
      {linhas.map((l) => (
        <div key={l.papel} className="rounded-2xl bg-gray-50 p-4">
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white ${l.cor}`}>{l.papel}</span>
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

function NumeroImpacto({ numero, desc }: { numero: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">
      <p className="font-display text-2xl font-bold text-[#1a5c3a]">{numero}</p>
      <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
    </div>
  );
}

/* ── Página principal ──────────────────────────────────────── */

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50 print:bg-white" id="manual-conteudo">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm 1.8cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section { break-inside: avoid; page-break-inside: avoid; }
          .shadow-sm, .shadow-2xl, .shadow-xl { box-shadow: none !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">

        <Capa />
        <BotaoBaixarManual />
        <Manifesto />
        <FluxoCentral />
        <Indice />

        {/* ═══════════════════════════════════════════════════
            01 — ACESSO
        ════════════════════════════════════════════════════ */}
        <Secao id="acesso" emoji="🔐" titulo="Como entrar no sistema"
          subtitulo="Celular, tablet ou computador. Sem instalar nada. Sem cadastro.">

          <Destaque cor="green" icone="✅"
            texto="O sistema funciona direto no navegador — Chrome, Safari ou Edge. Não precisa baixar nenhum aplicativo nem criar conta. Abriu, entrou." />

          <div className="space-y-4">
            <Passo num={1} titulo="Abra o navegador do seu celular"
              texto="Use Chrome (Android) ou Safari (iPhone). Procure o ícone colorido na tela inicial." />
            <Passo num={2} titulo="Digite o endereço fornecido pelo gestor"
              texto="O endereço fica salvo no histórico depois do primeiro acesso — você não precisa digitar de novo." />
            <Passo num={3} titulo="Escolha o seu cargo"
              texto="Na tela inicial selecione: Gestor, Cozinha, Compras, Recebimento ou Administrador." />
            <Passo num={4} titulo="Pronto — você está dentro"
              texto="O sistema lembra do seu cargo mesmo se você fechar o celular ou desligar a tela." />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto='Dica de ouro: adicione o site na tela inicial do celular. No iPhone: "Compartilhar → Adicionar à Tela de Início". No Android: menu "⋮ → Adicionar à tela inicial". Fica idêntico a um app e abre duas vezes mais rápido.' />

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-1 font-bold text-gray-800">🔄 Mudar de cargo</p>
            <p className="text-sm text-gray-600">
              Vá em <strong>Ajustes → Configurações de acesso</strong> e informe o PIN do cargo desejado.
              Os PINs são definidos pelo gestor e protegem as funções sensíveis do sistema.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            02 — INÍCIO
        ════════════════════════════════════════════════════ */}
        <Secao id="inicio" emoji="🏠" titulo="Início — briefing e decisões"
          subtitulo="Não é uma tela de dados. É uma tela de decisões. Abre o sistema e você já sabe o que fazer.">

          <Destaque cor="green" icone="🌅"
            texto="Abra o sistema toda manhã e leia o Briefing primeiro. Ele reúne os alertas mais críticos antes de você começar — e é gerado pela IA com base nos dados reais da casa." />

          <div className="space-y-3">
            <Card titulo="🗂️ Painel do Diretor — decisões, não dados"
              desc='Para o gestor, o sistema abre com uma saudação ("Bom dia, [nome]") e cards de decisão: economia possível, maior risco de preço, fornecedor destaque, prato favorito da equipe e estoque crítico. Cada card só aparece quando há algo real a dizer — uma leitura de 5 segundos que já entrega o que decidir.'
              cor="green" />
            <Card titulo="🧠 Briefing do dia — IA analisa, você decide"
              desc="Alertas em ordem de prioridade: urgente (vermelho), atenção (amarelo), informativo (azul). Cobre estoque baixo, pratos sem preço, alta de fornecedor, risco de desperdício e muito mais. Quando não há urgência, o briefing mostra a melhor oportunidade da semana — nunca fica em silêncio."
              cor="blue" />
            <Card titulo="⚡ Insight proativo — integrado ao Briefing"
              desc='Quando não há alertas urgentes, o Briefing exibe o ícone ⚡ com o insight mais relevante da semana — prato muito repetido, oportunidade de economia, custo abaixo da média. O link "Analisar com IA →" abre o Assistente com análise detalhada. Quando há alertas, a IA narra o diagnóstico logo acima da lista de itens — você lê a conclusão antes de ver cada problema.'
              cor="yellow" />
            <Card titulo="🔄 Fluxo da semana"
              desc="Barra de progresso: Rascunho → Cozinha → Compras → Recebimento → Concluído. Cada equipe vê exatamente em qual etapa está e qual é o próximo passo — sem precisar perguntar."
              cor="gray" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumeroImpacto numero="5s" desc="para ler os KPIs da semana" />
            <NumeroImpacto numero="7" desc="sinais monitorados pelo briefing" />
            <NumeroImpacto numero="24h" desc="o sistema nunca para de observar" />
          </div>

          <Destaque cor="blue" icone="📱"
            texto="O Início se adapta ao cargo. A cozinha vê o cardápio da semana e o próximo passo. O gestor vê tudo — KPIs, alertas e a análise da IA. Não se preocupe se a tela de um colega parecer diferente." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            03 — CARDÁPIO (centro inteligente)
        ════════════════════════════════════════════════════ */}
        <Secao id="cardapio" emoji="📅" titulo="Cardápio — o centro inteligente"
          subtitulo="Tudo parte daqui. O cardápio define o que comprar, quanto gastar e o que a cozinha vai preparar.">

          <Destaque cor="green" icone="🎯"
            texto="O Cardápio não é só uma grade de pratos. Ele é o motor de decisão da casa: cada prato escolhido gera automaticamente a lista de compras, calcula o custo estimado por refeição e informa a cozinha do que preparar." />

          <p>O Cardápio tem três sub-abas:</p>

          <SubAbas abas={[
            { rotulo: 'Cardápio', desc: 'Montar e planejar' },
            { rotulo: 'Operação', desc: 'Refeições e sobras' },
            { rotulo: 'Avaliação', desc: 'Notas e feedback' },
          ]} />

          <p className="font-semibold text-gray-800">Sub-aba Cardápio — montar a semana:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Escolha a semana"
              texto="Toque na data no topo da tela. Navegue pelas semanas disponíveis, avance para a próxima ou vá direto para uma data específica." />
            <Passo num={2} titulo="Selecione os pratos de cada dia"
              texto="Toque em Segunda, Terça… e escolha o prato principal. Guarnição e Salada seguem o mesmo processo. O sistema sugere com base no histórico real." />
            <Passo num={3} titulo="Ajuste o número de refeições"
              texto="O sistema já sugere com base na média histórica por dia da semana — mais de 1.400 amostras reais. Altere apenas se souber de um evento especial." />
            <Passo num={4} titulo="Salve — é automático"
              texto="Cada mudança é salva imediatamente. Não existe botão de salvar. O sistema confirma com um gesto visual discreto." />
          </div>

          <p className="font-semibold text-gray-800">Inteligência dentro do Cardápio:</p>

          <div className="space-y-2">
            <Card titulo="🤖 Chef IA — agora dentro do chat de Inteligência"
              desc="As recomendações do Chef IA ficam centralizadas no assistente de Inteligência (botão flutuante no canto), na aba 'Chef IA'. Ele analisa a semana montada e aponta oportunidades de economia, pratos com baixa aceitação, excesso de uma mesma proteína, repetição das últimas 4 semanas, ingredientes sem preço e risco de desperdício. Você aprova (👍) ou descarta (👎) cada dica e ele aprende com o time."
              cor="green" />
            <Card titulo="🔄 Anti-monotonia"
              desc='Detecta quando a mesma proteína aparece muitas vezes na semana e avisa antes de você salvar. "Frango 3× esta semana — considere variar para manter a equipe satisfeita."'
              cor="yellow" />
            <Card titulo="🥗 Indicador Nutricional"
              desc="Mostra o equilíbrio semanal entre proteína, carboidrato, verdura e fibra. Um semáforo visual indica se o cardápio está equilibrado — cuidado ou aprovado."
              cor="blue" />
            <Card titulo="💰 Custo em tempo real"
              desc="Conforme os preços são lançados na Cotação, o custo estimado por refeição aparece ao lado de cada prato. O total da semana atualiza instantaneamente — sem planilha, sem calculadora."
              cor="gray" />
            <Card titulo="📊 Inteligência por prato — na hora da escolha"
              desc="Abaixo do nome de cada prato, uma linha de inteligência exibe: nota★ com número de avaliações (verde ≥ 4, amarelo ≥ 3, vermelho < 3), frequência recente (quantas vezes apareceu nos últimos meses) e custo estimado por pessoa. Se os preços estiverem incompletos, o sistema sinaliza 'preço incompleto' em vermelho. Toda a informação necessária para a decisão sem sair da tela."
              cor="purple" />
            <Card titulo="🖨️ Pôster da semana"
              desc="Um card visual pronto para imprimir e colocar no refeitório. Mostra o cardápio da semana formatado profissionalmente. Toque no botão Pôster no topo."
              cor="purple" />
          </div>

          <Destaque cor="yellow" icone="⚠️"
            texto='Se um prato aparecer com "!" é porque o preço ainda não foi lançado na Cotação. Sem preço, o custo da semana e a lista de compras ficam incompletos — priorize lançar os preços antes de fechar a semana.' />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            04 — COMO FAZER
        ════════════════════════════════════════════════════ */}
        <Secao id="comofazer" emoji="👩‍🍳" titulo="Cardápio › Como Fazer" badge="Receitas inteligentes"
          subtitulo="A receita certa, na quantidade certa, para o dia de hoje. A cozinha não precisa calcular nada.">

          <Destaque cor="green" icone="✨"
            texto="Toque em 'Como fazer' ao lado de qualquer prato no Cardápio. A receita aparece com tudo que a cozinha precisa — inclusive as quantidades calculadas para a quantidade prevista de hoje, sem precisar fazer uma conta sequer." />

          <div className="space-y-2">
            <Card titulo="📋 Modo de preparo"
              desc="Passo a passo numerado, linguagem simples e direta. A cozinha consulta no celular durante o preparo sem sair do cardápio."
              cor="gray" />
            <Card titulo="🎯 Para hoje — quantidades automáticas"
              desc="Cada ingrediente com a quantidade calculada para o número médio de refeições daquele dia. Domingo: ~82 refeições. Segunda: ~63. Terça: ~58. Quarta: ~65. Quinta: ~68. Sexta: ~70. Tudo automático."
              cor="green" />
            <Card titulo="👤 Por pessoa — referência base"
              desc="Quantidades por porção individual. Útil para adaptar manualmente quando o número real for muito diferente da média."
              cor="gray" />
            <Card titulo="🥦 Nutrição por porção"
              desc="Calorias, Proteínas, Carboidratos, Gorduras, Fibras e Sódio. Referência para manter o cardápio equilibrado ao longo da semana."
              cor="purple" />
            <Card titulo="🔀 Substituições e dica de produção"
              desc="Alternativas caso falte algum ingrediente e um truque específico do prato para melhor resultado — baseado na experiência da casa."
              cor="yellow" />
          </div>

          <div className="rounded-2xl bg-[#1a5c3a]/5 p-4 ring-1 ring-[#1a5c3a]/10">
            <p className="mb-2 font-bold text-[#1a5c3a]">📊 De onde vêm as quantidades?</p>
            <p className="text-sm text-gray-700">
              Calculadas a partir da <strong>média histórica real por dia da semana</strong> —
              mais de 1.400 registros extraídos do histórico do WhatsApp ao longo de 3 anos de operação.
              Domingo: ~82 · Segunda: ~63 · Terça: ~58 · Quarta: ~65 · Quinta: ~68 · Sexta: ~70 · Sábado: ~65.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            05 — COTAÇÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="cotacao" emoji="💬" titulo="Cardápio › Cotação integrada" badge="IA"
          subtitulo="O coração financeiro do sistema. Cole a mensagem do fornecedor e a IA faz o resto.">

          <Destaque cor="blue" icone="🤖"
            texto="A Cotação fica dentro do Cardápio — porque preço e prato são decisões inseparáveis. Cole a mensagem do WhatsApp do fornecedor e a IA identifica cada item e preço sem nenhuma digitação manual." />

          <p>
            A Cotação fica no final da sub-aba <strong>Cardápio</strong>, na seção "Cotação — catálogo de preços".
            É o local central de todos os preços da casa.
          </p>

          <div className="space-y-4">
            <Passo num={1} titulo="Copie a mensagem do fornecedor no WhatsApp"
              texto="Toque e segure na mensagem com os preços, depois copie o texto completo." />
            <Passo num={2} titulo='Cole na caixa de texto e clique em "Analisar"'
              texto="A IA lê o texto, identifica os itens e seus preços, e monta a tabela de cotação com fornecedor vinculado automaticamente." />
            <Passo num={3} titulo="Revise e aplique"
              texto="Verifique se está certo e toque em 'Aplicar preços'. O custo estimado da semana atualiza em tempo real no cardápio." />
            <Passo num={4} titulo="Compare fornecedores — automaticamente"
              texto="Lance cotações de mais de um fornecedor: o sistema marca o mais barato de cada item com um indicador visual. A economia aparece calculada." />
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="mb-2 font-bold text-green-800">🛡️ Validação histórica automática</p>
            <p className="text-sm text-green-700">
              O sistema compara cada preço cotado com o histórico do mesmo item. Se subiu mais de 15%,
              aparece alerta vermelho com a variação em %. Se caiu, sugere aproveitar para comprar mais.
              O sistema aprende com cada cotação que você faz.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 font-bold text-blue-800">🟢 Selo de confiança — você decide com base sólida</p>
            <p className="text-sm text-blue-700">
              Ao lado de cada preço, um selo colorido mostra o quanto aquele valor é confiável:
              <strong> 🟢 verde</strong> (muitas cotações, vários fornecedores, preço recente),
              <strong> 🟡 amarelo</strong> (base parcial) ou <strong>🔴 cinza</strong> (preço estimado).
              Toque no selo para ver a base — "18 cotações, 4 fornecedores, cotado há 7 dias". O número
              deixa de ser um palpite e passa a ter lastro.
            </p>
          </div>

          <p className="text-sm text-gray-600">
            A <strong>Nota Fiscal</strong> (em Compras) também alimenta os preços da Cotação —
            ao aplicar uma NF, os valores entram no mesmo catálogo. O fluxo é um ciclo inteligente:
            cota → compra → recebe a NF → preços se atualizam → próxima cotação já tem histórico.
          </p>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            06 — OPERAÇÃO DIÁRIA
        ════════════════════════════════════════════════════ */}
        <Secao id="operacao" emoji="🍽️" titulo="Cardápio › Operação diária"
          subtitulo="Registro de refeições, contagem e sobras. O que acontece durante e após o serviço.">

          <p>A sub-aba <strong>Operação</strong> no Cardápio reúne tudo que a equipe registra durante e após o serviço — em menos de 2 minutos por dia.</p>

          <div className="space-y-3">

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">🍽️ Contador de Refeições</p>
              <p className="mb-3 text-sm text-gray-600">
                Registre almoço e jantar de cada dia. O sistema já vem com{' '}
                <strong>32.837 refeições pré-carregadas</strong> desde setembro de 2024 — extraídas do histórico do WhatsApp.
                Cada novo registro que você faz se soma ao histórico.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Hoje', 'Almoço + Jantar com alerta de pico'],
                  ['Esta semana', 'Total de segunda a hoje'],
                  ['Este ano', 'Com % vs ano anterior'],
                  ['Total histórico', '485 dias · 3 anos'],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                    <p className="text-xs font-bold text-gray-700">{t}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-800">⚠️ Alerta de pico automático</p>
                <p className="mt-0.5 text-xs text-orange-700">
                  Se o total do dia ultrapassar 120% da média histórica para aquele dia da semana,
                  o card fica dourado e avisa a equipe para revisar porções e verificar o estoque.
                </p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                O gráfico de 12 meses mostra a tendência. Os placeholders nos campos já exibem a média esperada para cada dia da semana.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">📉 Registro de Sobras</p>
              <p className="text-sm text-gray-600">
                Informe o produzido e o consumido de cada prato. O sistema calcula o percentual de desperdício,
                o custo do que foi perdido e identifica quais pratos geram mais sobra — por dia da semana e por proteína.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">🔄 Avanço de etapa</p>
              <p className="text-sm text-gray-600">
                A equipe de Cozinha confirma que o cardápio foi revisado e avança a semana de "Rascunho"
                para "Cozinha" por aqui. Cada etapa avançada notifica o próximo responsável.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Após o almoço: registre o número de refeições"
              texto='Digite no campo "Almoço" e pressione Enter ou OK. Leva menos de 10 segundos.' />
            <Passo num={2} titulo="Após o jantar: complete o registro do dia"
              texto="Preencha o campo Jantar. O total atualiza e os stats refletem imediatamente — incluindo o gráfico mensal." />
            <Passo num={3} titulo="Registre as sobras do dia"
              texto="Produzido vs. consumido de cada prato. Mesmo um número aproximado já alimenta o relatório de desperdício." />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            07 — AVALIAÇÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="avaliacao" emoji="⭐" titulo="Cardápio › Avaliação e Desperdício"
          subtitulo="O que a equipe achou. Dados que o sistema usa para melhorar o cardápio automaticamente.">

          <p>A sub-aba <strong>Avaliação</strong> aparece no Cardápio quando a semana avança para Recebimento ou Conclusão. Quanto mais avaliações, mais inteligente o sistema fica.</p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">QR Code no refeitório (método preferido)</p>
              <p className="mb-3 text-sm text-gray-600">
                Imprima a plaquinha de avaliação e cole na parede. A equipe escaneia com o celular
                e avalia o prato em menos de 20 segundos — sem abrir o sistema.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[['😍', 'Ótimo', 'green'], ['😐', 'Regular', 'yellow'], ['😞', 'Ruim', 'red']].map(([e, r, c]) => (
                  <div key={r} className={`rounded-xl p-2 text-center ring-1 ${c === 'green' ? 'bg-green-50 ring-green-100' : c === 'yellow' ? 'bg-yellow-50 ring-yellow-100' : 'bg-red-50 ring-red-100'}`}>
                    <div className="text-xl">{e}</div>
                    <div className={`mt-0.5 text-[10px] font-bold ${c === 'green' ? 'text-green-700' : c === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>{r}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Lista itens={[
            'Cada prato acumula nota média ao longo do tempo — histórico permanente',
            'Pratos com nota baixa aparecem em vermelho no DNA da casa e nos relatórios',
            'O Chef IA considera as avaliações para não sugerir pratos rejeitados',
            'Pratos campeões (nota alta + baixo desperdício) aparecem em destaque no ranking',
            'A IA proativa avisa quando um prato rejeitado está no cardápio desta semana',
          ]} />

          <Destaque cor="green" icone="💰"
            texto="Reduzir desperdício de 18% para 8% pode economizar R$ 800 ou mais por mês. Cada registro de sobra vale dinheiro — mesmo que seja um número aproximado." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            08 — COMPRAS
        ════════════════════════════════════════════════════ */}
        <Secao id="compras" emoji="🛒" titulo="Compras — lista e execução"
          subtitulo="Lista calculada automaticamente pelo cardápio. Descontando o que já tem no estoque.">

          <Destaque cor="green" icone="🎯"
            texto="A lista de compras é calculada automaticamente. Você monta o cardápio, define o número de refeições, e a lista aparece pronta com cada ingrediente na quantidade exata — já descontando o que está no estoque." />

          <p>A aba Compras tem cinco sub-abas:</p>

          <SubAbas abas={[
            { rotulo: 'Lista', desc: 'Itens a comprar' },
            { rotulo: 'Nota Fiscal', desc: 'Leitura por IA' },
            { rotulo: 'Estoque', desc: 'Saldo atual' },
            { rotulo: 'Fornecedores', desc: 'Perfis e histórico' },
            { rotulo: 'Pedido', desc: 'WhatsApp direto' },
          ]} />

          <p>Três status para cada item da lista:</p>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { emoji: '⬜', nome: 'A comprar', bg: 'bg-gray-100', cor: 'text-gray-700' },
              { emoji: '🛍️', nome: 'Comprado', bg: 'bg-yellow-50', cor: 'text-yellow-800' },
              { emoji: '✅', nome: 'Recebido', bg: 'bg-green-50', cor: 'text-green-800' },
            ].map((e) => (
              <div key={e.nome} className={`rounded-2xl p-3 ${e.bg}`}>
                <div className="text-2xl">{e.emoji}</div>
                <div className={`mt-1 text-xs font-bold ${e.cor}`}>{e.nome}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Vá em Compras → Lista de compras"
              texto="A lista já aparece calculada, descontando automaticamente o que já está no estoque." />
            <Passo num={2} titulo="Imprima ou compartilhe se preferir"
              texto="Toque no ícone de impressora para gerar PDF ou compartilhe direto pelo celular." />
            <Passo num={3} titulo="Marque conforme compra"
              texto="Toque no item e marque como 'Comprado'. O progresso aparece na barra do Início." />
            <Passo num={4} titulo="No recebimento, marque como recebido"
              texto="Ao receber, marque e registre o preço real pago — isso alimenta o custo real da semana e o histórico de preços." />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto="Se o estoque já tem 5 kg de frango e o cardápio precisa de 15 kg, a lista mostra só 10 kg. O desconto é automático — você nunca compra o que já tem." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            09 — NOTA FISCAL
        ════════════════════════════════════════════════════ */}
        <Secao id="nf" emoji="🧾" titulo="Compras › Nota Fiscal com IA" badge="IA"
          subtitulo="Fotografe e a IA extrai itens e preços automaticamente — sem digitar nada.">

          <Destaque cor="purple" icone="📸"
            texto="A IA analisa a foto da nota e identifica produto, quantidade e preço — mesmo em notas rasgadas, dobradas ou com letra pequena. Os preços extraídos entram diretamente no catálogo da Cotação." />

          <div className="space-y-4">
            <Passo num={1} titulo="Compras → Nota Fiscal → Fotografar ou enviar NF"
              texto="Tire uma foto na hora ou escolha uma imagem da galeria. Aceita JPG, PNG e PDF." />
            <Passo num={2} titulo="Aguarde a leitura (5 a 15 segundos)"
              texto="A IA processa a imagem e extrai todos os itens. Uma barra de progresso mostra o andamento." />
            <Passo num={3} titulo="Revise os itens encontrados"
              texto="Itens em amarelo não foram reconhecidos com certeza — confirme antes de aplicar. Os reconhecidos com certeza ficam em verde." />
            <Passo num={4} titulo='Toque em "Aplicar preços"'
              texto="Os valores entram no catálogo, o custo real da semana é atualizado e o histórico de preços registra a data." />
          </div>

          <Destaque cor="blue" icone="💡"
            texto="Fotografe em ambiente bem iluminado, sem sombras. Notas dobradas: abra completamente antes de fotografar. PDFs têm qualidade melhor que fotos — prefira quando disponível." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            10 — ESTOQUE
        ════════════════════════════════════════════════════ */}
        <Secao id="estoque" emoji="📦" titulo="Compras › Estoque"
          subtitulo="Controle do que está na despensa. Desconta automaticamente da lista de compras.">

          <Lista itens={[
            'Saber o saldo de cada ingrediente sem ir fisicamente à despensa',
            'Descontar automaticamente da lista o que já tem guardado',
            'Receber alerta quando um item cai abaixo do mínimo definido',
            'Rastrear o consumo de cada ingrediente ao longo das semanas',
          ]} />

          <div className="space-y-4">
            <Passo num={1} titulo="Entrada — chegou mercadoria"
              texto='Compras → Estoque, procure o item, toque em "+" e informe a quantidade recebida.' />
            <Passo num={2} titulo="Baixa automática ao concluir a semana"
              texto="Quando a semana avança para 'Concluído', os ingredientes usados são descontados automaticamente do estoque." />
            <Passo num={3} titulo="Definir estoque mínimo"
              texto="Toque no item e defina o mínimo aceitável. Abaixo disso, aparece alerta vermelho no Briefing do Início." />
            <Passo num={4} titulo="Inventário físico mensal"
              texto="Uma vez por mês, conte fisicamente e ajuste: Estoque → item → Ajustar saldo. Mantém a precisão ao longo do tempo." />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            11 — FORNECEDORES E PEDIDOS
        ════════════════════════════════════════════════════ */}
        <Secao id="fornecedores" emoji="🤝" titulo="Compras › Fornecedores e Pedidos"
          subtitulo="Inteligência de fornecedores, histórico de entregas e envio de pedidos pelo WhatsApp.">

          <Destaque cor="green" icone="🧠"
            texto="O sistema não só cadastra fornecedores — ele os monitora. Depois de algumas avaliações, ele diz qual está melhor agora, qual tem melhor taxa de entrega e quais estão ficando mais caros." />

          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4 text-white">
            <p className="mb-2 font-bold">🛒 Parecer do comprador — abre com a conclusão</p>
            <p className="text-sm text-gray-200">
              O radar de fornecedores (em Relatórios → Fornecedores) não despeja mais tabelas. Ele fala
              como um comprador sênior: abre dizendo <strong>"Identifiquei R$ X de economia possível nesta
              cotação"</strong> e lista as recomendações priorizadas — <strong>trocar</strong> (proteína em
              alta com substituto mais barato), <strong>reforçar</strong> (item que caiu de preço) e
              <strong> atenção</strong> (alta sem alternativa). A decisão vem primeiro; os dados ficam logo abaixo.
            </p>
          </div>

          <div className="space-y-2">
            <Card titulo="📋 Perfil e inteligência"
              desc="Cada fornecedor tem uma página com avaliações de qualidade e pontualidade, quais itens ele fornece e a qual preço. O painel de inteligência aponta automaticamente o melhor agora — baseado em score combinado de qualidade e confiabilidade."
              cor="blue" />
            <Card titulo="📈 Histórico de preços por item"
              desc="O sistema rastreia o histórico de preços de cada item por fornecedor. Se um fornecedor está subindo consistentemente, o radar detecta e alerta. Se outro está caindo, aponta a oportunidade."
              cor="green" />
            <Card titulo="📲 Pedido — WhatsApp em 1 toque"
              desc="Selecione os itens e o fornecedor desejado. O sistema gera o texto do pedido formatado profissionalmente e abre o WhatsApp com a mensagem pronta. Você só confirma o envio."
              cor="gray" />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto="Fornecedores reconhecidos automaticamente nas cotações e notas fiscais: WG · Apetito Foods · Vita Frango · Jampac · Frito Sul. Para adicionar outros, vá em Compras → Fornecedores → editar perfil." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            12 — RELATÓRIOS
        ════════════════════════════════════════════════════ */}
        <Secao id="relatorios" emoji="📊" titulo="Relatórios — análise gerencial"
          subtitulo="Visão financeira completa, histórico comparativo e auditoria. Para quem precisa de respostas rápidas e confiáveis.">

          <Destaque cor="yellow" icone="🔒"
            texto="Relatórios é exclusivo do Gestor e Administrador. A equipe operacional não acessa esta área — o que preserva a confidencialidade dos números financeiros." />

          <p>Quatro KPIs no topo mostram a semana de relance:</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['Custo da semana', 'Total cotado ou real'],
              ['Custo / refeição', 'Quanto custou cada prato'],
              ['Aceitação média', 'Nota dos pratos avaliados'],
              ['Desperdício %', 'Produzido e não consumido'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
                <p className="text-xs font-bold text-gray-700">{k}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{v}</p>
              </div>
            ))}
          </div>

          <p className="font-semibold text-gray-800">Sub-abas dos Relatórios:</p>

          <div className="space-y-2">
            <Card titulo="Visão geral" desc="Central gerencial com resumo financeiro completo da semana, histórico de custos e comparativo com semanas anteriores." cor="gray" />
            <Card titulo="Custos" desc="Detalhamento por categoria (proteína, verdura, etc.) e por dia. Custo por prato, ROI da operação e onde está indo cada real gasto." cor="blue" />
            <Card titulo="DNA & Rankings" desc="A história da casa em linha do tempo + perfil alimentar: proteínas mais usadas, campeões de aceitação, pratos a evitar e os 485 dias de operação." cor="purple" />
            <Card titulo="Previsão" desc="Projeção de demanda com três cenários — pessimista, esperado e otimista. Aplique diretamente ao cardápio para recalcular a lista de compras." cor="green" />
            <Card titulo="Fornecedores" desc="O Comprador Virtual: abre com o parecer e a economia possível, depois o radar de preços com tendências e alertas de variação anormal por fornecedor." cor="gray" />
            <Card titulo="Gastos reais" desc="Gastos de verdade da planilha jan–mai/2026: total e média mensal, evolução mês a mês com variação % e o ranking dos itens que mais pesam no orçamento." cor="green" />
            <Card titulo="Auditoria" desc="Histórico completo de tudo que foi alterado — quem mudou, o quê e quando. Exclusivo para Administrador." cor="yellow" />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            13 — DNA
        ════════════════════════════════════════════════════ */}
        <Secao id="dna" emoji="🧬" titulo="Relatórios › DNA e Rankings"
          subtitulo="O sistema aprende o perfil do Tatá House. 3 anos de operação condensados em insights acionáveis.">

          <Destaque cor="dark" icone="✦"
            texto="O DNA não é um relatório. É a memória viva da casa — o que funcionou, o que falhou, o que a equipe mais aprecia e o que vai ao lixo toda semana. É aqui que a história da operação é contada com dados." />

          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4 text-white">
            <p className="mb-2 font-bold">📖 A história da casa — linha do tempo</p>
            <p className="text-sm text-gray-200">
              No topo da aba, a operação é contada como narrativa: <strong>32.837 refeições servidas</strong>
              desde setembro de 2024, divididas em capítulos por ano — "O começo", "Consolidação", "O ano em
              curso" — cada um com o ritmo real do período. Um mini-gráfico mostra o volume mês a mês e destaca
              o mês recorde. Tudo extraído das contagens reais; nada inventado.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="mb-2 font-bold text-yellow-800">🏆 Conquistas da Casa — marcos de orgulho</p>
            <p className="text-sm text-yellow-700">
              Acima da linha do tempo, o sistema exibe os grandes marcos da operação:
              primeiras 10.000 refeições, 1 ano completo de registro, 50 semanas consecutivas,
              100+ pratos diferentes servidos. Cada conquista fica fixada no momento em que
              aconteceu — um reconhecimento do esforço coletivo da equipe, extraído dos dados
              reais sem nenhuma configuração manual.
            </p>
          </div>

          <div className="space-y-2">
            <Card titulo="🥩 Proteínas mais servidas"
              desc="Ranking de qual proteína domina o cardápio com % histórico real. Ex: Frango 42% · Boi 28% · Peixe 15%. O sistema cruza com a aceitação média de cada proteína para dizer qual vale mais a pena priorizar." cor="blue" />
            <Card titulo="🏆 Pratos campeões — a seleção da casa"
              desc="Os favoritos absolutos — nota alta, consumo total elevado e pouca sobra. São esses pratos que devem aparecer com frequência no cardápio. O sistema os destaca automaticamente." cor="green" />
            <Card titulo="❌ Pratos a evitar — com rastreabilidade"
              desc="Nota abaixo de 3 OU desperdício acima de 20%. O sistema aponta especificamente o que precisa sair do rodízio ou ter a receita reformulada." cor="red" />
            <Card titulo="📊 O que os dados revelam"
              desc="Um bloco de narrativa gerado pelo sistema sintetiza os insights mais importantes: qual proteína tem a maior aceitação, qual é o prato favorito, qual candidato a sair do rodízio." cor="purple" />
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 font-bold text-blue-800">🎯 Objetivos da semana — planos de ação concretos</p>
            <p className="mb-3 text-sm text-blue-700">Escolha um objetivo e o sistema monta um plano de ação específico:</p>
            <div className="space-y-1.5">
              {[
                ['Reduzir custo', 'Identifica substitutos mais baratos e pratos econômicos com boa aceitação'],
                ['Reduzir desperdício', 'Aponta quais pratos produzir em menor quantidade e em quais dias'],
                ['Melhorar aceitação', 'Coloca os favoritos nos dias de maior frequência'],
                ['Equilibrar proteínas', 'Distribui melhor entre frango, boi, peixe e alternativas'],
              ].map(([o, a]) => (
                <div key={o} className="rounded-xl bg-white p-2.5">
                  <p className="text-xs font-bold text-blue-800">{o}</p>
                  <p className="text-[11px] text-blue-600">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            14 — PREVISÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="previsao" emoji="🔮" titulo="Relatórios › Previsão de demanda"
          subtitulo="O sistema prevê a semana com base no histórico real. Você escolhe o cenário.">

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['😟', 'Pessimista', 'Evita desperdício'],
              ['😊', 'Esperado', 'O mais provável'],
              ['😄', 'Otimista', 'Para eventos especiais'],
            ].map(([e, n, d]) => (
              <div key={n} className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
                <div className="text-xl">{e}</div>
                <p className="mt-1 text-xs font-bold text-gray-700">{n}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">{d}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Relatórios → Previsão"
              texto="Veja os três cenários para cada dia da semana que está sendo montada." />
            <Passo num={2} titulo='Toque em "Usar essa previsão"'
              texto="O número de refeições do cardápio atualiza automaticamente para o cenário escolhido." />
            <Passo num={3} titulo="A lista de compras recalcula"
              texto="Com os novos números, todas as quantidades de ingredientes são recalculadas instantaneamente." />
          </div>

          <Destaque cor="green" icone="📈"
            texto="Quanto mais semanas registradas, mais precisa fica a previsão. O sistema considera sazonalidade por dia da semana e tendências de médio prazo — não apenas a última semana." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            15 — ASSISTENTE
        ════════════════════════════════════════════════════ */}
        <Secao id="assistente" emoji="🤖" titulo="Assistente de IA" badge="Estratégico"
          subtitulo="Não espera a pergunta. Ao abrir, já apresenta o trabalho feito — como um analista que adiantou a análise da semana.">

          <Destaque cor="dark" icone="✦"
            texto='Toque no ícone 💬 no canto inferior direito e a IA já abre com a posição pronta: "Já analisei a semana. Identifiquei R$ X de economia possível e N frentes de ação" — seguida das frentes priorizadas e do botão "Montar plano de economia", que conduz a conversa. Ela toma a iniciativa; você decide.' />

          <Destaque cor="blue" icone="💬"
            texto="Depois da abertura, pergunte o que quiser em linguagem natural. O Assistente conhece os pratos, fornecedores, preços e histórico desta casa — responde com os dados reais, não com estimativas genéricas." />

          <Destaque cor="green" icone="🤖"
            texto="Três abas num só lugar: 'Perguntar' (o chat), 'Chef IA' (as recomendações da semana — economia, baixa aceitação, excesso de proteína, repetição, risco de desperdício) e 'Objetivos'. Toda a inteligência do sistema centralizada aqui, sem se perder no meio das telas." />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              'Onde estou gastando mais esta semana?',
              'Quais pratos a equipe mais gosta?',
              'Como reduzir o custo por refeição?',
              'Quais itens subiram de preço?',
              'Qual fornecedor está mais barato agora?',
              'O que está acabando no estoque?',
              'Quais pratos geram mais desperdício?',
              'Como montar um cardápio mais econômico?',
            ].map((p) => (
              <div key={p} className="rounded-2xl bg-gray-100 px-3 py-2.5 text-sm text-gray-700">"{p}"</div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-1 font-bold text-gray-800">Badge vermelho no botão do Assistente</p>
            <p className="text-sm text-gray-600">
              Significa que algo crítico foi detectado proativamente — preço anormal, estoque crítico,
              prato rejeitado no cardápio, oportunidade de economia com substituto. Toque para ver o alerta
              com a sugestão de ação.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            16 — FLUXO
        ════════════════════════════════════════════════════ */}
        <Secao id="fluxo" emoji="🔄" titulo="Etapas da semana — o Fluxo"
          subtitulo="Cada semana passa por 5 etapas. Cada equipe cuida da sua parte. Ninguém depende de ninguém para saber o que fazer.">

          <div className="space-y-3">
            {[
              { num: '1', nome: 'Rascunho', quem: 'Gestor', cor: 'bg-gray-200 text-gray-700', desc: 'O gestor monta o cardápio. Tudo pode ser alterado livremente. A lista de compras está sendo calculada em tempo real.' },
              { num: '2', nome: 'Cozinha', quem: 'Cozinha', cor: 'bg-orange-100 text-orange-700', desc: 'A cozinha revisou o cardápio e aprovou. Avança pela sub-aba Operação confirmando que está pronta para executar.' },
              { num: '3', nome: 'Compras', quem: 'Compras', cor: 'bg-blue-100 text-blue-700', desc: 'A lista está finalizada. O responsável está comprando. A etapa avança automaticamente quando todos os itens são marcados.' },
              { num: '4', nome: 'Recebimento', quem: 'Recebimento', cor: 'bg-purple-100 text-purple-700', desc: 'As compras chegaram. Cada item é conferido fisicamente, o preço real registrado. O custo real da semana aparece aqui.' },
              { num: '5', nome: 'Concluído', quem: 'Gestor', cor: 'bg-green-100 text-green-700', desc: 'Semana encerrada. Custo real calculado, estoque atualizado automaticamente e dados disponíveis nos relatórios.' },
            ].map((e) => (
              <div key={e.num} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${e.cor}`}>{e.num}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-800">{e.nome}</p>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{e.quem}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            17 — AJUSTES
        ════════════════════════════════════════════════════ */}
        <Secao id="ajustes" emoji="⚙️" titulo="Ajustes — equipe e acesso"
          subtitulo="Cadastre a equipe com restrições alimentares e configure os PINs de acesso.">

          <div className="space-y-4">
            <Passo num={1} titulo="Ajustes → Equipe e restrições alimentares"
              texto="Cadastre nome, cargo e qualquer restrição (lactose, glúten, vegetariano, etc.). O sistema avisa quando um prato do cardápio contém ingrediente que alguém não pode consumir." />
            <Passo num={2} titulo="O sistema monitora o cardápio por você"
              texto="Se um prato da semana contém ingrediente que algum funcionário não pode comer, aparece alerta automático no Cardápio." />
            <Passo num={3} titulo="Configurações de acesso — só Gestor e Administrador"
              texto="Aqui são definidos e alterados os PINs de cada cargo. Os PINs protegem as funções sensíveis do sistema." />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            18 — PAPÉIS
        ════════════════════════════════════════════════════ */}
        <Secao id="papeis" emoji="🎭" titulo="Quem pode fazer o quê"
          subtitulo="Cada cargo acessa exatamente o que precisa para fazer seu trabalho. Nada a mais, nada a menos.">

          <TabelaPapeis />

          <Destaque cor="yellow" icone="🔑"
            texto="Para trocar de cargo, vá em Ajustes → Configurações de acesso e informe o PIN. Peça ao gestor se não souber o seu. Trocar de cargo não apaga nenhum dado." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            19 — FAQ
        ════════════════════════════════════════════════════ */}
        <Secao id="faq" emoji="❓" titulo="Perguntas frequentes"
          subtitulo="As dúvidas mais comuns — com respostas diretas e sem jargão.">

          <div className="space-y-4">
            {[
              {
                p: 'Apaguei algo sem querer. Perdi os dados?',
                r: 'Não. O sistema salva automaticamente em tempo real. Relatórios → Auditoria mostra o histórico completo de todas as alterações — quem mudou, o quê e quando.',
              },
              {
                p: 'A lista de compras está com quantidade errada.',
                r: 'Verifique se: (1) todos os dias da semana têm prato preenchido, (2) o número de refeições está correto, (3) o estoque está atualizado. A lista é calculada a partir dessas três informações.',
              },
              {
                p: 'O custo da semana está zerado ou incompleto.',
                r: 'O custo só aparece depois que os preços são lançados na Cotação, dentro do Cardápio. Lance os preços e o custo aparece em tempo real.',
              },
              {
                p: 'A IA não encontrou os fornecedores corretos na cotação.',
                r: 'Verifique se o fornecedor está cadastrado em Compras → Fornecedores. WG, Apetito, Vita Frango, Jampac e Frito Sul são reconhecidos automaticamente. Para outros, cadastre uma vez e o sistema passa a reconhecer.',
              },
              {
                p: 'Como imprimir a lista de compras?',
                r: 'Compras → Lista de compras → ícone de impressora. Gera PDF para imprimir ou salvar no celular.',
              },
              {
                p: 'Posso ver semanas anteriores?',
                r: 'Sim. Toque na data no topo para abrir o seletor de semanas e navegue por qualquer semana já registrada. O histórico completo está disponível.',
              },
              {
                p: 'O sistema ficou lento ou travou.',
                r: 'Feche e abra o navegador. Todos os dados ficam salvos — você não perde nada. Se continuar lento, verifique a conexão com a internet.',
              },
              {
                p: 'A leitura da nota fiscal não reconheceu alguns itens.',
                r: 'Itens em amarelo não foram reconhecidos com certeza — corrija manualmente antes de aplicar. Com o tempo, o sistema aprende os itens mais comuns da sua operação.',
              },
              {
                p: 'O contador de refeições está mostrando dados muito antigos?',
                r: 'Os dados históricos vêm pré-carregados (set/2024 a jun/2026) — são a base de comparação. Novos registros que você fizer são adicionados ao topo e ficam salvos no seu dispositivo.',
              },
              {
                p: 'A busca global (⌘K) serve para quê?',
                r: 'Para ir diretamente a qualquer prato, fornecedor, relatório ou ação do sistema sem precisar navegar pelas abas. É o atalho de poder do sistema — como uma paleta de comandos.',
              },
              {
                p: 'O que significam as bolinhas coloridas ao lado dos preços?',
                r: 'É o selo de confiança do preço. Verde = base sólida (muitas cotações, vários fornecedores, preço recente). Amarelo = base parcial. Cinza = preço estimado. Toque no selo para ver em quantas evidências aquele valor se apoia.',
              },
              {
                p: 'Por que o radar de fornecedores agora começa com um texto?',
                r: 'É o Parecer do Comprador: em vez de mostrar tabelas primeiro, o sistema abre com a conclusão — quanto dá para economizar e o que trocar, reforçar ou renegociar. Os dados detalhados continuam logo abaixo, para quem quiser conferir.',
              },
              {
                p: 'O que são os números que aparecem abaixo do nome de cada prato no Cardápio?',
                r: 'É a linha de inteligência PratoIntel. Ela mostra: a nota média em estrelas (com quantas avaliações), quantas vezes o prato foi servido recentemente e o custo estimado por pessoa. Verde = bem avaliado. Amarelo = prato repetindo muito. "preço incompleto" em vermelho = falta lançar preços na Cotação para calcular o custo.',
              },
              {
                p: 'O Briefing sumiu o aviso dourado de destaque da IA. Onde foi parar?',
                r: 'O aviso proativo foi integrado diretamente ao Briefing. Quando não há alertas urgentes, o Briefing exibe o ícone ⚡ com o insight mais relevante da semana e o link "Analisar com IA →". A informação está no mesmo lugar — só deixou de ser um banner separado para ficar mais limpo.',
              },
              {
                p: 'Montei o cardápio no celular e não apareceu no computador. Por quê?',
                r: 'Quando a nuvem está ligada, tudo sincroniza sozinho entre os aparelhos, ao vivo — o que você monta no celular aparece no computador em segundos, sem recarregar. Confira o indicador no topo: "Sincronizado" (bolinha verde) = nuvem ativa. Se não aparecer nenhum indicador, o aparelho está trabalhando só localmente (os dados ficam salvos nele, mas não viajam para os outros) — nesse caso o gestor precisa ativar a nuvem nas configurações do sistema.',
              },
              {
                p: 'Onde encontro o Chef IA agora?',
                r: 'O Chef IA foi centralizado no assistente de Inteligência — o botão flutuante no canto inferior direito. Toque nele e vá na aba "Chef IA" para ver as recomendações da semana. Antes ele ficava no meio da aba Cardápio; agora toda a inteligência mora num lugar só.',
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a0e] via-[#1a5c3a] to-[#071a0e] p-10 text-center text-white shadow-xl">
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-tata.png" alt="Tatá House" width={40} height={40} className="h-10 w-10 object-contain brightness-0 invert" loading="lazy" />
            </div>
            <p className="font-display text-2xl font-bold tracking-tight">Tatá House</p>
            <p className="mt-1 text-sm text-emerald-200/70">Sistema de Gestão · versão 2026</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { num: '32.837+', label: 'refeições registradas' },
                { num: '485', label: 'dias de operação' },
                { num: '3 anos', label: 'de dados históricos' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/8 px-2 py-3">
                  <p className="font-display text-lg font-bold text-white">{s.num}</p>
                  <p className="mt-0.5 text-[10px] text-emerald-200/60">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs text-emerald-300/50">
              Dúvidas? Fale com o gestor responsável.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
