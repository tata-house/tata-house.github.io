# 🍣 Tata Sushi — Reservas Dia dos Namorados

Sistema web **PWA** para operar a noite do Dia dos Namorados: recepção, mapa de mesas,
controle de reservas, passantes e crédito de **R$ 100 via Pix** revertido em consumação.

Substitui a planilha durante o evento, com atualização **em tempo real** entre todos os
celulares/tablets da equipe.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase**: Postgres, Auth e Realtime
- **PWA** instalável (manifest + service worker)
- Deploy pronto para **Vercel**

## Regras de negócio implementadas

1. Dois turnos: **19:00** e **21:00**.
2. Cada reserva = **2 pessoas** (casal).
3. Capacidade por turno: Salão Principal **24 reservas/48 pessoas**, Varanda **7/14**, total **31/62**.
4. Uma mesa **não pode** ter duas reservas ativas no mesmo turno (constraint única no banco).
5. A mesma mesa pode ser usada às 19h e novamente às 21h.
6. Passantes **não têm** crédito de reserva.
7. Reserva confirmada pode ter crédito de **R$ 100** quando o Pix está pago.
8. O crédito **só pode ser aplicado uma vez** (função atômica no banco, registra quem aplicou e quando).
9. Toda mudança de mesa fica em **histórico** (`reservation_events`, gravado por trigger).
10. Cancelados e no-show **não ocupam** capacidade ativa.

---

## 1. Instalação local

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# edite .env.local com a URL e a anon key do seu projeto Supabase

# 3. Rode em desenvolvimento
npm run dev
```

Abra http://localhost:3000.

## 2. Configuração do Supabase

1. Crie um projeto em https://supabase.com (região São Paulo recomendada).
2. No **SQL Editor**, execute na ordem:
   - [`supabase/schema.sql`](supabase/schema.sql) — tabelas, constraints, triggers, funções e RLS;
   - [`supabase/seed.sql`](supabase/seed.sql) — mesas (com posição no mapa) e as reservas reais da planilha.
3. Em **Authentication → Users → Add user**, crie os usuários da equipe
   (e-mail + senha, marque *Auto Confirm*). Cada usuário ganha um profile
   automático com perfil `recepcao`.
4. Ajuste os perfis no SQL Editor:

```sql
update public.profiles set role = 'gerente', nome = 'Nome do Gerente'
 where id = (select id from auth.users where email = 'gerente@tatasushi.com');

update public.profiles set role = 'caixa', nome = 'Nome do Caixa'
 where id = (select id from auth.users where email = 'caixa@tatasushi.com');
```

5. Copie **Project Settings → API → URL** e **anon public key** para o `.env.local`
   (e depois para a Vercel).

> O Realtime já fica habilitado pelo `schema.sql` (`alter publication supabase_realtime ...`).

### Perfis de acesso

| Perfil     | O que faz |
|------------|-----------|
| `gerente`  | Tudo, inclusive caixa |
| `recepcao` | Check-in, reservas, mapa, passantes (caixa em modo leitura) |
| `caixa`    | Aplicar crédito e fechar contas (e demais telas) |

## 3. Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Em https://vercel.com → **Add New Project** → importe o repositório.
3. Framework: **Next.js** (detectado automaticamente).
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy**. Pronto — a URL gerada já funciona como PWA.

### Instalar no celular/tablet

- **Android/Chrome**: abra a URL → menu ⋮ → **Adicionar à tela inicial**.
- **iPhone/iPad (Safari)**: botão compartilhar → **Adicionar à Tela de Início**.

## 4. Telas

| Rota          | Função |
|---------------|--------|
| `/login`      | Login com e-mail e senha (Supabase Auth) |
| `/dashboard`  | Painel por turno: confirmadas, sentadas, Pix pendente, capacidade, ocupação por área e alertas de lotação |
| `/checkin`    | Check-in ultra-rápido: busca + botões Chegou / Sentar / Mover / No-show |
| `/mapa`       | Mapa visual das mesas (Salão e Varanda) com cores por estado e ações ao tocar |
| `/reservas`   | Tabela com filtros (turno, área, status, Pix, busca) e todas as ações |
| `/passantes`  | Registro de passantes (sem crédito Pix) |
| `/caixa`      | Aplicar crédito de R$ 100 e fechar conta com desconto automático |
| `/relatorios` | Lista de chegada, caixa/créditos, passantes e no-show — imprimir e exportar CSV |

### Cores do mapa

🟩 Livre · 🟦 Reservada · 🟧 Chegou · 🟥 Ocupada · ⬜ Limpeza/finalizada · ⬛ Bloqueada

### Mesas cadastradas

- **Salão Principal (reserváveis)**: 1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 15, 17, 19, 20, 21, 24
- **Apoio/balcão (inativas por padrão)**: 41–45 e 51–55 — para ativar:
  `update public.tables set ativa = true where numero = '41';`
- **Varanda**: 60, 62, 64, 65, 66 + extras **V1** e **V2**

## 5. PWA e modo offline

- O app abre offline (cache básico do shell), mas os **dados exigem conexão**.
- Quando offline, uma faixa vermelha avisa e **todas as alterações são bloqueadas**
  para evitar conflito de mesas entre dispositivos.
- Ao voltar a conexão, os dados são recarregados automaticamente.

## 6. Checklist de teste antes do evento

**Banco e acesso**
- [ ] `schema.sql` e `seed.sql` executados sem erro no Supabase
- [ ] Usuários criados (gerente, recepção, caixa) e roles ajustados
- [ ] Login funciona com os três perfis
- [ ] Variáveis de ambiente configuradas na Vercel e deploy OK

**Dados**
- [ ] Apagar as reservas de **EXEMPLO** (`delete from reservations where observacao like 'EXEMPLO%';`)
- [ ] Conferir as 20 reservas reais (9 às 19h, 11 às 21h) com nomes e mesas corretos
- [ ] Atualizar telefone das reservas reais, se disponível
- [ ] Confirmar Pix das reservas que já pagaram (`Confirmar Pix` na tela de Reservas)

**Fluxo de operação (ensaio geral)**
- [ ] Dashboard mostra capacidade certa por turno (24+7 = 31 reservas)
- [ ] Criar reserva nova em mesa livre → aparece no mapa em azul
- [ ] Tentar criar 2ª reserva na mesma mesa/turno → sistema **bloqueia** com aviso de conflito
- [ ] Mesma mesa em turnos diferentes → permitido
- [ ] Check-in: Chegou (laranja no mapa) → Sentar (vermelho)
- [ ] Mover mesa → histórico registrado (tabela `reservation_events`)
- [ ] Passante: criar com mesa → nunca mostra crédito
- [ ] Caixa: aplicar crédito em reserva com Pix pago → funciona **uma vez**; segunda vez é bloqueada
- [ ] Caixa: tentar aplicar crédito em Pix pendente ou passante → bloqueado
- [ ] Fechar conta → desconto do crédito aparece certo; mesa fica cinza (limpeza)
- [ ] Liberar mesa após limpeza → volta a verde
- [ ] No-show e cancelar → mesa liberada, não conta capacidade

**Tempo real e dispositivos**
- [ ] Abrir em 2 celulares: ação em um aparece no outro em segundos
- [ ] Instalar PWA no tablet da recepção e no celular do caixa
- [ ] Modo avião: faixa vermelha aparece e alterações são bloqueadas
- [ ] Imprimir lista de chegada (Relatórios → Imprimir)
- [ ] Exportar CSV e abrir no Excel

---

## Estrutura do projeto

```
supabase/
  schema.sql        # tabelas, triggers, RPCs, RLS, realtime
  seed.sql          # mesas com posições do mapa + reservas reais
src/
  middleware.ts     # proteção de rotas (Supabase Auth)
  lib/              # tipos, constantes, ações de negócio, contexto realtime
  components/       # UI compartilhada (modais, formulários, navegação)
  app/
    login/          # autenticação
    (app)/          # dashboard, checkin, mapa, reservas, passantes, caixa, relatorios
public/
  manifest.webmanifest, sw.js, icons/   # PWA
```
