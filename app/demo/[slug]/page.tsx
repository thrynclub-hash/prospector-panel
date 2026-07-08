import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { RedesignContent } from "@/types/redesign-content";
import { RedesignPreview } from "@/app/painel/leads/[leadId]/redesenhar/redesign-preview";

// PUBLICAR-02/03: disclaimer visível (não rodapé) + noindex. Pitfall 4
// (PITFALLS.md) trata os dois como bloqueante, não polish -- uma demo com
// nome/fotos reais de um negócio, sem aviso claro, lê como personificação,
// não como "mockup de venda".
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createSupabasePublicClient();
  const { data } = await supabase.from("public_redesigns").select("content").eq("public_slug", slug).maybeSingle();

  const name = data ? (data.content as RedesignContent).facts.name : "Demo";

  return {
    title: `${name} — demonstração não-oficial (conceito)`,
    description: `Redesign conceito não-oficial, não afiliado a ${name}. Não é o site real do negócio.`,
    robots: { index: false, follow: false },
  };
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createSupabasePublicClient();

  const { data: redesign } = await supabase
    .from("public_redesigns")
    .select("content, published_at")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!redesign) {
    notFound();
  }

  const content = redesign.content as RedesignContent;

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-warn text-white px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-md">
        <AlertTriangle size={16} className="shrink-0" />
        Demonstração conceitual não-oficial — não afiliada a {content.facts.name} nem publicada por este negócio. Não é o site real.
      </div>
      <RedesignPreview content={content} />
    </div>
  );
}
