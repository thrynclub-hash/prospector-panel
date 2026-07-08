"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, EyeOff, Copy, Check } from "lucide-react";

export function PublishButton({
  redesignId,
  initialIsPublic,
  initialSlug,
}: {
  redesignId: string;
  initialIsPublic: boolean;
  initialSlug: string | null;
}) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = slug ? `${window.location.origin}/demo/${slug}` : null;

  async function handlePublish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/redesigns/${redesignId}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSlug(data.slug);
        setIsPublic(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUnpublish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/redesigns/${redesignId}/publish`, { method: "DELETE" });
      if (res.ok) {
        setIsPublic(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isPublic && publicUrl) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-good-bg text-good text-sm font-medium"
        >
          <Globe size={14} /> {publicUrl}
        </a>
        <button
          onClick={handleCopy}
          className="p-2.5 rounded-xl border border-border text-muted hover:text-ink transition-colors"
          title="Copiar link"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          onClick={handleUnpublish}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm text-muted hover:border-bad hover:text-bad transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
          Despublicar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-good text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
      Publicar demo pública
    </button>
  );
}
