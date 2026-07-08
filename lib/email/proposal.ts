import { Resend } from "resend";

// 05-RESEARCH.md Pitfall 4 / Architecture Patterns §7: NUNCA reusar
// sendMagicLinkEmail pra e-mail de outreach frio -- identidade de remetente
// distinta ("propostas@" em vez de "acesso@") e List-Unsubscribe
// obrigatório, já que este e-mail não é transacional. Client
// function-scoped (não singleton de módulo) -- mesma regra de
// lib/email/resend.ts (ARCHITECTURE.md §0: Resend já derrubou um build por
// isso).
export async function sendProposalEmail({
  to,
  subject,
  body,
  unsubscribeUrl,
}: {
  to: string;
  subject: string;
  body: string;
  unsubscribeUrl: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Hunter of Bad Pages <propostas@toqy.com.br>",
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; white-space: pre-wrap; color: #17141a; line-height: 1.6;">
        ${body}
        <p style="color: #6b6560; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e0da; padding-top: 16px;">
          Não quer mais receber contatos como este?
          <a href="${unsubscribeUrl}" style="color: #6b6560;">Clique aqui</a>.
        </p>
      </div>
    `,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}
