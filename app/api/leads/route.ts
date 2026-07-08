import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import { getEnrichedLeads } from "@/lib/leads";

// POST: salva um lead (BUSCA-04) -- só place_id + campos que o próprio painel
// descobriu (e-mail, pagespeed). Nunca nome/endereço/rating do Places (Pitfall 1).
export async function POST(request: Request) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const body = (await request.json().catch(() => ({}))) as {
    placeId?: string;
    hasOwnWebsite?: boolean;
    pagespeedScore?: number | null;
    publicEmail?: string | null;
  };

  if (!body.placeId || typeof body.placeId !== "string") {
    return NextResponse.json({ error: "placeId obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: user.id,
      place_id: body.placeId,
      has_own_website: body.hasOwnWebsite ?? false,
      pagespeed_score: body.pagespeedScore ?? null,
      public_email: body.publicEmail ?? null,
    })
    .select("id, place_id, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Lead já salvo" }, { status: 409 });
    }
    console.error("leads POST: erro salvando lead", error);
    return NextResponse.json({ error: "Erro salvando lead" }, { status: 500 });
  }

  return NextResponse.json({ lead: data }, { status: 201 });
}

// GET: lista leads salvos, re-buscando dados de exibição ao vivo via Place
// Details (BUSCA-04 / Pitfall 1 -- nunca lidos de uma coluna cacheada).
export async function GET() {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  try {
    const leads = await getEnrichedLeads(supabase, user.id);
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("leads GET: erro listando leads", err);
    return NextResponse.json({ error: "Erro listando leads" }, { status: 500 });
  }
}
