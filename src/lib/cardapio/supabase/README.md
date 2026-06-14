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
| `index.ts` | Ponto único de import. |

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

As políticas RLS do `schema.sql` são **permissivas** (acesso anônimo amplo)
só para destravar o protótipo. **Antes de produção**, restrinja por
`auth.uid()` / espaço e remova a escrita anônima.
