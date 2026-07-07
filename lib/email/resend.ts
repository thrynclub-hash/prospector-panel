import { Resend } from "resend";

export async function sendMagicLinkEmail({ to, magicLink }: { to: string; magicLink: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Hunter of Bad Pages <acesso@toqy.com.br>",
    to,
    subject: "Seu acesso ao Hunter of Bad Pages está pronto",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 22px; color: #17141a;">Bem-vindo ao Hunter of Bad Pages 🎯</h1>
        <p style="color: #6b6560; line-height: 1.6;">
          Sua compra foi confirmada. Clique no botão abaixo pra entrar no painel — o link expira em 1 hora.
        </p>
        <a href="${magicLink}" style="display: inline-block; background: #ff4d6d; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Entrar no painel
        </a>
        <p style="color: #6b6560; font-size: 13px; margin-top: 32px;">
          Se você não fez essa compra, ignore este e-mail.
        </p>
      </div>
    `,
  });
}
