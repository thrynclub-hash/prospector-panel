import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "E-mail obrigatório" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("prospector_customers")
    .select("status")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("access-status: erro consultando cliente", error);
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: true, found: false });
  }

  return NextResponse.json({ ok: true, found: true, active: data.status === "active" });
}
