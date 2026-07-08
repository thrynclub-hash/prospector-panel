import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RedesignContent } from "@/types/redesign-content";
import { RedesignPreview } from "../redesign-preview";

// Página cheia, sem altura fixa/scroll interno -- o comparador (600px) é só
// pra um olhar rápido lado a lado; aqui é pra ver o redesign completo do
// jeito que ele realmente vai aparecer, com a rolagem natural da página.
export default async function RedesignPreviewPage({ params }: { params: Promise<{ leadId: string }> }) {
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

  return (
    <main className="min-h-screen bg-bg">
      <div className="px-4 py-3">
        <Link
          href={`/painel/leads/${leadId}/redesenhar`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft size={16} /> Voltar pro comparador
        </Link>
      </div>
      {/* Sem max-w aqui -- RedesignPreview (Fase 02.2) é uma landing page de
          largura cheia com seções full-bleed (hero, localização); travar num
          max-w-3xl (resquício da versão simples da Fase 2) espremia o layout
          inteiro numa coluna estreita. */}
      <RedesignPreview content={redesign.content as RedesignContent} />
    </main>
  );
}
