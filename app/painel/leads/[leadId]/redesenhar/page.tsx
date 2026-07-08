import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Maximize2, Columns2, Pencil } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkQuota } from "@/lib/quota";
import type { RedesignContent } from "@/types/redesign-content";
import { GenerateButton } from "./generate-button";
import { Comparator } from "./comparator";
import { DeleteRedesignButton } from "./delete-redesign-button";

export default async function RedesenharPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, place_id, status")
    .eq("id", leadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  const [quota, { data: redesign }] = await Promise.all([
    checkQuota(supabase, user.id, "redesign_generate"),
    supabase
      .from("redesigns")
      .select("id, content, before_screenshot_url, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/painel/buscar" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-8">
          <ArrowLeft size={16} /> Leads salvos
        </Link>

        <h1 className="font-display font-bold text-3xl text-ink mb-2">Redesenhar</h1>
        <p className="text-muted mb-2">
          Gera uma versão premium do site deste negócio, preservando conteúdo, fotos e dados reais.
        </p>
        <p className="text-sm text-muted mb-8">
          {quota.used}/{quota.limit} gerações usadas hoje
          {quota.used >= quota.limit && <span className="text-bad"> — limite diário atingido</span>}
        </p>

        {!redesign ? (
          <GenerateButton leadId={leadId} disabled={quota.used >= quota.limit} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <Link
                href={`/painel/leads/${leadId}/redesenhar/compare`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-medium hover:bg-accent-dim transition-colors"
              >
                <Columns2 size={14} /> Comparação lado a lado (nova aba)
              </Link>
              <Link
                href={`/painel/leads/${leadId}/redesenhar/preview`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-accent hover:text-accent-dim font-medium"
              >
                <Maximize2 size={14} /> Ver só o redesign
              </Link>
              {(redesign.content as RedesignContent).facts.websiteUrl && (
                <a
                  href={(redesign.content as RedesignContent).facts.websiteUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
                >
                  <ExternalLink size={14} /> Ver só o site antigo
                </a>
              )}
            </div>

            <p className="text-xs text-muted -mt-4">
              O comparador abaixo é só um recorte rápido (altura fixa) — use "Comparação lado a lado" pra ver as duas versões inteiras, cada uma com sua rolagem.
            </p>

            <Comparator beforeUrl={redesign.before_screenshot_url} content={redesign.content as RedesignContent} />

            <div className="flex items-center gap-3 flex-wrap">
              <GenerateButton leadId={leadId} disabled={quota.used >= quota.limit} />
              <Link
                href={`/painel/leads/${leadId}/redesenhar/editar`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
              >
                <Pencil size={14} /> Editar
              </Link>
              <DeleteRedesignButton redesignId={redesign.id} />
            </div>
            <p className="text-xs text-muted">
              Gerar de novo cria uma nova versão (não edita a atual).
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
