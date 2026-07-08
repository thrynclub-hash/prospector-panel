import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";

// Cascade no schema (redesigns.lead_id ... on delete cascade) já cuida de
// apagar os redesigns junto -- não precisa deletar em duas etapas aqui.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const { error } = await supabase.from("leads").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("leads/[id] DELETE: erro apagando lead", error);
    return NextResponse.json({ error: "Erro apagando lead" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
