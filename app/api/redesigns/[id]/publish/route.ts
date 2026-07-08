import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireActiveUser } from "@/lib/auth-guard";

// PUBLICAR-04: slug não-adivinhável -- nanoid(12), nunca o id sequencial nem
// o nome do negócio. Idempotente: se já publicado, devolve o slug existente
// em vez de gerar um novo (evita invalidar um link já compartilhado).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const { data: existing } = await supabase
    .from("redesigns")
    .select("id, public_slug, is_public")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Redesign não encontrado" }, { status: 404 });
  }

  if (existing.is_public && existing.public_slug) {
    return NextResponse.json({ slug: existing.public_slug });
  }

  const slug = existing.public_slug ?? nanoid(12);

  const { error } = await supabase
    .from("redesigns")
    .update({ public_slug: slug, is_public: true, published_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("redesigns/publish: erro publicando", error);
    return NextResponse.json({ error: "Erro publicando" }, { status: 500 });
  }

  return NextResponse.json({ slug });
}

// Despublicar: mantém o public_slug salvo (não reaproveitado por outro
// redesign) mas is_public=false tira do ar -- religar depois usa o mesmo link.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const { error } = await supabase
    .from("redesigns")
    .update({ is_public: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Erro despublicando" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
