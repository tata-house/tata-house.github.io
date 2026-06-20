# Tatá Sushi — Cardápios da Equipe

App independente para o planejamento da refeição dos funcionários:

- **🍽️ Cardápio** — montagem da semana com sugestão automática (histórico de 405 dias,
  370 combinações reais) respeitando as regras de rotação de proteínas:
  suína ≤ 2×/semana, frango 3–4×, sem proteína repetida em dias seguidos.
- **🛒 Compras** — lista gerada automaticamente, com quantidades escaladas pelo
  movimento de cada dia (Seg/Ter 55 · Qua/Qui 65 · Sex–Dom 80, configurável).
- **🚦 Acompanhar** — fluxo de aprovação por setor: Gestor → Cozinha → Compras → Recebimento.
- **💰 Preços** — tabela de preços por item para estimar o custo do cardápio vs. orçamento.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar na Vercel

Importe este repositório na Vercel como um projeto novo (framework: Next.js,
sem variáveis de ambiente). O app não tem login — os dados ficam no
navegador (localStorage) nesta fase de protótipo.

## Atualizar o banco de dados do histórico

Os dados ficam em `src/lib/cardapio/dados.json`. Quando um novo mês fechar,
coloque as planilhas em uma pasta e rode:

```bash
python3 scripts/cardapio/consolidar.py
```

Veja `scripts/cardapio/README.md` para detalhes. 
