import { generateObject } from "ai";
import { z } from "zod";

// Modelo via Vercel AI Gateway -- mesma string/tier de generate-redesign.ts.
// Exige AI_GATEWAY_API_KEY em dev local (produção usa OIDC automático).
const MODEL = "google/gemini-2.5-flash";

const ProposalSchema = z.object({
  emailSubject: z.string().describe("Assunto específico ao negócio, curto, sem cara de marketing/spam"),
  emailBody: z.string().describe("Corpo do e-mail, 120-180 palavras, sem preço, tom de oportunidade construtiva"),
  whatsappText: z.string().describe("Versão curta e mais informal do mesmo conteúdo-base, adequada a uma mensagem de WhatsApp"),
});

export interface ProposalCopyInput {
  name: string;
  address: string | null;
  rating: number | null;
  userRatingCount: number | null;
  problems: string[];
  demoUrl: string;
}

// PROPOSTA-01: mesmo mecanismo de "REGRAS INVIOLÁVEIS" de generate-redesign.ts
// -- sem preço, sem checklist genérico, tom de oportunidade (nunca "seu site
// está ruim"). Estrutura segue a skill proposta-email (rapport real >
// defeito com delicadeza > entrega > CTA leve), já resumida em CONTEXT.md.
export async function generateProposalCopy(input: ProposalCopyInput) {
  const { object } = await generateObject({
    model: MODEL,
    schema: ProposalSchema,
    prompt: `Você está escrevendo uma proposta comercial fria para o dono de um negócio real, a partir SÓ dos dados abaixo.

DADOS REAIS (única fonte permitida):
- Nome do negócio: ${input.name}
- Endereço: ${input.address ?? "não informado"}
- Nota no Google: ${input.rating ?? "não informada"}${input.userRatingCount ? ` (${input.userRatingCount} avaliações)` : ""}
- Problema(s) identificado(s) neste site específico: ${input.problems.join("; ")}
- Link da versão nova já pronta e publicada: ${input.demoUrl}

ESTRUTURA OBRIGATÓRIA (skill proposta-email):
1. Rapport real: abra citando a nota/quantidade de avaliações do Google (só se disponíveis) -- elogio específico e verificável, nunca genérico.
2. Problema com delicadeza: mencione APENAS os problemas listados acima, enquadrados como oportunidade de melhoria ("percebi que..."), nunca como defeito ("seu site está ruim").
3. Entrega como argumento: "preparei uma nova versão, já no ar" + o link. A entrega já pronta é o argumento, não um orçamento abstrato.
4. CTA leve: peça só que abram o link e digam o que acharam. Sem urgência artificial, sem "vagas limitadas".

REGRAS INVIOLÁVEIS:
1. NUNCA mencione preço, orçamento ou valor -- em nenhuma das duas versões.
2. NUNCA use um checklist fixo de problemas -- cite só os problemas informados acima, com as palavras deles.
3. NUNCA chame o site atual de "ruim", "péssimo" ou similar -- tom de oportunidade construtiva.
4. emailBody: 120-180 palavras. whatsappText: mais curto e informal, mesmo conteúdo-base, sem formatação de e-mail (sem "Prezado(a)", sem assinatura formal).
5. emailSubject: específico ao negócio, sem cara de marketing/spam.`,
  });

  return object;
}
