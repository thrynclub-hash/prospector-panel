import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RedesignContent } from "@/types/redesign-content";
import { RedesignPreview } from "../redesign-preview";

// Fase 02.2: substitui o formulário separado da Fase 3 pela edição
// inline direto no preview real -- clicar em texto edita no lugar, clicar em
// imagem troca via upload; cada edição salva sozinha (sem botão "Salvar
// edição" -- ver RedesignPreview/editable-field.tsx). A rota/entrada
// (/editar, o botão "Editar" na página principal) permanece a mesma; só o
// conteúdo interno muda -- nenhuma mudança em redesenhar/page.tsx.
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
    <div className="min-h-screen bg-bg">
      <div className="sticky top-0 z-30 bg-ink text-white px-4 py-2.5 text-xs sm:text-sm flex items-center gap-3 flex-wrap">
        <Link
          href={`/painel/leads/${leadId}/redesenhar`}
          className="inline-flex items-center gap-1.5 hover:opacity-80 shrink-0"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
        <span className="text-white/40">·</span>
        <span className="text-white/90">
          Modo edição — clique em qualquer texto ou foto abaixo pra editar direto. Dados verificados (nome, endereço,
          nota, horário) não são editáveis aqui.
        </span>
      </div>
      <RedesignPreview content={content} editable redesignId={redesign.id} />
    </div>
  );
}
