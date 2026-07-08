-- Fase 1 (Buscar): tabelas `leads` e `usage_events`.
--
-- IMPORTANTE (BUSCA-04 / PITFALLS.md Pitfall 1): os termos de uso do Google
-- Places API só permitem cache indefinido de `place_id` (lat/lng por até 30
-- dias). Nome, endereço, telefone, rating, horário e website NÃO podem virar
-- coluna permanente aqui -- são sempre re-buscados ao vivo (Place Details)
-- quando a lista de leads é exibida. As únicas colunas de "display" que esta
-- tabela guarda são dados que o próprio painel descobre (scrape de e-mail,
-- score do PageSpeed) -- não são dados brutos do Places, então não caem na
-- restrição de cache do Places ToS.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  place_id text not null,
  has_own_website boolean not null default false,
  pagespeed_score int,
  public_email text,
  status text not null default 'found',
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

comment on table leads is 'Leads encontrados via Buscar (Fase 1). place_id é a única chave de dado do Places API cacheada permanentemente (ToS); demais campos de display (nome/rating/endereço/website) são re-buscados ao vivo via Place Details quando a lista é exibida, nunca armazenados aqui.';

alter table leads enable row level security;

create policy "leads_select_own" on leads for select using (auth.uid() = user_id);
create policy "leads_insert_own" on leads for insert with check (auth.uid() = user_id);
create policy "leads_update_own" on leads for update using (auth.uid() = user_id);
create policy "leads_delete_own" on leads for delete using (auth.uid() = user_id);

-- Log de uso pra quota diária (FOUND-03). Log de eventos em vez de contador
-- mutável -- evita race condition sob requisições concorrentes e mantém
-- trilha auditável de quando a quota foi consumida.
create table if not exists usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) default auth.uid(),
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_action_time_idx on usage_events (user_id, action, created_at);

comment on table usage_events is 'Log de eventos de uso (busca, geração de redesign) pra aplicar quota diária por assinante (FOUND-03). Contagem via COUNT(*) WHERE created_at > hoje, não um contador mutável.';

alter table usage_events enable row level security;

create policy "usage_events_select_own" on usage_events for select using (auth.uid() = user_id);
create policy "usage_events_insert_own" on usage_events for insert with check (auth.uid() = user_id);
