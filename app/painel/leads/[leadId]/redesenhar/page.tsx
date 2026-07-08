import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Maximize2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkQuota } from "@/lib/quota";
import type { RedesignContent } from "@/types/redesign-content";
import { GenerateButton } from "./generate-button";
import { Comparator } from "./comparator";

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
            <div className="flex items-center justify-between text-sm">
              {(redesign.content as RedesignContent).facts.websiteUrl ? (
                <a
                  href={(redesign.content as RedesignContent).facts.websiteUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
                >
                  <ExternalLink size={14} /> Abrir site antigo em nova aba
                </a>
              ) : (
                <span />
              )}
              <Link
                href={`/painel/leads/${leadId}/redesenhar/preview`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-accent hover:text-accent-dim font-medium"
              >
                <Maximize2 size={14} /> Ver redesign completo em nova aba
              </Link>
            </div>

            <p className="text-xs text-muted -mt-4">
              O comparador abaixo é só um recorte rápido lado a lado (a altura é fixa) — use os links acima pra ver cada versão inteira, com rolagem normal.
            </p>

            <Comparator beforeUrl={redesign.before_screenshot_url} content={redesign.content as RedesignContent} />
            <GenerateButton leadId={leadId} disabled={quota.used >= quota.limit} />
            <p className="text-xs text-muted">
              Gerar de novo cria uma nova versão (não edita a atual). Editor visual chega na próxima fase.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
