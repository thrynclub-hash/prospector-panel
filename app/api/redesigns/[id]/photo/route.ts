import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth-guard";
import { uploadAsset } from "@/lib/storage/assets";

// Upload de foto de substituição/adição no editor (EDITOR-01: "troca
// imagens"). Só sobe o arquivo e devolve a URL pública -- quem persiste no
// array photoUrls é o PATCH em /api/redesigns/[id], disparado pelo form ao
// salvar.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireActiveUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  const { id } = await params;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";

  const url = await uploadAsset(supabase, {
    userId: user.id,
    path: `${id}/upload-${Date.now()}.${ext}`,
    bytes,
    contentType: file.type || "image/jpeg",
  }).catch(() => null);

  if (!url) {
    return NextResponse.json({ error: "Erro fazendo upload" }, { status: 500 });
  }

  return NextResponse.json({ url });
}
