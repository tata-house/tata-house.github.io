# 🍣 TATÁ Sushi — Operação Dia dos Namorados

Painel **operacional** (PWA) para a noite do Dia dos Namorados: a recepção opera o
**mapa de mesas** real do restaurante arrastando os casais para as mesas, e o **caixa**
aplica o crédito de **R$ 100 via Pix** e fecha as contas liberando as mesas.

Tudo atualiza **em tempo real** entre os tablets/celulares da equipe.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **@dnd-kit/core** — arrastar e soltar compatível com toque (tablet)
- **Supabase**: Postgres, Auth e Realtime
- **PWA** instalável (manifest + service worker)
- Deploy na **Vercel**

## Regras de negócio

1. Três turnos: **19h**, **21h** e **22h**.
2. Cada reserva = **2 pessoas** (casal). Passantes podem ter outro nº de pessoas.
3. Uma mesa **não pode** ter dois casais ativos no mesmo turno (constraint única no banco).
4. Um casal nunca fica em duas mesas (a reserva tem uma única mesa).
5. A mesma mesa pode ser reutilizada em outro turno após liberada.
6. Passantes **não têm** crédito de reserva (Pix R$ 0).
7. Reserva com Pix **pago** tem crédito de **R$ 100**, aplicado **uma única vez** (função atômica no banco).
8. Fechar conta no caixa **libera a mesa automaticamente** (fica cinza alguns segundos no mapa e volta a verde).
9. Toda movimentação de mesa fica em **histórico** (`reservation_events`, gravado por trigger no banco).
10. **Login único compartilhado** pela equipe — sem perfis ou permissões.

## Como a equipe usa

### Recepção / hostess (tela principal: **Mapa**)
- Vê a planta real do restaurante (salão + varanda) com as mesas coloridas:
  🟩 Livre · 🟦 Reservada · 🟧 Chegou · 🟥 Sentado · ⬜ Liberada (volta a livre) · ⬛ Bloqueada
- Lista lateral com os casais por turno (19h / 21h / 22h) e busca por nome.
- **Arrasta** o casal da lista para a mesa, ou de uma mesa para outra mesa livre
  (no tablet: segure o casal ~0,5s e arraste).
- Soltar em mesa ocupada é bloqueado: “Mesa já ocupada. Libere a mesa ou escolha outra.”
- Toque na mesa abre as ações rápidas: Chegou · Sentar · Confirmar Pix · Fechar conta · No-show · Cancelar.
- Botões **+ Casal** e **+ Passante** para encaixes do dia.
- Filtro **⚡ Agora** mostra o estado atual da operação; as abas de turno servem para
  preparar o próximo turno (ex.: mesa liberada do 19h recebe casal do 21h).

### Caixa (tela **Caixa**)
- Lista só as mesas com gente (sentados/chegaram).
- **Aplicar crédito R$ 100** (só Pix pago, só uma vez — o banco garante).
- **Fechar conta e liberar mesa**: valor da conta é opcional; o crédito é descontado;
  a mesa volta a livre no mapa da recepção na hora.

---

## 1. Instalação local

```bash
npm install
cp .env.example .env.local   # preencha com URL e anon key do Supabase
npm run dev
```

Abra http://localhost:3000.

## 2. Configuração do Supabase

### Projeto novo (do zero)

1. Crie um projeto em https://supabase.com (região São Paulo recomendada).
2. No **SQL Editor**, execute na ordem:
   - [`supabase/schema.sql`](supabase/schema.sql) — tabelas, constraints, triggers, funções e RLS;
   - [`supabase/seed.sql`](supabase/seed.sql) — mesas (posições do mapa de chão) e as reservas oficiais da planilha.
3. Em **Authentication → Users → Add user**, crie **um único usuário** para a equipe
   (ex.: `equipe@tatasushi.com.br`, marque *Auto Confirm User*).
4. Copie **Project Settings → API → URL** e **anon public key** para o `.env.local`
   (e depois para a Vercel).

### Projeto já existente (migração)

No **SQL Editor**, execute **em duas etapas separadas** (aguarde o sucesso da primeira):

1. [`supabase/migracao-passo-1.sql`](supabase/migracao-passo-1.sql) — adiciona o turno 22h;
2. [`supabase/migracao-passo-2.sql`](supabase/migracao-passo-2.sql) — reposiciona as mesas no
   mapa de chão único, faz o caixa liberar a mesa ao fechar a conta e substitui as
   reservas pela planilha oficial (13 às 19h, 12 às 21h, 1 às 22h).

> O Realtime já fica habilitado pelo `schema.sql` (`alter publication supabase_realtime ...`).

## 3. Deploy na Vercel

1. Importe o repositório em https://vercel.com → **Add New Project**.
2. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Cada push na `main` redeploya sozinho.

### Instalar no tablet/celular (PWA)

- **Android/Chrome**: abra a URL → menu ⋮ → **Adicionar à tela inicial**.
- **iPhone/iPad (Safari)**: botão compartilhar → **Adicionar à Tela de Início**.

## 4. Telas

| Rota          | Função |
|---------------|--------|
| `/login`      | Login único da equipe (Supabase Auth) |
| `/mapa`       | **Tela principal** — planta do restaurante + lista de casais + arrastar e soltar |
| `/caixa`      | Aplicar crédito e fechar conta liberando a mesa |

Rotas de apoio (fora do menu, ainda acessíveis pela URL): `/dashboard`, `/checkin`,
`/reservas`, `/passantes`, `/relatorios`.

### Mesas cadastradas

- **Salão (reserváveis)**: 1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 15, 17, 19, 20, 21, 24
- **Apoio/balcão (bloqueadas por padrão)**: 41–45 (bar) e 51–55 (barra fria) — para ativar:
  `update public.tables set ativa = true where numero = '41';`
- **Varanda**: 60, 62, 64, 65, 66 + extras **V1** e **V2**

## 5. PWA e modo offline

- O app abre offline (cache do shell), mas os **dados exigem conexão**.
- Quando offline, uma faixa vermelha avisa e **todas as alterações são bloqueadas**
  para evitar conflito de mesas entre dispositivos.
- Ao voltar a conexão, os dados recarregam automaticamente.

## 6. Checklist de teste antes do evento

**Banco e acesso**
- [ ] Migração (passo 1 e passo 2) executada sem erro no Supabase
- [ ] Login único da equipe funciona
- [ ] Variáveis configuradas na Vercel e deploy OK

**Operação (ensaio geral)**
- [ ] Mapa mostra as 26 reservas da planilha nas mesas certas (abas 19h / 21h / 22h)
- [ ] Arrastar casal da lista para mesa livre → mesa fica azul
- [ ] Arrastar casal da mesa 2 para a mesa 6 → mesa 2 libera sozinha, histórico registrado
- [ ] Soltar casal em mesa ocupada → bloqueado com aviso
- [ ] Chegou (laranja) → Sentar (vermelho)
- [ ] Caixa: aplicar crédito em Pix pago → funciona **uma vez**; segunda vez é bloqueada
- [ ] Caixa: passante ou Pix pendente → crédito bloqueado
- [ ] Fechar conta e liberar mesa → mesa fica cinza alguns segundos e volta a verde
- [ ] Mesa liberada recebe casal do próximo turno (aba 21h → arrastar)
- [ ] Passante: criar pelo “+ Passante” → nunca mostra crédito

**Tempo real e dispositivos**
- [ ] Mapa aberto no tablet + caixa no celular: ações refletem em segundos nos dois
- [ ] Arrastar e soltar funciona por toque no tablet (segurar ~0,5s e arrastar)
- [ ] Modo avião: faixa vermelha aparece e alterações são bloqueadas

---

## Estrutura do projeto

```
supabase/
  schema.sql               # tabelas, triggers, RPCs, RLS, realtime (instalação nova)
  seed.sql                 # mesas com posições do mapa de chão + reservas oficiais
  migracao-passo-1.sql     # migração de banco existente (turno 22h)
  migracao-passo-2.sql     # migração: posições, caixa libera mesa, reservas oficiais
src/
  middleware.ts            # proteção de rotas (Supabase Auth)
  lib/                     # tipos, constantes, ações de negócio, estado das mesas, realtime
  components/              # UI compartilhada (modais, formulários, navegação)
  app/
    login/                 # autenticação (login único)
    (app)/mapa/            # TELA PRINCIPAL: planta + drag-and-drop + lista de casais
    (app)/caixa/           # crédito e fechamento
    (app)/...              # telas de apoio fora do menu
public/
  manifest.webmanifest, sw.js, icons/   # PWA
```
