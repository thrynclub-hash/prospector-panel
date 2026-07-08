"use client";

import { ExternalLink } from "lucide-react";

// Iframes de terceiros podem ser bloqueados por X-Frame-Options/CSP do site
// original -- sem jeito confiável de detectar isso no cliente, então sempre
// mostramos o link "abrir em nova aba" junto (mesmo padrão do
// comparador-template.html do plugin original), em vez de confiar só no iframe.
export function CompareOldSite({ websiteUrl }: { websiteUrl: string | null }) {
  if (!websiteUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted text-sm p-8 text-center">
        Sem site próprio para comparar.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ink/80 text-white text-[11px] hover:bg-ink"
      >
        <ExternalLink size={11} /> Se não carregar, abrir aqui
      </a>
      <iframe src={websiteUrl} title="Site antigo" className="w-full h-full border-0" />
    </div>
  );
}
