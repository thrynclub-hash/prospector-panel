import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import type { RedesignContent } from "@/types/redesign-content";

// EDITOR-01: assinante edita textos/imagens da página gerada. Só o bloco
// `generated` (e `photos`) é editável -- `facts` fica read-only aqui (são o
// snapshot verificado da geração; deixar editar sem controle abriria brecha
// pra "corrigir" um fato pra algo não verificado, o oposto do que
// REDESENHAR-02 garante).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    generated?: RedesignContent["generated"];
    photos?: RedesignContent["photos"];
  };

  const { data: existing, error: fetchError } = await supabase
    .from("redesigns")
    .select("content")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Redesign não encontrado" }, { status: 404 });
  }

  const currentContent = existing.content as RedesignContent;
  const updatedContent: RedesignContent = {
    facts: currentContent.facts,
    generated: body.generated ?? currentContent.generated,
    photos: body.photos ?? currentContent.photos,
  };

  const { data: redesign, error } = await supabase
    .from("redesigns")
    .update({ content: updatedContent, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, content, before_screenshot_url, status, created_at, updated_at")
    .single();

  if (error) {
    console.error("redesigns/[id] PATCH: erro atualizando", error);
    return NextResponse.json({ error: "Erro salvando edição" }, { status: 500 });
  }

  return NextResponse.json({ redesign });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const { error } = await supabase.from("redesigns").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("redesigns/[id] DELETE: erro apagando", error);
    return NextResponse.json({ error: "Erro apagando redesign" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
