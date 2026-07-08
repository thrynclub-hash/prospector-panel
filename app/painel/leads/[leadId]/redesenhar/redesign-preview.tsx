"use client";

import { useState } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import { MessageCircle } from "lucide-react";
import type { RedesignContent } from "@/types/redesign-content";
import { toWhatsAppLink } from "@/lib/proposal/whatsapp-link";
import { EditableText, EditableImage } from "./editable-field";

// Estrutura elevada ao padrão da skill redesign-premium (hero com 2 CTAs +
// card de nota flutuante, barra de confiança, serviços clicáveis pro
// WhatsApp, seção de Localização e Contato com mapa+horário, botão WhatsApp
// flutuante, nav simples) -- 02.2-CONTEXT.md.
//
// Tipografia PRÓPRIA deste componente: Playfair Display (headings) + Inter
// (corpo), escolhida via ui-ux-pro-max como par editorial adequado a negócio
// local premium -- NUNCA a identidade "Signal Ledger" do painel (Unbounded/
// Manrope, app/layout.tsx: essa é a marca do PRODUTO, não do negócio do
// lead -- skill redesign-premium regra 3). app/globals.css define
// `h1,h2,h3{font-family:var(--font-display)}` globalmente -- um `style`
// inline em cada heading é a única forma de vencer essa regra sem tocar em
// globals.css (valor inline sempre ganha de uma regra de elemento no CSS
// cascade, mesmo de baixa especificidade).
//
// Editor inline (Fase 02.2, substitui o formulário da Fase 3): quando
// `editable` + `redesignId`, cada campo de `generated` vira contentEditable
// (EditableText) e cada imagem de `photos` vira clicável-pra-trocar
// (EditableImage) -- ver editable-field.tsx. `facts` (nome, endereço,
// telefone, nota, horário) NUNCA é editável aqui -- mesma regra da Fase
// 3/02.1 (snapshot verificado do Places; editar sem controle abriria brecha
// pra "corrigir" um fato pra algo não verificado).
//
// Componente compartilhado por 5 contextos: Comparator (preview privado),
// /compare, /preview, /demo/[slug] (público) -- todos com editable=false
// (default, nenhuma mudança de código neles) -- e /editar, o único que passa
// editable+redesignId.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--rp-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-body", display: "swap" });

const displayFont = { fontFamily: "var(--rp-display)" } as const;

export function RedesignPreview({
  content,
  editable = false,
  redesignId,
}: {
  content: RedesignContent;
  editable?: boolean;
  redesignId?: string;
}) {
  const [generated, setGenerated] = useState(content.generated);
  const [photos, setPhotos] = useState(content.photos);
  const { facts, theme } = content; // read-only sempre -- nunca setState aqui
  const accentColor = theme?.primaryColor ?? null;
  const canEdit = editable && Boolean(redesignId);

  const whatsappBase = facts.phone
    ? toWhatsAppLink(facts.phone, `Olá! Vim pelo site da ${facts.name} e quero saber mais.`)
    : null;

  async function persist(next: { generated?: RedesignContent["generated"]; photos?: RedesignContent["photos"] }) {
    if (!redesignId) return;
    await fetch(`/api/redesigns/${redesignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generated: next.generated ?? generated,
        photos: next.photos ?? photos,
      }),
    }).catch(() => {
      // Falha de rede na autosave -- estado local já refletiu a edição (UX
      // não trava); a próxima edição bem-sucedida reenvia o estado completo
      // mais atual de qualquer forma.
    });
  }

  function saveGenerated(next: RedesignContent["generated"]) {
    setGenerated(next);
    void persist({ generated: next });
  }

  function saveLogo(url: string) {
    const next = { ...photos, logoUrl: url };
    setPhotos(next);
    void persist({ photos: next });
  }

  function savePhotoAt(index: number, url: string) {
    const next = { ...photos, photoUrls: photos.photoUrls.map((u, i) => (i === index ? url : u)) };
    setPhotos(next);
    void persist({ photos: next });
  }

  const heroPhoto = photos.photoUrls[0] ?? null;
  const galleryPhotos = photos.photoUrls.slice(1);
  const hasLocationSection = Boolean(facts.address) || Boolean(whatsappBase);

  return (
    <div
      className={`${playfair.variable} ${inter.variable} relative bg-white text-slate-900`}
      style={{ fontFamily: "var(--rp-body)" }}
    >
      <nav className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          {photos.logoUrl ? (
            <EditableImage
              src={photos.logoUrl}
              alt={facts.name}
              editable={canEdit}
              redesignId={redesignId}
              onUploaded={saveLogo}
              className="h-8 w-8 rounded shrink-0"
            />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
              {facts.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="font-semibold truncate" style={displayFont}>
            {facts.name}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm text-slate-600 shrink-0">
          <a href="#servicos" className="hover:text-slate-900">
            Serviços
          </a>
          {hasLocationSection && (
            <a href="#localizacao" className="hover:text-slate-900">
              Localização
            </a>
          )}
        </div>
        {whatsappBase && (
          <a
            href={whatsappBase}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: accentColor ?? "#0f172a" }}
          >
            Agendar
          </a>
        )}
      </nav>

      <section className="grid md:grid-cols-2 gap-10 px-6 md:px-12 py-12 md:py-20 items-center max-w-6xl mx-auto">
        <div>
          {facts.category && (
            <p className="italic font-medium mb-3" style={{ color: accentColor ?? "#0f172a" }}>
              {facts.category}
            </p>
          )}
          <EditableText
            as="h1"
            editable={canEdit}
            value={generated.heroHeadline}
            onSave={(v) => saveGenerated({ ...generated, heroHeadline: v })}
            className="text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={displayFont}
          />
          <EditableText
            as="p"
            editable={canEdit}
            value={generated.heroSubheadline}
            onSave={(v) => saveGenerated({ ...generated, heroSubheadline: v })}
            className="text-lg text-slate-600 mb-8"
          />
          <div className="flex flex-wrap gap-3">
            {whatsappBase && (
              <a
                href={whatsappBase}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl text-white font-medium"
                style={{ backgroundColor: accentColor ?? "#0f172a" }}
              >
                Falar no WhatsApp
              </a>
            )}
            <a
              href="#servicos"
              className="px-6 py-3 rounded-xl border font-medium border-slate-300 text-slate-700"
              style={accentColor ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              Ver serviços
            </a>
          </div>
        </div>

        <div className="relative">
          {heroPhoto ? (
            <EditableImage
              src={heroPhoto}
              alt={facts.name}
              editable={canEdit}
              redesignId={redesignId}
              onUploaded={(url) => savePhotoAt(0, url)}
              className="w-full h-72 md:h-96 rounded-2xl"
            />
          ) : (
            <div className="w-full h-72 md:h-96 rounded-2xl bg-slate-100 flex items-center justify-center text-6xl font-bold text-slate-300">
              {facts.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          {facts.rating && (
            <div className="absolute -bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-3 text-sm">
              <span className="font-bold">⭐ {facts.rating}</span>
              {facts.userRatingCount ? <span className="text-slate-500"> · {facts.userRatingCount} avaliações</span> : null}
            </div>
          )}
        </div>
      </section>

      {(facts.rating || facts.category || facts.address) && (
        <div className="border-y border-slate-100 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap gap-x-8 gap-y-2 justify-center text-sm text-slate-600">
            {facts.rating && (
              <span>
                ⭐ {facts.rating} no Google{facts.userRatingCount ? ` (${facts.userRatingCount})` : ""}
              </span>
            )}
            {facts.category && <span>{facts.category}</span>}
            {facts.address && <span>{facts.address}</span>}
          </div>
        </div>
      )}

      <section id="servicos" className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center" style={displayFont}>
          Serviços
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generated.services.map((service, i) => {
            const serviceLink = facts.phone
              ? toWhatsAppLink(facts.phone, `Olá! Vim pelo site e quero saber sobre ${service.title}`)
              : null;

            const card = (
              <div className="h-full bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <EditableText
                  as="p"
                  editable={canEdit}
                  value={service.title}
                  onSave={(v) =>
                    saveGenerated({
                      ...generated,
                      services: generated.services.map((s, si) => (si === i ? { ...s, title: v } : s)),
                    })
                  }
                  className="font-bold mb-2"
                />
                <EditableText
                  as="p"
                  editable={canEdit}
                  value={service.description}
                  onSave={(v) =>
                    saveGenerated({
                      ...generated,
                      services: generated.services.map((s, si) => (si === i ? { ...s, description: v } : s)),
                    })
                  }
                  className="text-sm text-slate-600"
                  multiline
                />
              </div>
            );

            // Card só vira link clicável no modo leitura -- no modo edição o
            // clique precisa cair no contentEditable, não navegar pro WhatsApp.
            return serviceLink && !canEdit ? (
              <a key={i} href={serviceLink} target="_blank" rel="noopener noreferrer" className="block">
                {card}
              </a>
            ) : (
              <div key={i}>{card}</div>
            );
          })}
        </div>
      </section>

      <section className="px-6 md:px-12 py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4" style={displayFont}>
            Sobre
          </h2>
          <EditableText
            as="p"
            editable={canEdit}
            value={generated.aboutCopy}
            onSave={(v) => saveGenerated({ ...generated, aboutCopy: v })}
            className="text-slate-600 leading-relaxed"
            multiline
          />
        </div>
      </section>

      {galleryPhotos.length > 0 && (
        <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center" style={displayFont}>
            Fotos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryPhotos.map((url, i) => (
              <EditableImage
                key={url}
                src={url}
                alt={facts.name}
                editable={canEdit}
                redesignId={redesignId}
                onUploaded={(newUrl) => savePhotoAt(i + 1, newUrl)}
                className="w-full h-40 rounded-xl"
              />
            ))}
          </div>
        </section>
      )}

      {hasLocationSection && (
        <section id="localizacao" className="px-6 md:px-12 py-16 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-6" style={displayFont}>
                Localização e Contato
              </h2>
              {facts.address && <p className="mb-2 text-slate-300">{facts.address}</p>}
              {facts.phone && <p className="mb-4 text-slate-300">{facts.phone}</p>}
              {facts.openingHours && facts.openingHours.length > 0 && (
                <ul className="mb-6 text-sm text-slate-400 space-y-1">
                  {facts.openingHours.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {whatsappBase && (
                <a
                  href={whatsappBase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-xl text-white font-medium"
                  style={{ backgroundColor: accentColor ?? "#22c55e" }}
                >
                  Falar no WhatsApp
                </a>
              )}
            </div>
            {facts.address && (
              <iframe
                title={`Mapa -- ${facts.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(facts.address)}&output=embed`}
                className="w-full h-72 rounded-2xl border-0"
                loading="lazy"
              />
            )}
          </div>
        </section>
      )}

      {whatsappBase && (
        <a
          href={whatsappBase}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-20 h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle size={26} />
        </a>
      )}
    </div>
  );
}
