# Camada Supabase — TATÁ HOUSE

Esta pasta prepara a migração do protótipo (localStorage) para o Supabase
**sem acoplar** o resto do app. Enquanto as variáveis de ambiente não forem
definidas, **nada muda**: o app continua funcionando 100% em localStorage e o
build da Vercel não exige o pacote `@supabase/supabase-js`.

## Como está montado

| Arquivo | Papel |
|---|---|
| `config.ts` | Lê env vars e diz se o Supabase está ligado (`supabaseHabilitado()`). |
| `client.ts` | Cria o cliente **sob demanda**, importando o pacote só em runtime. |
| `armazenamento.ts` | Abstração `ler/gravar/remover/listarChaves` com 2 implementações: `local` e `supabase` (tabela KV `tata_estado`). |
| `sync.ts` | `enviarTudo()` / `baixarTudo()` e o hook `useSincronizacao()`. |
| `schema.sql` | DDL para rodar no Supabase (KV + tabelas relacionais de referência). |
| `migracoes/` | Ajustes idempotentes para bancos já criados (Realtime, RLS). |
| `index.ts` | Ponto único de import. |

## Migrações (rodar no SQL Editor de um banco já existente)

| Arquivo | Para quê |
|---|---|
| `migracoes/2026-realtime-sync.sql` | Publica `tata_estado` no Realtime → sincronização **ao vivo** entre aparelhos. |
| `migracoes/2026-seguranca-rls.sql` | Endurece o RLS: escopa `tata_estado` ao espaço e tranca as tabelas de referência (só `authenticated`). |

A KV `tata_estado` espelha **exatamente** as chaves do localStorage
(`cardapio.v1.*`), então a primeira migração é fiel e de baixo risco.

## Passo a passo para ligar

1. **Instale a dependência** (gera/atualiza o `package-lock.json` — faça isso
   localmente e faça commit do lockfile junto):

   ```bash
   npm install @supabase/supabase-js
   ```

2. **Crie o projeto** no Supabase e rode `schema.sql` no SQL Editor.

3. **Defina as variáveis de ambiente** (`.env.local` e na Vercel):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_TATA_ESPACO=tata-house   # opcional (separa por unidade)
   ```

4. **Pronto.** Com as variáveis presentes, `supabaseHabilitado()` passa a ser
   `true` e `armazenamentoAtivo()` aponta para o Supabase. Para sincronizar o
   que já existe no dispositivo, use o hook:

   ```tsx
   const { disponivel, enviar, baixar, sincronizando } = useSincronizacao();
   // disponivel === false enquanto as env vars não estiverem definidas
   ```

## Próximo passo (quando quiser ir além do KV)

`schema.sql` já traz as tabelas relacionais (`semanas`, `precos`,
`estimativas`, `historico_precos`, `estoque`, `aceitacao`, `eventos`,
`desperdicio`, `auditoria`, e o bloco multi-unidade). A evolução natural é
trocar, hook a hook em `estado.tsx`, as chamadas `lerLocal/gravarLocal` por
`armazenamentoAtivo().ler/gravar` e, depois, mapear para as tabelas
normalizadas.

## ⚠️ Segurança

O site é público e a **chave anônima** fica embutida nele — qualquer visitante
consegue extraí-la. Por isso:

- **`tata_estado`** (onde o app grava): fica acessível pela chave anônima
  (a sincronização depende disso), mas **escopada ao espaço `tata-house`**.
- **Tabelas de referência** (`usuarios`, `semanas`, `precos`, …): o app não as
  usa, então ficam **trancadas para a chave anônima** — só um usuário
  `authenticated` acessa (`migracoes/2026-seguranca-rls.sql`).

**Limite honesto:** enquanto não houver autenticação Supabase de verdade, quem
tiver a URL do site consegue ler/gravar o `tata_estado`. Para restringir de fato
ao time, é preciso adicionar login (e-mail/senha ou magic link) e habilitar a
seção **OPCIONAL** do `2026-seguranca-rls.sql` (exige `authenticated` também no
`tata_estado`).
