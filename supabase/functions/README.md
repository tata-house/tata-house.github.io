# Edge Functions — Tatá House

## `llm` — proxy seguro de IA

Mantém as chaves dos provedores de IA (Gemini/Groq) **no servidor**, fora do
bundle do navegador. Sem isso, qualquer chave `NEXT_PUBLIC_*` embutida no app
estático fica visível para quem abrir o DevTools.

### Deploy

```bash
# 1) Publica a função (sem exigir JWT — o app é estático e usa a anon key)
supabase functions deploy llm --no-verify-jwt

# 2) Guarda as chaves como SECRET do servidor (nunca no GitHub do site)
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set GROQ_API_KEY=gsk_...   # opcional (cotação)
```

### Ativar no site

No build do GitHub Pages, defina:

```
NEXT_PUBLIC_IA_EDGE=1
```

e **remova** os secrets `NEXT_PUBLIC_GEMINI_API_KEY` / `NEXT_PUBLIC_GROQ_KEY`
do repositório. O client passa a chamar `…/functions/v1/llm` com a anon key
(que é pública por design) e nunca vê a chave do provedor.

Enquanto `NEXT_PUBLIC_IA_EDGE` não estiver setado, o app continua funcionando
no modo direto (com as chaves no client) ou offline (regras locais).

## Próximo nível: autenticação real

Os PINs hoje são um portão simples (hash no cliente). Para auth de verdade,
migrar para **Supabase Auth + RLS** nas tabelas (`tata_estado`), validando o
papel no servidor. A camada de dados já está isolada em `src/lib/cardapio/supabase`.
