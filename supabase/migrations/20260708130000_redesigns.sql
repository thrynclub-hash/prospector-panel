-- Fase 2 (Redesenhar): tabela `redesigns` + bucket de storage pros assets
-- binários (screenshot "antes" e fotos do negócio re-hospedadas).
--
-- `content` (jsonb) é o formato CONGELADO da página gerada (Anti-Pattern 3 do
-- ARCHITECTURE.md) -- ver types/redesign-content.ts pro shape TypeScript
-- correspondente. Editor (Fase 3) e Publicar (Fase 4) leem/escrevem essa
-- mesma coluna; mudar o shape depois exige migração de dados, não só código.
create table if not exists redesigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  lead_id uuid not null references leads(id) on delete cascade,
  content jsonb not null,
  before_screenshot_url text,
  status text not null default 'ready',
  public_slug text unique,
  is_public boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table redesigns is 'Redesigns gerados por IA (Fase 2). content jsonb tem o shape fixo de types/redesign-content.ts, com separação explícita entre campos verificados (facts) e gerados (generated) -- REDESENHAR-02.';

alter table redesigns enable row level security;

create policy "redesigns_select_own" on redesigns for select using (auth.uid() = user_id);
create policy "redesigns_insert_own" on redesigns for insert with check (auth.uid() = user_id);
create policy "redesigns_update_own" on redesigns for update using (auth.uid() = user_id);
create policy "redesigns_delete_own" on redesigns for delete using (auth.uid() = user_id);

-- Bucket público (leitura) pra fotos/logo re-hospedados do Places e o
-- screenshot "antes" -- nunca serve a GOOGLE_PLACES_API_KEY direto num <img
-- src> client-side (Anti-Pattern 2-adjacent: chave de API não deve vazar pro
-- navegador do visitante da demo pública, Fase 4).
insert into storage.buckets (id, name, public)
values ('redesign-assets', 'redesign-assets', true)
on conflict (id) do nothing;

create policy "redesign_assets_public_read" on storage.objects
  for select using (bucket_id = 'redesign-assets');

create policy "redesign_assets_owner_write" on storage.objects
  for insert with check (bucket_id = 'redesign-assets' and auth.uid() = owner);
