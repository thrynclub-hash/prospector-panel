import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "redesign-assets";

// Re-hospeda um asset binário no Supabase Storage e retorna a URL pública.
// Usado tanto pra fotos do Places (nunca expor GOOGLE_PLACES_API_KEY num
// <img src> client-side) quanto pro screenshot "antes" do site original.
export async function uploadAsset(
  supabase: SupabaseClient,
  params: { userId: string; path: string; bytes: Buffer; contentType: string }
): Promise<string> {
  const fullPath = `${params.userId}/${params.path}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, params.bytes, { contentType: params.contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  return data.publicUrl;
}

export async function uploadFromUrl(
  supabase: SupabaseClient,
  params: { userId: string; path: string; sourceUrl: string }
): Promise<string | null> {
  try {
    const res = await fetch(params.sourceUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return await uploadAsset(supabase, { userId: params.userId, path: params.path, bytes, contentType });
  } catch {
    return null;
  }
}
