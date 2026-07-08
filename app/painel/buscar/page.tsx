import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Star, Mail, Globe, HelpCircle, Sparkles, Eye } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkQuota } from "@/lib/quota";
import { getEnrichedLeads } from "@/lib/leads";
import { SearchForm } from "./search-form";

export default async function BuscarPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade: app/painel/layout.tsx já redireciona sem sessão,
  // mas não confiamos num non-null assertion aqui -- o mesmo padrão de "dois
  // portões" usado nas rotas de API.
  if (!user) {
    redirect("/login");
  }

  const [quota, leads] = await Promise.all([
    checkQuota(supabase, user.id, "search"),
    getEnrichedLeads(supabase, user.id),
  ]);

  // Quais leads já têm redesign gerado -- sem isso, a lista não distingue
  // "nunca gerei" de "já gerei, só preciso ver de novo" (motivo real do
  // usuário achar que um redesign tinha "sumido": tava lá, só não tinha
  // like nenhum indicando isso na lista).
  const leadIds = leads.map((l) => l.id);
  const { data: existingRedesigns } = leadIds.length
    ? await supabase.from("redesigns").select("lead_id").eq("user_id", user.id).in("lead_id", leadIds)
    : { data: [] as { lead_id: string }[] };
  const leadIdsWithRedesign = new Set((existingRedesigns ?? []).map((r) => r.lead_id));

  return (
    <main className="min-h-screen bg-bg px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/painel" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-8">
          <ArrowLeft size={16} /> Painel
        </Link>

        <h1 className="font-display font-bold text-3xl text-ink mb-2">Buscar</h1>
        <p className="text-muted mb-8">
          Encontre negócios locais com nota alta e site ruim — os melhores candidatos pra um redesign.
        </p>

        <SearchForm initialQuota={{ used: quota.used, limit: quota.limit }} />

        <h2 className="font-display font-bold text-xl text-ink mb-4">Leads salvos ({leads.length})</h2>

        {leads.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted text-sm">
            Nenhum lead salvo ainda. Busque acima e clique em &quot;Salvar&quot; nos resultados que quiser revisar depois.
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-start justify-between gap-4 bg-card border border-border rounded-2xl p-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-bold text-ink">{lead.name}</h3>
                    {lead.rating && (
                      <span className="flex items-center gap-1 text-sm text-warn">
                        <Star size={14} fill="currentColor" /> {lead.rating}
                      </span>
                    )}
                  </div>
                  {lead.address && <p className="text-sm text-muted mb-2">{lead.address}</p>}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface border border-border text-muted">
                      {lead.websiteUrl ? <Globe size={12} /> : <HelpCircle size={12} />}
                      {lead.websiteUrl ?? "sem site"}
                    </span>
                    {lead.publicEmail && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface border border-border text-muted">
                        <Mail size={12} />
                        {lead.publicEmail}
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-violet/10 text-violet capitalize">{lead.status}</span>
                  </div>
                </div>
                <Link
                  href={`/painel/leads/${lead.id}/redesenhar`}
                  className={
                    leadIdsWithRedesign.has(lead.id)
                      ? "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-good-bg text-good text-sm font-medium hover:opacity-80 transition-opacity"
                      : "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors"
                  }
                >
                  {leadIdsWithRedesign.has(lead.id) ? (
                    <>
                      <Eye size={14} /> Ver redesign
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Redesenhar
                    </>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
