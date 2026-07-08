-- Baseline: captura o schema real de prospector_customers como ele existe hoje
-- no banco Supabase compartilhado (projeto "Marusso Projetos"), antes de este
-- projeto começar a versionar migrations. Colunas zapi_* pertencem ao ZapFlow
-- (mesmo banco compartilhado) -- mantidas aqui porque já existem na tabela real,
-- não porque este projeto as usa.
create table if not exists prospector_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null,
  kiwify_order_id text,
  status text not null default 'active',
  zapi_instance_id text,
  zapi_token text,
  zapi_client_token text,
  created_at timestamptz not null default now()
);

comment on table prospector_customers is 'Compradores do painel Prospector de Sites - acesso liberado via webhook da Kiwify.';

-- O código da aplicação (app/api/kiwify/webhook/route.ts) já trata email como
-- único (busca por .eq("email", ...).maybeSingle() antes de criar). Esta
-- constraint só torna explícito no banco o que o código já pressupõe.
create unique index if not exists prospector_customers_email_key on prospector_customers (email);
