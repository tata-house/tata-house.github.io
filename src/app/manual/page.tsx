/* =====================================================================
   Manual do Sistema — Tatá House
   Documentação oficial alinhada à versão final do produto.
   ===================================================================== */

import { Icone } from '@/components/Icones';
import { BotaoBaixarManual } from './BotaoBaixarManual';

export const metadata = {
  title: 'Manual do Sistema — Tatá House',
  description: 'Guia completo do sistema de gestão do Tatá House.',
};

/* ── Componentes de layout ──────────────────────────────────── */

function Capa() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2e1a] via-[#1a5c3a] to-[#0a2e1a] px-8 py-14 text-center shadow-2xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-80 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
      <div className="relative z-10">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 shadow-xl ring-2 ring-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-tata.png"
            alt="Tatá House"
            className="h-14 w-14 object-contain brightness-0 invert"
          />
        </div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-green-300/70">
          Sistema de Gestão
        </p>
        <h1 className="font-display text-4xl font-bold text-white drop-shadow-md">Tatá House</h1>
        <p className="mt-2 text-xl font-semibold text-green-200">Manual do Sistema</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            { num: '5', label: 'módulos' },
            { num: '20+', label: 'funcionalidades' },
            { num: '3 anos', label: 'de histórico' },
            { num: 'IA', label: 'integrada' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-2 text-center ring-1 ring-white/10">
              <p className="font-display text-lg font-bold text-white">{s.num}</p>
              <p className="text-[10px] text-green-200">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-green-300/70">
          Guia oficial para toda a equipe — cozinha, compras, recebimento e gestão
        </p>
      </div>
    </div>
  );
}

/* ── Fluxo central ──────────────────────────────────────────── */

function FluxoCentral() {
  const etapas = [
    { icone: '🏠', nome: 'Início', desc: 'Briefing + KPIs' },
    { icone: '📅', nome: 'Cardápio', desc: 'Centro inteligente' },
    { icone: '🛒', nome: 'Compras', desc: 'Execução e estoque' },
    { icone: '📊', nome: 'Relatórios', desc: 'Análise gerencial' },
    { icone: '⚙️', nome: 'Ajustes', desc: 'Equipe e acesso' },
  ];
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Fluxo do sistema</p>
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
      <div className="mt-4 rounded-2xl bg-[#1a5c3a]/5 px-4 py-3">
        <p className="text-xs font-semibold text-[#1a5c3a]">
          O <strong>Cardápio</strong> é o centro inteligente do sistema — é de lá que saem as decisões de compra, custo e planejamento.
        </p>
      </div>
    </div>
  );
}

function Indice() {
  const capitulos = [
    { num: '01', nome: 'Como entrar no sistema', ancora: 'acesso' },
    { num: '02', nome: 'Início — briefing e panorama', ancora: 'inicio' },
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
            <span className={`text-sm ${it.nome.startsWith('Cardápio ›') || it.nome.startsWith('Compras ›') || it.nome.startsWith('Relatórios ›') ? 'text-gray-500' : 'font-medium text-gray-700'}`}>
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
  };
  const titleCor: Record<string, string> = {
    gray: 'text-gray-800', green: 'text-green-800', blue: 'text-blue-800',
    yellow: 'text-yellow-800', purple: 'text-purple-800', orange: 'text-orange-800',
  };
  const descCor: Record<string, string> = {
    gray: 'text-gray-600', green: 'text-green-700', blue: 'text-blue-700',
    yellow: 'text-yellow-700', purple: 'text-purple-700', orange: 'text-orange-700',
  };
  return (
    <div className={`rounded-2xl p-4 ${bg[cor]}`}>
      <p className={`mb-1 font-bold ${titleCor[cor]}`}>{titulo}</p>
      <p className={`text-sm ${descCor[cor]}`}>{desc}</p>
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
      pode: ['Ver o cardápio da semana', 'Consultar "Como Fazer" de cada prato', 'Avançar etapa "Cozinha"', 'Registrar desperdício', 'Ver e registrar refeições do dia'],
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
        <FluxoCentral />
        <Indice />

        {/* ═══════════════════════════════════════════════════
            01 — ACESSO
        ════════════════════════════════════════════════════ */}
        <Secao id="acesso" emoji="🔐" titulo="Como entrar no sistema"
          subtitulo="Celular, tablet ou computador. Sem instalar nada.">

          <Destaque cor="green" icone="✅"
            texto="O sistema funciona direto no navegador — Chrome, Safari ou Edge. Não precisa baixar nenhum aplicativo." />

          <div className="space-y-4">
            <Passo num={1} titulo="Abra o navegador do seu celular"
              texto="Use Chrome (Android) ou Safari (iPhone). Procure o ícone colorido na tela inicial." />
            <Passo num={2} titulo="Digite o endereço fornecido pelo gestor"
              texto="O endereço fica salvo no histórico depois do primeiro acesso." />
            <Passo num={3} titulo="Escolha o seu cargo"
              texto="Na tela inicial selecione: Gestor, Cozinha, Compras, Recebimento ou Administrador." />
            <Passo num={4} titulo="Pronto — você está dentro"
              texto="O sistema lembra do seu cargo mesmo se você fechar o celular ou desligar a tela." />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto='Dica: adicione o site na tela inicial do celular. Toque em "Compartilhar" (iPhone) ou "⋮ → Adicionar à tela inicial" (Android). Fica igual a um app e abre mais rápido!' />

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-1 font-bold text-gray-800">🔄 Mudar de cargo</p>
            <p className="text-sm text-gray-600">
              Acesse <strong>Ajustes → Configurações de acesso</strong> e informe o PIN do cargo desejado.
              Os PINs são definidos pelo gestor.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            02 — INÍCIO
        ════════════════════════════════════════════════════ */}
        <Secao id="inicio" emoji="🏠" titulo="Início — briefing e panorama"
          subtitulo="A primeira tela ao entrar. Mostra tudo o que importa agora, em segundos.">

          <Destaque cor="green" icone="🌅"
            texto="Abra o sistema toda manhã e leia o Briefing. Ele reúne os alertas mais importantes antes de você começar o dia." />

          <div className="space-y-3">
            <Card titulo="📋 Briefing do dia"
              desc="Alertas em ordem de prioridade: urgente (vermelho), atenção (amarelo), informativo (azul). Cobre estoque baixo, pratos sem preço, desperdício alto e mais."
              cor="green" />
            <Card titulo="📊 KPIs da semana"
              desc="Custo total, custo por refeição, aceitação média e percentual de desperdício — quatro números que resumem a semana. Atualizam em tempo real."
              cor="blue" />
            <Card titulo="⚡ Destaque da IA"
              desc="Quando o Assistente identifica algo crítico, aparece aqui como aviso dourado. Toque para ver a análise completa."
              cor="yellow" />
            <Card titulo="🔄 Fluxo da semana"
              desc="Barra de progresso: Rascunho → Cozinha → Compras → Recebimento → Concluído. Cada equipe vê em qual etapa está e qual é o próximo passo."
              cor="gray" />
          </div>

          <Destaque cor="blue" icone="📱"
            texto="O Início se adapta ao cargo. A cozinha vê o que precisa para o serviço. O gestor vê tudo. Não se preocupe se a tela de um colega parecer diferente." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            03 — CARDÁPIO (centro inteligente)
        ════════════════════════════════════════════════════ */}
        <Secao id="cardapio" emoji="📅" titulo="Cardápio — o centro inteligente"
          subtitulo="Aqui nascem todas as decisões. O cardápio alimenta a lista de compras, os custos e o planejamento.">

          <Destaque cor="green" icone="🎯"
            texto="O Cardápio é o módulo central do sistema. Tudo parte daqui: o que vai ser servido define o que precisa comprar, o custo da semana e o que a cozinha vai preparar." />

          <p>O Cardápio tem três sub-abas:</p>

          <SubAbas abas={[
            { rotulo: 'Cardápio', desc: 'Montar e planejar' },
            { rotulo: 'Operação', desc: 'Refeições e sobras' },
            { rotulo: 'Avaliação', desc: 'Notas e feedback' },
          ]} />

          <p className="font-semibold text-gray-800">Sub-aba Cardápio — montar a semana:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Escolha a semana"
              texto="Toque na data no topo da tela. Navegue pelas semanas disponíveis ou avance para a próxima." />
            <Passo num={2} titulo="Selecione os pratos de cada dia"
              texto="Toque em Segunda, Terça… e escolha o prato principal. A Guarnição e Salada seguem o mesmo processo." />
            <Passo num={3} titulo="Ajuste o número de refeições"
              texto="O sistema já sugere com base no histórico real. Altere se souber de um evento especial." />
            <Passo num={4} titulo="Salve — é automático"
              texto="Cada mudança é salva imediatamente. Não existe botão de salvar." />
          </div>

          <p className="font-semibold text-gray-800">Recursos inteligentes dentro do Cardápio:</p>

          <div className="space-y-2">
            <Card titulo="🤖 Chef IA"
              desc="Sugere pratos para cada dia analisando aceitação histórica, custo e variedade. Três modos: Tradicional (pratos já aprovados), Novo (combinações inéditas), Personalizado (você define as regras)."
              cor="green" />
            <Card titulo="🔄 Anti-monotonia"
              desc="Detecta quando a mesma proteína aparece muitas vezes na semana e avisa. Exemplo: 'Frango 3× esta semana — considere variar'."
              cor="yellow" />
            <Card titulo="🥗 Indicador Nutricional"
              desc="Mostra o equilíbrio semanal entre proteína, carboidrato, verdura e fibra. Um semáforo visual indica se o cardápio está equilibrado."
              cor="blue" />
            <Card titulo="💰 Custo em tempo real"
              desc="Conforme os preços são lançados na Cotação, o custo estimado por refeição aparece ao lado de cada prato e o total da semana atualiza instantaneamente."
              cor="gray" />
            <Card titulo="🔖 QR Code de avaliação"
              desc="Gere um QR Code para colar no refeitório. A equipe escaneia e avalia o prato do dia em menos de 20 segundos."
              cor="purple" />
          </div>

          <Destaque cor="yellow" icone="⚠️"
            texto='Se um prato aparecer com "!" é porque o preço ainda não foi lançado na Cotação. Sem preço, o custo da semana e a lista de compras ficam incompletos.' />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            04 — COMO FAZER
        ════════════════════════════════════════════════════ */}
        <Secao id="comofazer" emoji="👩‍🍳" titulo="Cardápio › Como Fazer" badge="Receitas inteligentes"
          subtitulo="Passo a passo de cada prato. Quantidades calculadas automaticamente para o dia de hoje.">

          <Destaque cor="green" icone="✨"
            texto="Toque em 'Como fazer' ao lado de qualquer prato no Cardápio. A receita aparece numa janela com tudo que a cozinha precisa — inclusive as quantidades já calculadas para hoje, sem precisar fazer conta." />

          <div className="space-y-2">
            <Card titulo="📋 Modo de preparo"
              desc="Passo a passo numerado, linguagem simples e direta. A cozinha consulta no celular durante o preparo sem sair do cardápio."
              cor="gray" />
            <Card titulo="🎯 Para hoje — quantidades automáticas"
              desc="Cada ingrediente com a quantidade calculada para o número médio de refeições do dia. Num Domingo: ~82 refeições. Numa Terça: ~58. Tudo automático."
              cor="green" />
            <Card titulo="👤 Por pessoa — referência"
              desc="Quantidades base por porção individual. Útil para adaptar quando o número real for diferente da média."
              cor="gray" />
            <Card titulo="🥦 Nutrição por porção"
              desc="Calorias, Proteínas, Carboidratos, Gorduras, Fibras e Sódio. Referência para manter o cardápio equilibrado."
              cor="purple" />
            <Card titulo="🔀 Substituições e dica de produção"
              desc="Alternativas caso falte algum ingrediente e um truque específico do prato para melhor resultado."
              cor="yellow" />
          </div>

          <div className="rounded-2xl bg-[#1a5c3a]/5 p-4 ring-1 ring-[#1a5c3a]/10">
            <p className="mb-2 font-bold text-[#1a5c3a]">📊 De onde vêm as quantidades?</p>
            <p className="text-sm text-gray-700">
              Calculadas a partir da <strong>média histórica real</strong> por dia da semana —
              mais de 1.400 registros reais extraídos do histórico do WhatsApp ao longo de 3 anos.
              Domingo ~82 · Segunda ~63 · Terça ~58 · Quarta ~65 · Quinta ~68 · Sexta ~70 · Sábado ~65.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            05 — COTAÇÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="cotacao" emoji="💬" titulo="Cardápio › Cotação integrada" badge="IA"
          subtitulo="Lance preços de fornecedores direto do Cardápio. A IA lê o WhatsApp automaticamente.">

          <Destaque cor="blue" icone="🤖"
            texto="A Cotação fica dentro do Cardápio — porque preço e prato são decisões da mesma tela. Cole a mensagem do WhatsApp do fornecedor e a IA identifica cada item e seu preço sem nenhuma digitação manual." />

          <p>A Cotação fica na sub-aba <strong>Cardápio</strong>, no final da tela, na seção "Cotação — catálogo de preços".</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Copie a mensagem do fornecedor no WhatsApp"
              texto="Toque e segure na mensagem com os preços, depois copie o texto." />
            <Passo num={2} titulo='Cole na caixa de texto e clique em "Analisar"'
              texto="A IA lê o texto, identifica os itens e os preços, e monta a tabela de cotação com fornecedor vinculado." />
            <Passo num={3} titulo="Revise e aplique"
              texto="Verifique se está certo e toque em 'Aplicar preços'. O custo da semana atualiza em tempo real." />
            <Passo num={4} titulo="Compare fornecedores"
              texto="Lance cotações de mais de um fornecedor: o sistema marca automaticamente o mais barato de cada item." />
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="mb-2 font-bold text-green-800">✅ Validação histórica</p>
            <p className="text-sm text-green-700">
              O sistema compara o preço cotado com o histórico do mesmo item. Se subiu mais de 15%, aparece alerta vermelho.
              Se caiu, sugere aproveitar para comprar mais e guardar em estoque.
            </p>
          </div>

          <p className="text-sm text-gray-600">
            A <strong>Nota Fiscal</strong> (na aba Compras) também alimenta os preços da Cotação —
            ao aplicar uma NF, os valores entram no mesmo catálogo que a Cotação usa. O fluxo é um ciclo:
            cota → compra → recebe a NF → preços se atualizam.
          </p>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            06 — OPERAÇÃO DIÁRIA
        ════════════════════════════════════════════════════ */}
        <Secao id="operacao" emoji="🍽️" titulo="Cardápio › Operação diária"
          subtitulo="Registro de refeições, contagem e sobras. Tudo numa só sub-aba.">

          <p>A sub-aba <strong>Operação</strong> no Cardápio reúne tudo que a equipe registra durante e após o serviço.</p>

          <div className="space-y-3">

            {/* Contador */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">🍽️ Contador de Refeições</p>
              <p className="mb-3 text-sm text-gray-600">
                Registre almoço e jantar de cada dia. O sistema já vem com
                <strong> 32.837 refeições pré-carregadas</strong> desde setembro de 2024 — extraídas do WhatsApp.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Hoje', 'Almoço + Jantar com alerta de pico'],
                  ['Esta semana', 'Total de segunda a hoje'],
                  ['Este ano', 'Com % vs ano anterior'],
                  ['Total histórico', '3 anos de dados'],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                    <p className="text-xs font-bold text-gray-700">{t}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-800">⚠️ Alerta de pico</p>
                <p className="mt-0.5 text-xs text-orange-700">
                  Se o total do dia ultrapassar 120% da média histórica, o card fica dourado e avisa a equipe para revisar porções e estoque.
                </p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                O gráfico de 12 meses mostra a tendência. Os placeholders nos campos já mostram a média esperada para o dia.
              </p>
            </div>

            {/* Desperdício */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">📉 Registro de Sobras</p>
              <p className="text-sm text-gray-600">
                Informe o produzido e o consumido de cada prato. O sistema calcula o percentual de desperdício,
                o custo do que foi perdido e identifica quais pratos desperdiçam mais.
              </p>
            </div>

            {/* Fluxo */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">🔄 Avanço de etapa</p>
              <p className="text-sm text-gray-600">
                A equipe de Cozinha avança a semana de "Rascunho" para "Cozinha" por aqui, confirmando
                que o cardápio foi revisado e aprovado.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Após o almoço: registre o número de refeições"
              texto='Digite no campo "Almoço" e pressione Enter ou OK.' />
            <Passo num={2} titulo="Após o jantar: complete o registro do dia"
              texto="Preencha o campo Jantar. O total atualiza e os stats refletem imediatamente." />
            <Passo num={3} titulo="Registre as sobras do dia"
              texto="Produzido vs. consumido de cada prato. Mesmo um número aproximado já ajuda muito." />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            07 — AVALIAÇÃO
        ════════════════════════════════════════════════════ */}
        <Secao id="avaliacao" emoji="⭐" titulo="Cardápio › Avaliação e Desperdício"
          subtitulo="O que a equipe achou do prato. Dados que melhoram o cardápio automaticamente.">

          <p>A sub-aba <strong>Avaliação</strong> aparece no Cardápio quando a semana avança para Recebimento ou Conclusão.</p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">QR Code no refeitório (recomendado)</p>
              <p className="mb-3 text-sm text-gray-600">
                Imprima e cole na parede. A equipe escaneia com o celular e avalia com um toque — menos de 20 segundos.
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
            'Cada prato acumula nota média ao longo do tempo',
            'Pratos com nota baixa aparecem em vermelho no relatório de Aceitação',
            'O Chef IA considera as avaliações para não sugerir pratos rejeitados',
            'Pratos favoritos aparecem em destaque no DNA da casa',
          ]} />

          <Destaque cor="green" icone="💰"
            texto="Reduzir desperdício de 18% para 8% pode economizar R$ 800 ou mais por mês. Vale muito a pena registrar toda semana — mesmo que seja um número aproximado." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            08 — COMPRAS
        ════════════════════════════════════════════════════ */}
        <Secao id="compras" emoji="🛒" titulo="Compras — lista e execução"
          subtitulo="Lista gerada automaticamente pelo cardápio. Descontando o que já tem no estoque.">

          <Destaque cor="green" icone="🎯"
            texto="A lista de compras é calculada automaticamente. Você monta o cardápio, define o número de refeições, e a lista aparece pronta com cada ingrediente na quantidade certa." />

          <p>A aba Compras tem cinco sub-abas:</p>

          <SubAbas abas={[
            { rotulo: 'Lista', desc: 'Itens a comprar' },
            { rotulo: 'Nota Fiscal', desc: 'Leitura por IA' },
            { rotulo: 'Estoque', desc: 'Saldo atual' },
            { rotulo: 'Fornecedores', desc: 'Perfis e histórico' },
            { rotulo: 'Pedido', desc: 'WhatsApp direto' },
          ]} />

          <p>Três status para cada item:</p>

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
              texto="A lista já aparece calculada, descontando o que já está no estoque." />
            <Passo num={2} titulo="Imprima se preferir papel"
              texto="Toque no ícone de impressora. Gera PDF para imprimir ou salvar." />
            <Passo num={3} titulo="Marque conforme compra"
              texto="Toque no item e marque como 'Comprado'. O progresso aparece no Início." />
            <Passo num={4} titulo="No recebimento, marque como recebido"
              texto="Ao receber a entrega, marque e registre o preço real pago — isso alimenta o custo real da semana." />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto="Se o estoque já tem 5 kg de frango e o cardápio precisa de 15 kg, a lista mostra só 10 kg. O desconto é automático." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            09 — NOTA FISCAL
        ════════════════════════════════════════════════════ */}
        <Secao id="nf" emoji="🧾" titulo="Compras › Nota Fiscal com IA" badge="IA"
          subtitulo="Fotografe a nota e a IA extrai itens e preços automaticamente — alimentando a Cotação.">

          <Destaque cor="purple" icone="📸"
            texto="A IA analisa a foto da nota e identifica produto, quantidade e preço — mesmo em notas rasgadas ou com letra pequena. Os preços extraídos entram diretamente no catálogo da Cotação." />

          <div className="space-y-4">
            <Passo num={1} titulo="Compras → Nota Fiscal → Fotografar ou enviar NF"
              texto="Tire uma foto na hora ou escolha uma imagem da galeria. Aceita JPG, PNG e PDF." />
            <Passo num={2} titulo="Aguarde a leitura (5 a 15 segundos)"
              texto="A IA processa a imagem e extrai todos os itens. Uma barra de progresso mostra o andamento." />
            <Passo num={3} titulo="Revise os itens encontrados"
              texto="Itens em amarelo não foram reconhecidos — confira e corrija antes de aplicar." />
            <Passo num={4} titulo='Toque em "Aplicar preços"'
              texto="Os valores entram no catálogo e o custo real da semana é atualizado." />
          </div>

          <Destaque cor="blue" icone="💡"
            texto="Fotografe em ambiente bem iluminado, sem sombras. Notas dobradas: abra antes de fotografar. PDFs têm qualidade melhor que fotos." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            10 — ESTOQUE
        ════════════════════════════════════════════════════ */}
        <Secao id="estoque" emoji="📦" titulo="Compras › Estoque"
          subtitulo="Controle do que está na despensa. Desconta automaticamente da lista de compras.">

          <Lista itens={[
            'Saber o saldo de cada ingrediente sem ir fisicamente à dispensa',
            'Descontar automaticamente da lista o que já tem em casa',
            'Receber alerta quando um item cai abaixo do mínimo definido',
            'Rastrear o consumo de cada ingrediente ao longo das semanas',
          ]} />

          <div className="space-y-4">
            <Passo num={1} titulo="Entrada — chegou mercadoria"
              texto='Compras → Estoque, procure o item, toque em "+" e informe a quantidade.' />
            <Passo num={2} titulo="Baixa automática ao concluir a semana"
              texto="Quando a semana avança para 'Concluído', os ingredientes usados são descontados automaticamente." />
            <Passo num={3} titulo="Definir estoque mínimo"
              texto="Toque no item e defina o mínimo aceitável. Abaixo disso, aparece alerta no Briefing do Início." />
            <Passo num={4} titulo="Inventário físico mensal"
              texto="Uma vez por mês, conte fisicamente e ajuste: Estoque → item → Ajustar saldo." />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            11 — FORNECEDORES E PEDIDOS
        ════════════════════════════════════════════════════ */}
        <Secao id="fornecedores" emoji="🤝" titulo="Compras › Fornecedores e Pedidos"
          subtitulo="Perfis, histórico e envio de pedidos diretamente pelo WhatsApp.">

          <div className="space-y-2">
            <Card titulo="📋 Fornecedores — perfil e histórico"
              desc="Cada fornecedor tem uma página com histórico de preços por item, avaliações de pontualidade e qualidade, e quais produtos ele fornece melhor. WG, Apetito Foods, Vita Frango, Jampac e Frito Sul já vêm pré-cadastrados e são reconhecidos automaticamente."
              cor="blue" />
            <Card titulo="📲 Pedido — WhatsApp automático"
              desc="Selecione quais itens vai pedir para qual fornecedor. O sistema gera o texto do pedido formatado e abre o WhatsApp do fornecedor com a mensagem pronta. Você só confirma o envio."
              cor="green" />
          </div>

          <Destaque cor="yellow" icone="💡"
            texto="Fornecedores reconhecidos automaticamente nas cotações e notas fiscais: WG · Apetito Foods · Vita Frango · Jampac · Frito Sul. Para adicionar outros, vá em Compras → Fornecedores → Adicionar." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            12 — RELATÓRIOS
        ════════════════════════════════════════════════════ */}
        <Secao id="relatorios" emoji="📊" titulo="Relatórios — análise gerencial"
          subtitulo="Visão financeira completa, histórico e auditoria. Acesso exclusivo do Gestor e Administrador.">

          <Destaque cor="yellow" icone="🔒"
            texto="Relatórios é exclusivo do Gestor e Administrador. A equipe de cozinha, compras e recebimento não acessa essa área." />

          <p>Quatro KPIs no topo mostram a semana de relance:</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              ['Custo da semana', 'Total gasto ou cotado'],
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
            <Card titulo="Visão geral" desc="Central gerencial com resumo financeiro completo da semana e histórico acumulado." cor="gray" />
            <Card titulo="Custos" desc="Detalhamento por categoria (proteína, verdura, etc.) e por dia. Custo por prato e ROI da operação." cor="blue" />
            <Card titulo="DNA & Rankings" desc="Perfil alimentar da casa: proteínas mais usadas, campeões de aceitação, pratos a evitar." cor="purple" />
            <Card titulo="Previsão" desc="Projeção de demanda com três cenários — pessimista, esperado e otimista. Aplique diretamente ao cardápio." cor="green" />
            <Card titulo="Fornecedores" desc="Radar de preços: comparativo entre fornecedores, tendências e alertas de variação." cor="gray" />
            <Card titulo="Auditoria" desc="Histórico completo de tudo que foi alterado — quem mudou, o quê e quando. Exclusivo para Administrador." cor="yellow" />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            13 — DNA
        ════════════════════════════════════════════════════ */}
        <Secao id="dna" emoji="🧬" titulo="Relatórios › DNA e Rankings"
          subtitulo="O sistema aprende o perfil do Tatá House e mostra o que funciona e o que não funciona.">

          <div className="space-y-2">
            <Card titulo="🥩 Proteínas mais servidas"
              desc="Ranking de qual proteína domina o cardápio. Ex: Frango 42% · Boi 28% · Peixe 15%. Útil para negociar contratos fixos." cor="blue" />
            <Card titulo="🏆 Pratos campeões"
              desc="Os favoritos da equipe — nota alta, consumo total, pouca sobra. Devem entrar no cardápio com frequência." cor="green" />
            <Card titulo="❌ Pratos a evitar"
              desc="Nota baixa e alto desperdício. O sistema sugere tirar do rodízio ou reformular a receita." cor="red" />
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-2 font-bold text-blue-800">🎯 Objetivo da semana</p>
            <p className="mb-3 text-sm text-blue-700">Escolha um objetivo e o sistema monta um plano de ação concreto:</p>
            <div className="space-y-1.5">
              {[
                ['Reduzir custo', 'Substitutos mais baratos e pratos econômicos'],
                ['Reduzir desperdício', 'Quais pratos produzir menos e quando'],
                ['Melhorar aceitação', 'Favoritos nos dias de maior frequência'],
                ['Equilibrar proteínas', 'Distribuição entre frango, boi, peixe e alternativas'],
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
          subtitulo="O sistema prevê a demanda da semana com base no histórico real.">

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['😟', 'Pessimista', 'Evita desperdício'],
              ['😊', 'Esperado', 'O mais provável'],
              ['😄', 'Otimista', 'Para eventos'],
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
            texto="Quanto mais semanas registradas, mais precisa fica a previsão. O sistema considera sazonalidade, dia da semana e tendências recentes." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            15 — ASSISTENTE
        ════════════════════════════════════════════════════ */}
        <Secao id="assistente" emoji="🤖" titulo="Assistente de IA"
          subtitulo="Responde perguntas sobre gestão com base nos dados reais do Tatá House.">

          <Destaque cor="blue" icone="💬"
            texto="O Assistente analisa os dados reais — não é IA genérica. Ele conhece os pratos, fornecedores e histórico da sua casa. Toque no ícone 💬 no canto inferior direito." />

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
              <div key={p} className="rounded-2xl bg-gray-100 px-3 py-2.5 text-sm text-gray-700">"{p}"</div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-1 font-bold text-gray-800">Badge vermelho no botão do Assistente</p>
            <p className="text-sm text-gray-600">
              Significa que algo crítico foi detectado proativamente — preço fora do normal, estoque crítico,
              prato com nota baixa ou orçamento em risco. Toque para ver o alerta com sugestão de ação.
            </p>
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            16 — FLUXO
        ════════════════════════════════════════════════════ */}
        <Secao id="fluxo" emoji="🔄" titulo="Etapas da semana — o Fluxo"
          subtitulo="Cada semana passa por 5 etapas. Cada equipe cuida da sua parte.">

          <div className="space-y-3">
            {[
              { num: '1', nome: 'Rascunho', quem: 'Gestor', cor: 'bg-gray-200 text-gray-700', desc: 'O gestor monta o cardápio. Tudo pode ser alterado. A lista de compras ainda não é final.' },
              { num: '2', nome: 'Cozinha', quem: 'Cozinha', cor: 'bg-orange-100 text-orange-700', desc: 'A cozinha revisou o cardápio e aprovou. Avança confirmando pela sub-aba Operação.' },
              { num: '3', nome: 'Compras', quem: 'Compras', cor: 'bg-blue-100 text-blue-700', desc: 'A lista está finalizada. O responsável está comprando. Avança ao marcar todos os itens.' },
              { num: '4', nome: 'Recebimento', quem: 'Recebimento', cor: 'bg-purple-100 text-purple-700', desc: 'As compras chegaram. Cada item é conferido e o preço real registrado.' },
              { num: '5', nome: 'Concluído', quem: 'Gestor', cor: 'bg-green-100 text-green-700', desc: 'Semana encerrada. Custo real calculado, estoque atualizado, dados disponíveis nos relatórios.' },
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
          subtitulo="Cadastre funcionários com restrições alimentares e configure os PINs de acesso.">

          <div className="space-y-4">
            <Passo num={1} titulo="Ajustes → Equipe e restrições alimentares"
              texto="Cadastre nome, cargo e qualquer restrição (lactose, glúten, vegetariano, etc.)." />
            <Passo num={2} titulo="O sistema monitora o cardápio"
              texto="Se um prato do cardápio contém ingrediente que algum funcionário não pode comer, aparece alerta." />
            <Passo num={3} titulo="Configurações de acesso"
              texto="Apenas Gestor e Administrador acessam. Aqui são definidos os PINs de cada cargo." />
          </div>
        </Secao>

        {/* ═══════════════════════════════════════════════════
            18 — PAPÉIS
        ════════════════════════════════════════════════════ */}
        <Secao id="papeis" emoji="🎭" titulo="Quem pode fazer o quê"
          subtitulo="Cada cargo tem acesso exatamente ao que precisa para seu trabalho.">

          <TabelaPapeis />

          <Destaque cor="yellow" icone="🔑"
            texto="Para trocar de cargo, vá em Ajustes → Configurações de acesso e informe o PIN. Peça ao gestor se não souber o seu." />
        </Secao>

        {/* ═══════════════════════════════════════════════════
            19 — FAQ
        ════════════════════════════════════════════════════ */}
        <Secao id="faq" emoji="❓" titulo="Perguntas frequentes"
          subtitulo="As dúvidas mais comuns — e as respostas diretas.">

          <div className="space-y-4">
            {[
              {
                p: 'Apaguei algo sem querer. Perdi os dados?',
                r: 'Não. O sistema salva automaticamente. Relatórios → Auditoria mostra o histórico completo de mudanças.',
              },
              {
                p: 'A lista de compras está com quantidade errada.',
                r: 'Verifique se: (1) todos os dias têm prato preenchido, (2) o número de refeições está correto, (3) o estoque está atualizado. A lista vem dessas três informações.',
              },
              {
                p: 'O custo da semana está zerado.',
                r: 'O custo só aparece depois que os preços são lançados na Cotação, dentro do Cardápio. Lance os preços e o custo aparece em tempo real.',
              },
              {
                p: 'A IA não encontrou os fornecedores corretos na cotação.',
                r: 'Verifique se o fornecedor está cadastrado em Compras → Fornecedores. WG, Apetito, Vita Frango, Jampac e Frito Sul são reconhecidos automaticamente. Para outros, cadastre uma vez.',
              },
              {
                p: 'Como imprimir a lista de compras?',
                r: 'Compras → Lista de compras → ícone de impressora. Gera PDF para imprimir ou salvar.',
              },
              {
                p: 'Posso ver semanas anteriores?',
                r: 'Sim. Toque na data no topo para abrir o seletor de semanas e navegue por qualquer semana já registrada.',
              },
              {
                p: 'O sistema ficou lento ou travou.',
                r: 'Feche e abra o navegador. Todos os dados ficam salvos — você não perde nada. Se continuar lento, verifique a internet.',
              },
              {
                p: 'A leitura da nota fiscal não reconheceu alguns itens.',
                r: 'Itens em amarelo não foram reconhecidos — corrija manualmente antes de aplicar. Com o tempo o sistema aprende os itens mais comuns.',
              },
              {
                p: 'O contador de refeições está mostrando dados antigos?',
                r: 'Os dados históricos vêm pré-carregados (set/2024 a jun/2026). Novos registros que você fizer ficam no topo. Os dados antigos são a base de comparação.',
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2e1a] via-[#1a5c3a] to-[#0a2e1a] p-8 text-center text-white shadow-xl">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-tata.png" alt="Tatá House" className="h-10 w-10 object-contain brightness-0 invert" />
            </div>
            <p className="font-display text-2xl font-bold">Tatá House</p>
            <p className="mt-1 text-green-200">Sistema de Gestão — versão 2026</p>
            <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-green-200">
              <span>32.837+ refeições registradas</span>
              <span className="opacity-40">·</span>
              <span>1.400+ amostras históricas</span>
              <span className="opacity-40">·</span>
              <span>3 anos de dados</span>
            </div>
            <p className="mt-5 text-sm text-green-300/70">
              Dúvidas? Fale com o gestor responsável.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
