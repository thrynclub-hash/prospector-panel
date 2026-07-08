-- Fase 5 (Proposta): tabelas `proposals` e `contacted_businesses`.
--
-- `proposals` guarda o texto gerado pra outreach (PROPOSTA-01/02/03). NÃO
-- entra em redesigns.content -- esse jsonb está CONGELADO (Anti-Pattern 3,
-- ARCHITECTURE.md) e proposta tem ciclo de vida diferente (gerada uma vez,
-- editável, enviada ou não, rastreada por canal). unique(redesign_id) é
-- 1:1 com a VERSÃO específica do redesign (não com o lead) -- se o
-- assinante gerar um redesign novo (GenerateButton: "gerar de novo cria uma
-- nova versão"), a proposta antiga não é reaproveitada, porque ela citaria
-- o link /demo/[slug] de uma versão possivelmente diferente/despublicada.
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  redesign_id uuid not null unique references redesigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) default auth.uid(),
  email_subject text not null,
  email_body text not null,
  whatsapp_text text not null,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table proposals is 'Texto de proposta (Fase 5) gerado uma vez por redesign e reaproveitado/editável nas próximas visitas -- PROPOSTA-01/02/03. 1:1 com redesigns (unique redesign_id), não com leads.';

alter table proposals enable row level security;

create policy "proposals_select_own" on proposals for select using (auth.uid() = user_id);
create policy "proposals_insert_own" on proposals for insert with check (auth.uid() = user_id);
create policy "proposals_update_own" on proposals for update using (auth.uid() = user_id);

-- `contacted_businesses`: lista de supressão global (PROPOSTA-04). Primeira
-- tabela deste projeto SEM coluna de ownership por assinante -- de
-- propósito: um negócio contatado (ou que pediu opt-out) por QUALQUER
-- assinante precisa bloquear o envio automático pro MESMO negócio por
-- QUALQUER OUTRO assinante. Chave é place_id -- único dado do Places API
-- permitido a persistir indefinidamente pelos termos de uso (mesma decisão
-- já tomada em `leads`, BUSCA-04).
create table if not exists contacted_businesses (
  place_id text primary key,
  contacted_by_user_id uuid references auth.users(id) default auth.uid(),
  contacted_via text not null default 'email',
  opt_out_token text unique,
  opted_out_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table contacted_businesses is 'Lista de supressão global (Fase 5, PROPOSTA-04), cross-subscriber por design -- única tabela do produto sem user_id de ownership. Linha criada no momento de um envio de e-mail bem-sucedido (contacted_via=email); opted_out_at é setado depois, publicamente, por quem clica o link em /unsubscribe/[token].';

alter table contacted_businesses enable row level security;

-- Leitura compartilhada entre TODOS os assinantes autenticados -- checar
-- supressão pra QUALQUER lead antes de habilitar o botão de e-mail (não só
-- leads do próprio assinante) é o ponto central de PROPOSTA-04. A policy
-- controla LINHAS (using (true) = todas); o GRANT column-level logo abaixo
-- controla COLUNAS -- opt_out_token nunca é exposto a um select comum de
-- assinante, só é lido dentro do corpo de opt_out_business() (ver abaixo).
create policy "contacted_businesses_select_authenticated"
  on contacted_businesses for select
  to authenticated
  using (true);

-- Insert só acontece no servidor, logo após um envio via Resend ter sucesso
-- de fato (rota guardada por requireActiveUser()). with check garante que o
-- assinante só grava a própria autoria, nunca atribui o contato a outro
-- user_id.
create policy "contacted_businesses_insert_authenticated"
  on contacted_businesses for insert
  to authenticated
  with check (contacted_by_user_id = auth.uid());

-- DE PROPÓSITO não existe NENHUMA policy de UPDATE (nem de SELECT) pro papel
-- anon nesta tabela. Uma policy `using (opt_out_token is not null)` pareceria
-- certa mas não compara o token que o chamador enviou contra o token real da
-- linha -- toda linha tem opt_out_token preenchido desde o insert, então essa
-- condição é verdadeira pra tabela inteira, e um UPDATE anon direto via REST
-- (contornando o Next.js, já que a anon key é pública por design no modelo
-- do Supabase) limparia a lista de supressão inteira. A comparação real de
-- token só pode acontecer dentro do corpo de uma função -- nunca numa
-- expressão de policy avaliada linha a linha sem o valor do parâmetro.
--
-- opt_out_business(token): único caminho de escrita pública desta tabela
-- (Fase 4 só teve leitura pública). security definer roda com os privilégios
-- de quem criou a função (bypassa RLS pra esta operação controlada), mas o
-- WHERE `opt_out_token = token` -- dentro do corpo, não num `.eq()` de
-- cliente -- é o que de fato autoriza a escrita. Mesma fronteira de
-- confiança de uma RPC comum; NÃO é o client admin/service-role que
-- CONTEXT.md proíbe pra este caminho público (aquele client bypassaria RLS
-- pra QUALQUER operação; esta função só bypassa RLS pra ESTA comparação de
-- token específica). Idempotente: clicar o link duas vezes não sobrescreve
-- um opted_out_at já setado (coalesce), e o retorno informa se já estava
-- opted-out antes desta chamada.
create or replace function opt_out_business(token text)
returns table (place_id text, already_opted_out boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    update contacted_businesses cb
    set opted_out_at = coalesce(cb.opted_out_at, now())
    where cb.opt_out_token = token
    returning cb.place_id, (cb.opted_out_at < now()) as already_opted_out;
end;
$$;

revoke all on function opt_out_business(text) from public;
grant execute on function opt_out_business(text) to anon;

-- Column-level grant: exclui opt_out_token do select de authenticated (é um
-- bearer-credential de opt-out, não um dado pra ler de volta -- ver
-- comentário acima). Independente da RLS: a policy controla linhas, este
-- grant controla colunas.
grant select (place_id, contacted_by_user_id, contacted_via, opted_out_at, created_at) on contacted_businesses to authenticated;
grant insert on contacted_businesses to authenticated;
