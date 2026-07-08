"use client";

import { useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

// Camada de edição inline compartilhada por RedesignPreview (Fase 02.2) --
// adaptação do mecanismo do plugin original (references/editor-visual.md:
// contenteditable + input file escondido, botão único de "Exportar" no
// final) pro modelo React/Next.js deste projeto: cada campo salva sozinho
// (onBlur / upload) via as rotas que já existem (PATCH /api/redesigns/[id],
// POST /api/redesigns/[id]/photo) -- não há "modo exportação", o dado já
// fica persistido no banco a cada edição, não num arquivo baixado.

type EditableTag = "h1" | "h2" | "h3" | "p" | "span";

export function EditableText({
  value,
  editable,
  onSave,
  as: Tag = "span",
  className,
  style,
  multiline = false,
}: {
  value: string;
  editable: boolean;
  onSave: (next: string) => void;
  as?: EditableTag;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}) {
  const mergedStyle: React.CSSProperties = { ...style, whiteSpace: multiline ? "pre-wrap" : undefined };

  if (!editable) {
    return <Tag className={className} style={mergedStyle}>{value}</Tag>;
  }

  return (
    <Tag
      className={`${className ?? ""} cursor-text rounded outline-none hover:ring-2 hover:ring-blue-400/70 focus:ring-2 focus:ring-blue-500`}
      style={mergedStyle}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(e) => {
        // Título/label de serviço é 1 linha só -- Enter não deve quebrar em
        // parágrafo. Campos multiline (Sobre, descrição de serviço) permitem
        // Enter normalmente.
        if (e.key === "Enter" && !multiline) e.preventDefault();
      }}
      onBlur={(e) => {
        // innerText (não textContent) preserva quebras de linha visuais
        // corretamente em campos multiline.
        const next = e.currentTarget.innerText.trim();
        if (next && next !== value) onSave(next);
      }}
    >
      {value}
    </Tag>
  );
}

export function EditableImage({
  src,
  alt,
  editable,
  className,
  redesignId,
  onUploaded,
}: {
  src: string;
  alt: string;
  editable: boolean;
  /** Classes de tamanho/arredondamento (ex: "w-full h-72 rounded-2xl") -- object-fit é sempre cover, aplicado internamente. */
  className?: string;
  redesignId?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editable || !redesignId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`${className ?? ""} object-cover`} />;
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/redesigns/${redesignId}/photo`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) onUploaded(data.url);
    } catch {
      // Upload falhou -- imagem atual permanece, usuário pode clicar de novo.
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`relative block overflow-hidden border-0 bg-transparent p-0 group ${className ?? ""}`}
      aria-label="Trocar imagem"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100">
        {uploading ? <Loader2 className="animate-spin text-white" size={20} /> : <Pencil className="text-white" size={20} />}
      </span>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </button>
  );
}
