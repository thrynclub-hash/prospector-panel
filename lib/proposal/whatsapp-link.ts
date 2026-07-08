// PROPOSTA-02: wa.me precisa do número só com dígitos (sem "+", espaços ou
// hífens) -- o dado vem de content.facts.phone (internationalPhoneNumber do
// Places, ex. "+55 11 99999-9999", populado desde a Plan 05-01).
export function toWhatsAppLink(internationalPhone: string, text: string): string {
  const digitsOnly = internationalPhone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;
}
