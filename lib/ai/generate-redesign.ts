import { generateObject } from "ai";
import { z } from "zod";

// Modelo via Vercel AI Gateway -- string direta, sem SDK de provider separado
// (STACK.md). Tier "flash": tarefa de conteúdo estruturado de um tiro só, não
// exige modelo flagship. Exige AI_GATEWAY_API_KEY em dev local (na Vercel em
// produção funciona via OIDC automático, sem variável extra).
const MODEL = "google/gemini-2.5-flash";

const GeneratedSchema = z.object({
  heroHeadline: z.string().describe("Título principal do hero, 1 linha, forte e específico ao negócio"),
  heroSubheadline: z.string().describe("Subtítulo do hero, 1 frase, promessa clara"),
  aboutCopy: z.string().describe("Parágrafo 'Sobre', reescrito com copy melhor a partir só do que foi fornecido"),
  services: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .min(1)
    .max(6)
    .describe("Serviços/áreas de atuação -- só os que foram fornecidos, com copy melhorada"),
});

export interface RedesignCopyInput {
  name: string;
  category: string | null;
  address: string | null;
  rating: number | null;
  userRatingCount: number | null;
  badSiteReason: string;
  knownServices?: string[];
}

// REDESENHAR-02: o prompt é o mecanismo de aplicação da regra "nenhum fato
// inventado" (skill redesign-premium, regra 1) -- a lista de proibições é
// explícita porque um modelo sem essa restrição preenche lacunas plausíveis
// por padrão (Pitfall 2).
export async function generateRedesignCopy(input: RedesignCopyInput) {
  const { object } = await generateObject({
    model: MODEL,
    schema: GeneratedSchema,
    prompt: `Você está reescrevendo o conteúdo de marketing de uma nova versão do site de um negócio real, a partir SÓ dos dados abaixo. Não é um site novo -- é uma versão melhorada da mesma verdade que o negócio já comunica.

DADOS REAIS (única fonte permitida):
- Nome: ${input.name}
- Categoria: ${input.category ?? "não informada"}
- Endereço: ${input.address ?? "não informado"}
- Nota no Google: ${input.rating ?? "não informada"}${input.userRatingCount ? ` (${input.userRatingCount} avaliações)` : ""}
- Serviços conhecidos: ${input.knownServices?.join(", ") || "não informados -- infira no máximo 3 serviços plausíveis e genéricos para a categoria, sem detalhar preço/duração/inclusões específicas"}
- Motivo do site atual ser fraco: ${input.badSiteReason}

REGRAS INVIOLÁVEIS:
1. NUNCA invente horário de funcionamento, preço, certificação/prêmio, tempo de mercado ou depoimento de cliente. Se o dado não está acima, não mencione.
2. O texto deve ser mais forte que um site genérico -- títulos específicos ao negócio, não templates ("Bem-vindo ao nosso site").
3. Tom profissional e direto, adequado à categoria do negócio.
4. Não mencione o "site antigo" ou "site ruim" no copy -- isso é uso interno, não aparece na página pública.`,
  });

  return object;
}
