import type { MetadataRoute } from "next";

// PUBLICAR-03: nenhuma página de demo pode ser indexada -- ver também o
// meta robots noindex em app/demo/[slug]/page.tsx (defesa em duas camadas,
// já que alguns crawlers ignoram robots.txt mas respeitam meta tags, e
// vice-versa).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/demo/",
    },
  };
}
