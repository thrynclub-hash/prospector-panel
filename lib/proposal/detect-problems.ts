// PROPOSTA-01 / CONTEXT.md: "citar só os problemas que se aplicam a esse
// lead específico... nunca um checklist fixo genérico" -- 05-RESEARCH.md
// Pitfall 6 alerta que reusar o badSiteReason de generate-redesign.ts (duas
// strings fixas) produziria o mesmo texto pra leads com sinais bem
// diferentes (PageSpeed 12 vs 48). Função pura, não uma chamada de IA --
// mesmo racional de generate-redesign.ts: só o que é verificável entra no
// prompt de geração.
export interface LeadForProblemDetection {
  hasOwnWebsite: boolean;
  pagespeedScore: number | null;
}

export function detectSiteProblems(lead: LeadForProblemDetection): string[] {
  if (!lead.hasOwnWebsite) {
    return ["o negócio ainda não tem um site próprio"];
  }

  const problems: string[] = [];
  if (lead.pagespeedScore !== null && lead.pagespeedScore < 50) {
    problems.push(`o site atual tem desempenho baixo no Google PageSpeed (${lead.pagespeedScore}/100 no mobile)`);
  }

  return problems.length > 0 ? problems : ["o site atual pode ser modernizado visualmente"];
}
