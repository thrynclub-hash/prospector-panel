"use client";

import { useState } from "react";
import { MessageCircle, Mail, Loader2, Sparkles, Save } from "lucide-react";
import { toWhatsAppLink } from "@/lib/proposal/whatsapp-link";

interface Proposal {
  id: string;
  email_subject: string;
  email_body: string;
  whatsapp_text: string;
  email_sent_at: string | null;
}

interface Suppression {
  opted_out_at: string | null;
}

export function ProposalSection({
  redesignId,
  isPublic,
  phone,
  publicEmail,
  initialProposal,
  suppression,
}: {
  redesignId: string;
  isPublic: boolean;
  phone: string | null;
  publicEmail: string | null;
  initialProposal: Proposal | null;
  suppression: Suppression | null;
}) {
  const [proposal, setProposal] = useState(initialProposal);
  const [emailSubject, setEmailSubject] = useState(initialProposal?.email_subject ?? "");
  const [emailBody, setEmailBody] = useState(initialProposal?.email_body ?? "");
  const [whatsappText, setWhatsappText] = useState(initialProposal?.whatsapp_text ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/redesigns/${redesignId}/proposal`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Geração falhou");
        return;
      }
      setProposal(data.proposal);
      setEmailSubject(data.proposal.email_subject);
      setEmailBody(data.proposal.email_body);
      setWhatsappText(data.proposal.whatsapp_text);
    } catch {
      setError("Erro de conexão. Tenta de novo.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveEdits(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/redesigns/${redesignId}/proposal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSubject, emailBody, whatsappText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro salvando");
        return false;
      }
      setProposal(data.proposal);
      return true;
    } catch {
      setError("Erro de conexão. Tenta de novo.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSend() {
    if (!confirmingSend) {
      setConfirmingSend(true);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const savedOk = await saveEdits();
      if (!savedOk) return;
      const res = await fetch(`/api/redesigns/${redesignId}/proposal/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Envio falhou");
        return;
      }
      setProposal((prev) => (prev ? { ...prev, email_sent_at: new Date().toISOString() } : prev));
    } catch {
      setError("Erro de conexão. Tenta de novo.");
    } finally {
      setSending(false);
      setConfirmingSend(false);
    }
  }

  if (!isPublic) {
    return (
      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display font-bold text-ink mb-2">Proposta</h2>
        <p className="text-sm text-muted">Publique o redesign primeiro pra gerar a proposta.</p>
      </section>
    );
  }

  if (!proposal) {
    return (
      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display font-bold text-ink mb-4">Proposta</h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Gerar proposta
        </button>
        {error && <p className="text-sm text-bad mt-2">{error}</p>}
      </section>
    );
  }

  const emailBlocked = suppression
    ? suppression.opted_out_at
      ? "Este negócio pediu pra não receber contatos automáticos"
      : "Já contatado por e-mail (por você ou outro assinante)"
    : null;

  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h2 className="font-display font-bold text-ink">Proposta</h2>

      <div>
        <label className="block text-sm text-muted mb-1">Assunto do e-mail</label>
        <input
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Corpo do e-mail</label>
        <textarea
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          rows={6}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Texto para WhatsApp</label>
        <textarea
          value={whatsappText}
          onChange={(e) => setWhatsappText(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {error && <p className="text-sm text-bad">{error}</p>}

      <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-border">
        <button
          onClick={saveEdits}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-ink hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar edição
        </button>

        {phone && (
          <a
            href={toWhatsAppLink(phone, whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-good text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <MessageCircle size={14} /> Enviar por WhatsApp
          </a>
        )}

        {publicEmail && (
          <button
            onClick={handleConfirmSend}
            onBlur={() => setConfirmingSend(false)}
            disabled={sending || Boolean(emailBlocked)}
            title={emailBlocked ?? undefined}
            className={
              confirmingSend
                ? "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-bad text-white text-sm font-medium disabled:opacity-50"
                : "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
            }
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {emailBlocked ?? (confirmingSend ? "Confirmar envio?" : "Enviar por e-mail")}
          </button>
        )}

        {!phone && !publicEmail && (
          <p className="text-sm text-muted">Sem WhatsApp nem e-mail disponíveis — copie o texto manualmente.</p>
        )}
      </div>

      {proposal.email_sent_at && <p className="text-sm text-good">E-mail enviado ✓</p>}
    </section>
  );
}
