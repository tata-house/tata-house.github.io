/* =====================================================================
   Manual do Sistema — Tatá House
   Página estática de documentação para funcionários.
   ===================================================================== */

export const metadata = {
  title: 'Manual do Sistema — Tatá House',
  description: 'Guia completo do sistema de gestão do cardápio Tatá House.',
};

/* ---- componentes de layout ---------------------------------------- */

function Capa() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a5c3a] via-[#246b45] to-[#1a5c3a] px-8 py-12 text-center shadow-xl">
      <div className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 text-5xl shadow-lg">
          🍱
        </div>
        <h1 className="font-display text-3xl font-bold text-white drop-shadow">
          Manual do Sistema
        </h1>
        <p className="mt-2 text-lg font-semibold text-green-200">Tatá House — Gestão de Cardápio</p>
        <div className="mt-6 inline-block rounded-full bg-white/15 px-5 py-2 text-sm text-green-100">
          📖 Guia completo para todos os funcionários
        </div>
      </div>
    </div>
  );
}

function Indice() {
  const itens = [
    { num: '01', nome: 'Como entrar no sistema', ancora: 'acesso' },
    { num: '02', nome: 'Painel — a tela principal', ancora: 'painel' },
    { num: '03', nome: 'Cardápio — montar a semana', ancora: 'cardapio' },
    { num: '04', nome: 'Cotação — lançar preços', ancora: 'cotacao' },
    { num: '05', nome: 'Compras — a lista do mercado', ancora: 'compras' },
    { num: '06', nome: 'Estoque — o que temos guardado', ancora: 'estoque' },
    { num: '07', nome: 'Fluxo — etapas da semana', ancora: 'fluxo' },
    { num: '08', nome: 'Feedback — avaliação do prato', ancora: 'feedback' },
    { num: '09', nome: 'Desperdício — o que sobrou', ancora: 'desperdicio' },
    { num: '10', nome: 'Radar de Preços — alertas de custo', ancora: 'radar' },
    { num: '11', nome: 'Relatórios — análise e histórico', ancora: 'gerencial' },
    { num: '12', nome: 'Inteligência — sugestões do sistema', ancora: 'inteligencia' },
    { num: '13', nome: 'Assistente — o robô tira dúvidas', ancora: 'assistente' },
    { num: '14', nome: 'Quem pode fazer o quê', ancora: 'papeis' },
    { num: '15', nome: 'Perguntas frequentes', ancora: 'faq' },
  ];
  return (
    <section id="indice" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h2 className="mb-4 font-display text-xl font-bold text-gray-800">📋 O que tem neste manual</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {itens.map((it) => (
          <a
            key={it.ancora}
            href={`#${it.ancora}`}
            className="flex items-center gap-3 rounded-2xl px-4 py-2.5 transition hover:bg-green-50 active:bg-green-100"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c3a] text-xs font-bold text-white">
              {it.num}
            </span>
            <span className="text-sm font-medium text-gray-700">{it.nome}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---- blocos reutilizáveis ----------------------------------------- */

function Secao({ id, emoji, titulo, subtitulo, children }: {
  id: string; emoji: string; titulo: string; subtitulo?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a5c3a]/10 text-2xl">{emoji}</span>
        <div>
          <h2 className="font-display text-xl font-bold text-gray-800">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 text-sm text-gray-500">{subtitulo}</p>}
        </div>
      </div>
      <div className="space-y-4 text-subtitulo leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

function Destaque({ icone, texto, cor = 'green' }: { icone: string; texto: string; cor?: 'green' | 'yellow' | 'red' | 'blue' }) {
  const cores = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${cores[cor]}`}>
      <span className="text-xl leading-none">{icone}</span>
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
          <span className="mt-0.5 text-[#1a5c3a]">✓</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function PapelTag({ papel, cor }: { papel: string; cor: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white ${cor}`}>
      {papel}
    </span>
  );
}

function TabelaPapeis() {
  const linhas = [
    {
      papel: 'Gestor', cor: 'bg-[#1a5c3a]',
      pode: ['Montar o cardápio', 'Ver todos os relatórios', 'Aprovar todas as etapas', 'Configurar o sistema', 'Ver o painel de inteligência'],
    },
    {
      papel: 'Cozinha', cor: 'bg-orange-500',
      pode: ['Ver o cardápio da semana', 'Avançar a etapa "Cozinha"', 'Registrar desperdício', 'Adicionar observações'],
    },
    {
      papel: 'Compras', cor: 'bg-blue-600',
      pode: ['Ver e imprimir a lista de compras', 'Marcar itens como comprados', 'Registrar preços pagos', 'Avançar a etapa "Compras"'],
    },
    {
      papel: 'Recebimento', cor: 'bg-purple-600',
      pode: ['Marcar itens como recebidos', 'Fotografar nota fiscal', 'Avançar a etapa "Recebimento"'],
    },
    {
      papel: 'Administrador', cor: 'bg-gray-700',
      pode: ['Tudo que o Gestor faz', 'Exportar auditoria completa', 'Gerenciar usuários'],
    },
  ];
  return (
    <div className="space-y-4">
      {linhas.map((l) => (
        <div key={l.papel} className="rounded-2xl bg-gray-50 p-4">
          <PapelTag papel={l.papel} cor={l.cor} />
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

/* ---- conteúdo do manual ------------------------------------------- */

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">

        <Capa />
        <Indice />

        {/* -------------------------------------------------------- */}
        <Secao id="acesso" emoji="🔑" titulo="Como entrar no sistema"
          subtitulo="Primeiro passo — acessar o site no celular ou computador">

          <Destaque icone="📱" cor="green"
            texto="O sistema funciona direto no navegador do celular ou computador. Não precisa instalar nada!" />

          <p>Siga estes passos para entrar:</p>

          <div className="space-y-4">
            <Passo num={1} titulo='Abra o navegador do seu celular (Chrome ou Safari)'
              texto='O botão do navegador parece uma bola colorida no celular ou um "e" azul no computador.' />
            <Passo num={2} titulo='Digite o endereço do site na barra de cima'
              texto='O endereço é fornecido pelo gestor. Geralmente termina com ".vercel.app".' />
            <Passo num={3} titulo='Escolha o seu cargo'
              texto='Na tela inicial, clique no seu cargo: Gestor, Cozinha, Compras, Recebimento ou Administrador.' />
            <Passo num={4} titulo='Pronto! Você está dentro do sistema'
              texto='O sistema vai lembrar do seu cargo mesmo se você fechar o celular.' />
          </div>

          <Destaque icone="💡" cor="yellow"
            texto="Dica: Para abrir rápido, adicione o site na tela inicial do seu celular. Assim fica como um ícone, igual a um aplicativo!" />

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-semibold text-gray-800">Como mudar de cargo:</p>
            <p className="text-sm text-gray-600">Vá em <strong>Gerencial → Configurações</strong> e toque no cargo atual para mudar.</p>
          </div>
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="painel" emoji="🏠" titulo="Painel — a tela principal"
          subtitulo="É aqui que você começa. O painel mostra um resumo de tudo.">

          <Destaque icone="👋" cor="green"
            texto='Todo dia ao abrir o sistema, aparece o card "Bom dia, gestor" com os alertas mais importantes do dia. Comece sempre por aí!' />

          <p>O Painel tem 4 partes principais:</p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 font-bold text-gray-800">🗓️ Briefing do dia</p>
              <p className="text-sm text-gray-600">
                Aparece no topo com os alertas urgentes (vermelho), de atenção (amarelo) e informativos (azul).
                Se tudo estiver bem, aparece um ✅ verde.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 font-bold text-gray-800">📈 Indicadores da semana</p>
              <p className="text-sm text-gray-600">
                Mostra: quantas refeições foram feitas, custo por prato, quanto falta comprar, e o orçamento da semana.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 font-bold text-gray-800">📊 Previsão de consumo</p>
              <p className="text-sm text-gray-600">
                O sistema prevê quantas pessoas vão almoçar em cada dia da semana, com base nos meses anteriores.
                Você pode usar essa previsão para calcular a lista de compras automaticamente.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 font-bold text-gray-800">🧠 Inteligência da casa</p>
              <p className="text-sm text-gray-600">
                Mostra o "DNA" da empresa: quais proteínas são mais servidas, pratos favoritos e pratos que sempre sobram.
                Você pode escolher um objetivo e o sistema monta um plano de ação.
              </p>
            </div>
          </div>

          <p>Na parte de baixo do Painel também fica o <strong>Fluxo da semana</strong> — as etapas do cardápio ao recebimento.</p>

          <Destaque icone="💡" cor="blue"
            texto="Dica: Olhe o Painel toda manhã antes de começar o trabalho. Ele avisa se há algum problema antes que ele se torne grande!" />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="cardapio" emoji="📋" titulo="Cardápio — montar a semana"
          subtitulo="Aqui você define o que vai ser servido em cada dia">

          <Destaque icone="👨‍🍳" cor="green"
            texto="Quem monta o cardápio é o Gestor. A equipe de Cozinha pode ver o cardápio, mas não muda nada." />

          <p>Para montar o cardápio da semana:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Escolha a semana"
              texto='No topo da tela, use as setas ← → para navegar entre as semanas. A semana atual aparece em destaque.' />
            <Passo num={2} titulo="Clique em cada dia"
              texto='Toque no dia (Segunda, Terça...) e escolha o prato principal. Você pode digitar o nome ou escolher da lista.' />
            <Passo num={3} titulo="Preencha os acompanhamentos"
              texto='Guarnição, salada e sobremesa. O Arroz e Feijão já vem preenchido automaticamente.' />
            <Passo num={4} titulo="Ajuste o número de pessoas"
              texto='Cada dia tem um campo com o número de refeições. O sistema já sugere com base no histórico.' />
            <Passo num={5} titulo="Salve o cardápio"
              texto='O sistema salva automaticamente a cada mudança. Não precisa clicar em "salvar".' />
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-800">Recursos extras do Cardápio:</p>
            <Lista itens={[
              'Sugestão automática do Chef IA — o sistema sugere pratos baseado no histórico e no custo',
              'Anti-monotonia — avisa se a mesma proteína foi servida demais na semana',
              'Indicador nutricional — mostra se o cardápio está equilibrado (proteína, carboidrato, verdura)',
              'Custo estimado — aparece o valor por pessoa assim que os preços estiverem lançados',
              'Receitas — ao clicar no prato, mostra os ingredientes e quantidades necessárias',
            ]} />
          </div>

          <Destaque icone="⚠️" cor="yellow"
            texto='Se um prato aparecer com um ponto de exclamação (❗) é porque o preço não foi lançado ainda. Isso impede o cálculo correto da lista de compras.' />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="cotacao" emoji="💰" titulo="Cotação — lançar os preços"
          subtitulo="Aqui entram os preços que os fornecedores mandaram">

          <Destaque icone="📲" cor="blue"
            texto="Você pode colar diretamente o texto que o fornecedor mandou no WhatsApp! O sistema lê e já identifica os itens e preços automaticamente." />

          <p>Formas de lançar preços:</p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-1 font-bold text-blue-800">📋 Colar texto do WhatsApp</p>
              <p className="text-sm text-blue-700">
                Copie a mensagem do fornecedor com os preços, cole na caixa de texto e clique em "Analisar".
                O sistema lê e já preenche tudo automaticamente.
              </p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="mb-1 font-bold text-green-800">📁 Arquivo CSV ou Excel</p>
              <p className="text-sm text-green-700">
                Se o fornecedor mandar um arquivo de planilha, você pode importar direto.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 font-bold text-gray-800">✏️ Digitar manualmente</p>
              <p className="text-sm text-gray-600">
                Pesquise o item pelo nome, digit o preço e clique em "Salvar".
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Passo num={1} titulo="Lance os preços dos fornecedores"
              texto="Use qualquer método acima para registrar o preço de cada item." />
            <Passo num={2} titulo="Compare fornecedores"
              texto='Se você lançou preços de mais de um fornecedor, o sistema marca automaticamente o mais barato de cada item com "🏆".' />
            <Passo num={3} titulo='Clique em "Aplicar todos os preços"'
              texto="Isso atualiza o custo estimado da semana inteira de uma vez." />
          </div>

          <Destaque icone="💡" cor="green"
            texto="O Radar de Preços guarda o histórico. Se um item subiu muito de preço, o sistema avisa com um alerta vermelho." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="compras" emoji="🛒" titulo="Compras — a lista do mercado"
          subtitulo="O sistema calcula automaticamente o que precisa comprar">

          <Destaque icone="✨" cor="green"
            texto="A lista de compras é gerada automaticamente! O sistema calcula a quantidade de cada ingrediente baseado no cardápio e no número de pessoas." />

          <p>A lista tem três etapas para cada item:</p>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { emoji: '🛒', nome: 'A comprar', cor: 'bg-gray-100 text-gray-700' },
              { emoji: '🚚', nome: 'A caminho', cor: 'bg-yellow-50 text-yellow-800' },
              { emoji: '✅', nome: 'Recebido', cor: 'bg-green-50 text-green-800' },
            ].map((e) => (
              <div key={e.nome} className={`rounded-2xl p-3 ${e.cor}`}>
                <div className="text-2xl">{e.emoji}</div>
                <div className="mt-1 text-xs font-bold">{e.nome}</div>
              </div>
            ))}
          </div>

          <p>Como usar a lista de compras:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Acesse a aba Compras"
              texto='Ela fica na barra de navegação no rodapé da tela. Toque em "Compras".' />
            <Passo num={2} titulo="Veja a lista gerada"
              texto="Os itens aparecem com quantidade e unidade. Ex: Frango — 15 kg." />
            <Passo num={3} titulo="Ajuste quantidades se precisar"
              texto='Toque em qualquer item para ajustar a quantidade ou remover o item.' />
            <Passo num={4} titulo="Imprima se precisar"
              texto='Toque no botão de impressão para ter a lista no papel para usar no mercado.' />
            <Passo num={5} titulo="Marque como comprado"
              texto='Conforme comprar cada item, deslize para o lado ou toque em "Comprado" para marcar.' />
            <Passo num={6} titulo="No recebimento, marque como recebido"
              texto='Quando a entrega chegar, marque cada item como recebido e registre o preço real pago.' />
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-semibold text-gray-800">📸 Foto da nota fiscal</p>
            <p className="text-sm text-gray-600">
              Na aba Compras você pode fotografar a nota fiscal. O sistema tenta ler os itens e preços automaticamente
              e pode enviar o relatório por e-mail para o setor de compras.
            </p>
          </div>

          <Destaque icone="💡" cor="yellow"
            texto='Se o item já tem estoque guardado, a lista desconta automaticamente! Ex: se tem 5kg de frango no estoque e precisa de 15kg, a lista mostra só 10kg para comprar.' />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="estoque" emoji="📦" titulo="Estoque — o que temos guardado"
          subtitulo="Controle dos ingredientes que estão na despensa">

          <p>O estoque serve para:</p>
          <Lista itens={[
            'Saber o que tem disponível sem precisar ir olhar na despensa',
            'Descontar automaticamente da lista de compras o que já está em casa',
            'Receber um alerta quando algum item está acabando',
          ]} />

          <p>Como movimentar o estoque:</p>

          <div className="space-y-4">
            <Passo num={1} titulo="Entrada (chegou mercadoria)"
              texto='Vá em Estoque, procure o item, toque em "+" e informe a quantidade que chegou.' />
            <Passo num={2} titulo="Baixa automática"
              texto='Quando a semana é concluída, o sistema dá baixa dos ingredientes usados no cardápio automaticamente.' />
            <Passo num={3} titulo="Estoque mínimo"
              texto='Você pode definir uma quantidade mínima para cada item. Quando o saldo cair abaixo, o Painel mostra um alerta 📦.' />
            <Passo num={4} titulo="Inventário físico"
              texto='Uma vez por mês é bom fazer a contagem física e corrigir o saldo se tiver diferença.' />
          </div>

          <Destaque icone="⚠️" cor="yellow"
            texto="Se o estoque mostrar um número errado, não entre em pânico. Ajuste manualmente em Estoque → item → Ajustar saldo." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="fluxo" emoji="🔄" titulo="Fluxo — as etapas da semana"
          subtitulo="O sistema acompanha o progresso de cada semana, do cardápio ao recebimento">

          <p>Cada semana passa por 5 etapas. Só avança quando a etapa está completa:</p>

          <div className="space-y-3">
            {[
              { num: '1', nome: 'Rascunho', desc: 'O gestor está montando o cardápio. Ainda pode mudar tudo.', quem: 'Gestor', cor: 'bg-gray-200 text-gray-700' },
              { num: '2', nome: 'Cozinha', desc: 'A cozinha revisou e aprovou o cardápio. Já sabe o que vai cozinhar.', quem: 'Cozinha', cor: 'bg-orange-100 text-orange-700' },
              { num: '3', nome: 'Compras', desc: 'A lista de compras foi enviada. O responsável está comprando.', quem: 'Compras', cor: 'bg-blue-100 text-blue-700' },
              { num: '4', nome: 'Recebimento', desc: 'As compras chegaram. O responsável está conferindo e registrando.', quem: 'Recebimento', cor: 'bg-purple-100 text-purple-700' },
              { num: '5', nome: 'Concluído', desc: 'Semana encerrada! Tudo comprado e recebido. O sistema aprende com essa semana.', quem: 'Gestor', cor: 'bg-green-100 text-green-700' },
            ].map((e) => (
              <div key={e.num} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${e.cor}`}>
                  {e.num}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-800">{e.nome}</p>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-micro font-semibold text-gray-600">{e.quem}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-semibold text-gray-800">Contagem de refeições no Fluxo</p>
            <p className="text-sm text-gray-600">
              No Fluxo também fica o campo para registrar quantas pessoas almoçaram em cada dia.
              Essa informação é muito importante: ela ensina o sistema a prever melhor para as próximas semanas
              e calcula o custo real por refeição.
            </p>
          </div>

          <Destaque icone="💡" cor="green"
            texto="Sempre registre o número real de refeições no final do dia. Com o tempo, o sistema fica cada vez mais preciso nas previsões." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="feedback" emoji="⭐" titulo="Feedback — a avaliação do prato"
          subtitulo="Como a equipe avalia o almoço de cada dia">

          <Destaque icone="📱" cor="green"
            texto='A avaliação é muito simples! Basta escanear o QR code e tocar em um emoji. Dura menos de 30 segundos.' />

          <p>Existem duas formas de coletar avaliação:</p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 font-bold text-gray-800">📲 QR Code (para os colaboradores)</p>
              <p className="mb-2 text-sm text-gray-600">
                Imprima o QR code na aba Cardápio e cole na parede do refeitório.
                Cada pessoa escaneia com o celular e avalia o prato do dia:
              </p>
              <div className="flex gap-3">
                {[['😋','Ótimo'],['😐','Regular'],['👎','Ruim']].map(([e, r]) => (
                  <div key={r} className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-white p-3 ring-1 ring-gray-200">
                    <span className="text-2xl">{e}</span>
                    <span className="text-caption font-semibold text-gray-600">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-1 font-bold text-gray-800">✋ Avaliação manual (pelo gestor)</p>
              <p className="text-sm text-gray-600">
                O gestor pode registrar a avaliação manualmente na aba Cardápio, anotando a nota e até um comentário.
              </p>
            </div>
          </div>

          <p>O que acontece com as avaliações:</p>
          <Lista itens={[
            'Cada prato acumula votos e ganha uma nota de 1 a 5 estrelas',
            'Pratos com nota baixa aparecem em vermelho no painel de Aceitação',
            'O sistema sugere tirar do cardápio os pratos que a equipe não gosta',
            'Os pratos favoritos aparecem como "campeões" no DNA da casa',
          ]} />

          <Destaque icone="💡" cor="yellow"
            texto="Incentive a equipe a avaliar todo dia! Quanto mais votos, mais o sistema aprende e melhora as sugestões." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="desperdicio" emoji="♻️" titulo="Desperdício — o que sobrou"
          subtitulo="Registrar a sobra ajuda a economizar e a planejar melhor">

          <p>
            O controle de desperdício é simples: você registra quanto foi produzido e quanto foi consumido.
            O sistema calcula o que sobrou e avisa quando um prato desperdiça demais.
          </p>

          <div className="space-y-4">
            <Passo num={1} titulo="Acesse a aba Cardápio"
              texto='Após a semana avançar para "Recebendo" ou "Concluída", a seção de Avaliação aparece no final da aba Cardápio.' />
            <Passo num={2} titulo="Selecione o dia e o prato"
              texto="Escolha o dia e qual prato foi registrado." />
            <Passo num={3} titulo="Informe o produzido e o consumido"
              texto='Exemplo: Produziu 80 porções, consumiu 65. O sistema calcula: 15 sobras = 18% de desperdício.' />
            <Passo num={4} titulo="Adicione o motivo (opcional)"
              texto='Você pode anotar o motivo da sobra: "prato não agradou", "imprevistos", etc.' />
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-semibold text-gray-800">O que o sistema faz com essa informação:</p>
            <Lista itens={[
              'Calcula quanto dinheiro foi perdido com a sobra',
              'Identifica quais pratos desperdiçam mais',
              'Sugere reduzir a produção do prato na próxima vez',
              'Considera o desperdício para sugerir tirar o prato do cardápio',
            ]} />
          </div>

          <Destaque icone="💡" cor="green"
            texto="Reduzir 10% de desperdício por semana pode economizar centenas de reais por mês! Vale muito a pena registrar." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="radar" emoji="📡" titulo="Radar de Preços — alertas de custo"
          subtitulo="O sistema vigia os preços e avisa quando algo muda muito">

          <p>
            O Radar de Preços fica em <strong>Relatórios → Central</strong>, na seção de Preços.
            Ele guarda o histórico de preços de cada item e compara com os preços atuais.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl bg-red-50 p-4">
              <span className="text-xl">🔴</span>
              <div>
                <p className="font-bold text-red-800">Alta anormal</p>
                <p className="text-sm text-red-700">O item subiu mais de 15% desde a última cotação. Verifique com o fornecedor ou busque alternativa.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-blue-50 p-4">
              <span className="text-xl">🔵</span>
              <div>
                <p className="font-bold text-blue-800">Queda anormal</p>
                <p className="text-sm text-blue-700">O item ficou mais barato. Bom momento para comprar mais e guardar em estoque!</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl bg-gray-50 p-4">
              <span className="text-xl">⚪</span>
              <div>
                <p className="font-bold text-gray-800">Estável</p>
                <p className="text-sm text-gray-600">Preço dentro do normal. Nenhuma ação necessária.</p>
              </div>
            </div>
          </div>

          <p>O Radar também mostra:</p>
          <Lista itens={[
            'Qual fornecedor tem o melhor preço de cada item',
            'A tendência do preço: subindo, caindo ou estável',
            'Sugestão de substituição quando uma proteína está cara demais',
          ]} />

          <Destaque icone="💡" cor="blue"
            texto="Se o frango subiu muito, o Radar pode sugerir trocar por outra proteína na semana seguinte e até calcular quanto você economizaria." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="gerencial" emoji="📊" titulo="Relatórios — análise e histórico"
          subtitulo="Visão completa dos dados da empresa">

          <Destaque icone="👤" cor="yellow"
            texto="A aba Relatórios é destinada ao Gestor e Administrador. A equipe de cozinha e compras não acessa essa área." />

          <p>Dentro de Relatórios você encontra três seções:</p>

          <div className="space-y-3">
            {[
              { emoji: '📊', nome: 'Central', desc: 'KPIs financeiros: valor gerado no mês, DNA alimentar da empresa, previsão de refeições, radar de preços e inteligência acumulada.' },
              { emoji: '🔬', nome: 'Cenários', desc: 'Simulador financeiro: ajuste preços, pessoas e desperdício para ver o impacto no custo antes de tomar decisões.' },
              { emoji: '🔍', nome: 'Auditoria', desc: 'Histórico de tudo que foi alterado no sistema: quem mudou, o quê e quando. Disponível apenas para Gerência.' },
            ].map((s) => (
              <div key={s.nome} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                <span className="text-xl">{s.emoji}</span>
                <div>
                  <p className="font-bold text-gray-800">{s.nome}</p>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600">
            Avaliação de pratos (aceitação) e controle de desperdício ficam na aba <strong>Cardápio</strong>, na seção "Avaliação da semana" — ela aparece quando a semana avança para a etapa de Recebimento ou Conclusão.
          </p>
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="inteligencia" emoji="🧠" titulo="Inteligência — sugestões do sistema"
          subtitulo="O sistema aprende com o histórico e ajuda a tomar decisões melhores">

          <p>
            Com o tempo, o sistema aprende o jeito de funcionar da sua empresa.
            Essas informações ficam no card <strong>Inteligência da casa</strong>, no Painel.
          </p>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-green-50 p-4">
              <p className="mb-1 font-bold text-green-800">🧬 DNA alimentar</p>
              <p className="text-sm text-green-700">
                Mostra o perfil da sua empresa: quais proteínas são mais servidas, quais pratos a equipe ama
                e quais pratos sempre sobram. Atualiza automaticamente a cada semana.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-blue-50 p-4">
              <p className="mb-1 font-bold text-blue-800">🎯 Objetivo da semana</p>
              <p className="text-sm text-blue-700">
                Você escolhe um objetivo e o sistema monta um plano de ações concretas:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>💰 <strong>Reduzir custo</strong> — quais itens cortar ou substituir</li>
                <li>♻️ <strong>Reduzir desperdício</strong> — quais pratos produzir menos</li>
                <li>⭐ <strong>Melhorar aceitação</strong> — programar os pratos favoritos</li>
                <li>🥩 <strong>Equilibrar proteínas</strong> — variar mais a proteína da semana</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-purple-50 p-4">
              <p className="mb-1 font-bold text-purple-800">📊 Previsão com intervalos</p>
              <p className="text-sm text-purple-700">
                A previsão de refeições mostra três números: pessimista, esperado e otimista.
                Com um toque em "Usar previsão otimista", a lista de compras já é recalculada
                com essas quantidades.
              </p>
            </div>
          </div>

          <Destaque icone="💡" cor="green"
            texto="Quanto mais semanas de uso, mais inteligente o sistema fica. As previsões e sugestões melhoram automaticamente com o tempo." />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="assistente" emoji="🤖" titulo="Assistente — o robô tira dúvidas"
          subtitulo="Um assistente virtual que responde perguntas sobre a gestão">

          <p>
            No canto inferior direito da tela fica o botão <strong>🤖</strong>.
            Toque nele para abrir o Assistente.
          </p>

          <Destaque icone="✨" cor="blue"
            texto="O Assistente analisa os dados reais da sua empresa e responde perguntas em linguagem simples. Você não precisa entender de planilhas!" />

          <p>Exemplos de perguntas que você pode fazer:</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              'Onde estou gastando mais?',
              'Quais itens subiram de preço?',
              'Quais pratos a equipe mais gosta?',
              'Quais pratos devo evitar?',
              'Como reduzir o custo da semana?',
              'O que está acabando no estoque?',
            ].map((p) => (
              <div key={p} className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700">
                💬 "{p}"
              </div>
            ))}
          </div>

          <p className="mt-2">O Assistente responde com base nos dados reais do sistema — nunca inventa números.</p>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="mb-2 font-semibold text-gray-800">Com IA conectada (opcional):</p>
            <p className="text-sm text-gray-600">
              Se o gestor configurar uma chave de IA (ChatGPT ou Claude), o Assistente fica ainda mais detalhado
              nas respostas. Sem a chave, ele já funciona bem com as regras do sistema.
            </p>
          </div>
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="papeis" emoji="👥" titulo="Quem pode fazer o quê"
          subtitulo="Cada cargo tem acesso ao que precisa para o seu trabalho">

          <TabelaPapeis />

          <Destaque icone="💡" cor="yellow"
            texto="Para mudar de cargo, vá em Gerencial → Configurações e toque no seu cargo atual. Mas atenção: isso muda o que você pode ver e fazer no sistema!" />
        </Secao>

        {/* -------------------------------------------------------- */}
        <Secao id="faq" emoji="❓" titulo="Perguntas frequentes"
          subtitulo="Dúvidas comuns — e as respostas simples">

          <div className="space-y-4">
            {[
              {
                p: 'Apaguei uma informação sem querer. O que faço?',
                r: 'Não se preocupe! O sistema salva tudo automaticamente. Vá em Gerencial → Auditoria para ver o histórico de mudanças e descobrir o que foi alterado.',
              },
              {
                p: 'A lista de compras está errada. Por quê?',
                r: 'A lista depende do cardápio estar completo e dos preços estarem lançados. Confira se todos os dias da semana têm prato, guarnição e salada. Depois verifique se os preços foram lançados em Compras → Preços ou em Ajustes → Catálogo de preços.',
              },
              {
                p: 'O sistema ficou lento. O que faço?',
                r: 'Feche e abra o navegador de novo. O sistema salva tudo, então você não perde nada. Se ainda estiver lento, verifique a sua conexão com a internet.',
              },
              {
                p: 'Posso usar em mais de um celular ao mesmo tempo?',
                r: 'Sim! Cada celular salva os dados localmente. Para que todos vejam os mesmos dados em tempo real, seria necessário ativar a sincronização em nuvem (fale com o gestor).',
              },
              {
                p: 'Como imprimir a lista de compras?',
                r: 'Na aba Compras, toque no ícone de impressora 🖨️ no canto superior. Você pode imprimir ou salvar como PDF.',
              },
              {
                p: 'O que significa o badge (bolinha vermelha) no botão do Assistente?',
                r: 'Significa que o Assistente identificou algo importante: um preço alto, estoque baixo ou prato com baixa aceitação. Toque no 🤖 para ver o alerta.',
              },
              {
                p: 'Posso ver semanas anteriores?',
                r: 'Sim! Use as setas ← → no topo da tela para navegar entre as semanas. Você consegue ver o cardápio, custos e compras de qualquer semana já registrada.',
              },
              {
                p: 'O que é o "orçamento da semana"?',
                r: 'É um valor máximo de custo que você define para a semana. Se o custo estimado ultrapassar esse valor, o sistema avisa com um alerta amarelo ou vermelho no Painel.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-gray-50 p-4">
                <p className="mb-2 font-bold text-gray-800">❓ {item.p}</p>
                <p className="text-sm text-gray-600">✅ {item.r}</p>
              </div>
            ))}
          </div>
        </Secao>

        {/* rodapé */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1a5c3a] to-[#246b45] p-6 text-center text-white">
          <div className="mb-2 text-3xl">🍱</div>
          <p className="font-display text-lg font-bold">Tatá House</p>
          <p className="mt-1 text-sm text-green-200">Sistema de Gestão de Cardápio</p>
          <p className="mt-3 text-rotulo text-green-300">
            Dúvidas? Fale com o gestor responsável da sua unidade.
          </p>
        </div>

      </div>
    </div>
  );
}
