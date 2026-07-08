-- Fase 4 (Publicar): view pública + RLS pra servir um redesign publicado sem
-- autenticação, sem nunca usar o client admin/service-role numa rota exposta
-- à internet (ARCHITECTURE.md Anti-Pattern 2).
--
-- security_invoker=true é obrigatório aqui: sem isso, a view roda com o
-- privilégio do DONO (bypassa RLS), não do papel que está consultando --
-- anularia a proteção de is_public=true por completo.
create view public_redesigns
with (security_invoker = true) as
select id, public_slug, content, published_at
from redesigns
where is_public = true;

grant select on public_redesigns to anon;

-- Defesa em profundidade: mesmo que um código futuro esqueça o filtro
-- is_public=true numa query direta em `redesigns`, a RLS barra no nível do
-- banco pro papel anon.
create policy "redesigns_public_read" on redesigns
  for select
  to anon
  using (is_public = true);

grant select on redesigns to anon;
