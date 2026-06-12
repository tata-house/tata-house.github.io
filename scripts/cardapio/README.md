# Banco de dados do Cardápio da equipe

O arquivo `src/lib/cardapio/dados.json` é gerado a partir das planilhas
históricas de pedidos (Tata House):

- `Planilha_Tata_House_Pedido_2025.xlsx` — 47 semanas brutas (3 layouts)
- `TATA_House_<Mês>_<Ano>.xlsx` — meses no modelo novo (abas BASE_*/Semana N)

## Como atualizar com um mês novo

1. Coloque as planilhas em uma pasta local.
2. Ajuste os caminhos no topo de `consolidar.py`.
3. Rode: `python3 consolidar.py`

O script normaliza nomes (acentos/maiúsculas/espaços), agrega duplicatas e
regrava o `dados.json` consumido pelo app em `/cardapio`.
