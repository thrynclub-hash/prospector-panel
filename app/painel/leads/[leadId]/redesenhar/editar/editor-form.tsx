"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus, X, Upload, Sparkles } from "lucide-react";
import type { RedesignContent } from "@/types/redesign-content";

// EDITOR-02: todo campo aqui vem de content.generated -- sinalizado
// visualmente como "gerado por IA" pra revisão humana antes de publicar.
// content.facts é mostrado só como referência (read-only, ver nota em
// app/api/redesigns/[id]/route.ts).
function GeneratedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet/10 text-violet text-[11px] font-medium">
      <Sparkles size={10} /> Gerado por IA — revise antes de publicar
    </span>
  );
}

export function EditorForm({ redesignId, initialContent }: { redesignId: string; initialContent: RedesignContent }) {
  const router = useRouter();
  const [generated, setGenerated] = useState(initialContent.generated);
  const [photoUrls, setPhotoUrls] = useState(initialContent.photos.photoUrls);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateService(index: number, field: "title" | "description", value: string) {
    setGenerated((prev) => ({
      ...prev,
      services: prev.services.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function addService() {
    setGenerated((prev) => ({ ...prev, services: [...prev.services, { title: "", description: "" }] }));
  }

  function removeService(index: number) {
    setGenerated((prev) => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
  }

  async function handleUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/redesigns/${redesignId}/photo`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload falhou");
        return;
      }
      setPhotoUrls((prev) => [...prev, data.url]);
    } catch {
      setError("Erro de conexão no upload.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/redesigns/${redesignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generated, photos: { logoUrl: initialContent.photos.logoUrl, photoUrls } }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro salvando");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tenta de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-ink">Hero</h2>
          <GeneratedBadge />
        </div>
        <label className="block text-sm text-muted mb-1">Título</label>
        <input
          value={generated.heroHeadline}
          onChange={(e) => setGenerated((prev) => ({ ...prev, heroHeadline: e.target.value }))}
          className="w-full mb-4 px-4 py-2.5 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <label className="block text-sm text-muted mb-1">Subtítulo</label>
        <textarea
          value={generated.heroSubheadline}
          onChange={(e) => setGenerated((prev) => ({ ...prev, heroSubheadline: e.target.value }))}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-ink">Sobre</h2>
          <GeneratedBadge />
        </div>
        <textarea
          value={generated.aboutCopy}
          onChange={(e) => setGenerated((prev) => ({ ...prev, aboutCopy: e.target.value }))}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-ink">Serviços</h2>
          <GeneratedBadge />
        </div>
        <div className="space-y-3">
          {generated.services.map((service, i) => (
            <div key={i} className="flex gap-2 items-start bg-surface border border-border rounded-xl p-3">
              <div className="flex-1 space-y-2">
                <input
                  value={service.title}
                  onChange={(e) => updateService(i, "title", e.target.value)}
                  placeholder="Título do serviço"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-ink text-sm"
                />
                <textarea
                  value={service.description}
                  onChange={(e) => updateService(i, "description", e.target.value)}
                  placeholder="Descrição"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-ink text-sm"
                />
              </div>
              <button onClick={() => removeService(i)} className="p-2 text-muted hover:text-bad" aria-label="Remover serviço">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addService}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-dim font-medium"
        >
          <Plus size={14} /> Adicionar serviço
        </button>
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display font-bold text-ink mb-4">Fotos</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {photoUrls.map((url) => (
            <div key={url} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
              <button
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 p-1 rounded-full bg-ink/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover foto"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-dim font-medium cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Enviando..." : "Trocar/adicionar foto"}
          <input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploading} className="hidden" />
        </label>
      </section>

      {error && <div className="px-4 py-3 rounded-xl bg-bad-bg text-bad text-sm">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dim transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar edição
        </button>
        {saved && <span className="text-sm text-good">Salvo ✓</span>}
      </div>
    </div>
  );
}
