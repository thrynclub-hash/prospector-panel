import type { RedesignContent } from "@/types/redesign-content";

// Preview do redesign gerado. Quando o site original tem uma cor de marca
// extraída (REDESENHAR-05, content.theme.primaryColor), ela é usada como
// destaque (fundo do hero, títulos) em vez do template neutro -- que é a
// marca do PAINEL, não do negócio do lead (skill redesign-premium regra 3).
// Sem cor extraída (site não declarou theme-color, ou não tem site próprio),
// cai exatamente no template neutro de sempre. Componente compartilhado pelo
// preview privado e por app/demo/[slug] -- uma única fonte de renderização.
export function RedesignPreview({ content }: { content: RedesignContent }) {
  const accentColor = content.theme?.primaryColor ?? null;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-white text-slate-900">
      <div
        className={accentColor ? "px-8 py-16 text-center text-white" : "px-8 py-16 text-center bg-slate-900 text-white"}
        style={accentColor ? { backgroundColor: accentColor } : undefined}
      >
        {content.photos.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.photos.logoUrl} alt={content.facts.name} className="h-12 mx-auto mb-6 rounded" />
        ) : (
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold">
            {content.facts.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <h1 className="text-3xl font-bold mb-3">{content.generated.heroHeadline}</h1>
        <p className={accentColor ? "opacity-90 max-w-lg mx-auto" : "text-slate-300 max-w-lg mx-auto"}>
          {content.generated.heroSubheadline}
        </p>
      </div>

      {content.facts.rating && (
        <div className="px-8 py-4 text-center border-b border-slate-100 text-sm text-slate-600">
          ⭐ {content.facts.rating} no Google{content.facts.userRatingCount ? ` · ${content.facts.userRatingCount} avaliações` : ""}
        </div>
      )}

      {content.photos.photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-1 p-1">
          {content.photos.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt={content.facts.name} className="w-full h-32 object-cover" />
          ))}
        </div>
      )}

      <div className="px-8 py-10">
        <h2 className="text-xl font-bold mb-3" style={accentColor ? { color: accentColor } : undefined}>
          Sobre
        </h2>
        <p className="text-slate-600 leading-relaxed">{content.generated.aboutCopy}</p>
      </div>

      <div className="px-8 py-10 bg-slate-50">
        <h2 className="text-xl font-bold mb-4" style={accentColor ? { color: accentColor } : undefined}>
          Serviços
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.generated.services.map((service) => (
            <div key={service.title} className="bg-white rounded-xl p-4 border border-slate-100">
              <p className="font-bold mb-1">{service.title}</p>
              <p className="text-sm text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {content.facts.address && (
        <div className="px-8 py-6 text-sm text-slate-500 border-t border-slate-100">{content.facts.address}</div>
      )}
    </div>
  );
}
