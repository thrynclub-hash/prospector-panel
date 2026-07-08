import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RedesignContent } from "@/types/redesign-content";
import { EditorForm } from "./editor-form";

export default async function EditarPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: redesign } = await supabase
    .from("redesigns")
    .select("id, content")
    .eq("lead_id", leadId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!redesign) {
    notFound();
  }

  const content = redesign.content as RedesignContent;

  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/painel/leads/${leadId}/redesenhar`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-8"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>

        <h1 className="font-display font-bold text-3xl text-ink mb-2">Editar redesign</h1>
        <p className="text-muted mb-2">{content.facts.name}</p>
        <p className="text-xs text-muted mb-8">
          Dados verificados (nome, endereço, nota) não são editáveis aqui — vêm direto do Google e não podem virar texto de marketing sem checagem.
        </p>

        <EditorForm redesignId={redesign.id} initialContent={content} />
      </div>
    </main>
  );
}
