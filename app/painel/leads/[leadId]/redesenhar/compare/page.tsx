import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RedesignContent } from "@/types/redesign-content";
import { RedesignPreview } from "../redesign-preview";
import { CompareOldSite } from "./compare-old-site";

// Página dedicada pra abrir em nova aba: metade da tela pro site antigo,
// metade pro novo, cada lado com sua própria rolagem -- resolve a limitação
// do comparador de 600px (que corta as duas versões). Mesmo espírito do
// comparador do plugin original (iframes lado a lado + link "abrir em nova
// aba" como fallback quando o site antigo bloqueia incorporação).
export default async function ComparePage({ params }: { params: Promise<{ leadId: string }> }) {
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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg">
      <div className="flex-1 flex min-h-0">
        <div className="w-1/2 h-full flex flex-col border-r border-border min-h-0">
          <div className="px-4 py-2 bg-card border-b border-border text-xs font-medium text-muted shrink-0">
            SITE ATUAL
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <CompareOldSite websiteUrl={content.facts.websiteUrl} />
          </div>
        </div>
        <div className="w-1/2 h-full flex flex-col min-h-0">
          <div className="px-4 py-2 bg-card border-b border-border text-xs font-medium text-good shrink-0">
            NOVA VERSÃO
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-white">
            <RedesignPreview content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
