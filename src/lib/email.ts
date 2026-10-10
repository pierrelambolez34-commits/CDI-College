/**
 * Envoi des e-mails.
 *
 * - En production : par le serveur SMTP indiqué dans SMTP_URL
 *   (par exemple smtps://utilisateur:motdepasse@smtp.exemple.fr:465).
 * - Sans SMTP_URL (développement) : l'e-mail est affiché dans le terminal,
 *   ce qui permet de cliquer sur les liens sans configurer de messagerie.
 */
import nodemailer from "nodemailer";

export type Email = { a: string | string[]; sujet: string; texte: string; html: string };

/** Derniers e-mails « envoyés » sans SMTP (utile pour les tests). */
export const boiteDeDev: Email[] = [];

let transport: nodemailer.Transporter | null = null;

export async function envoyerEmail(e: Email) {
  const url = process.env.SMTP_URL;
  if (!url) {
    boiteDeDev.push(e);
    if (boiteDeDev.length > 50) boiteDeDev.shift();
    if (process.env.NODE_ENV !== "test") {
      console.log(`\n──── E-mail (non envoyé : SMTP_URL absent) ────\nÀ : ${[e.a].flat().join(", ")}\nObjet : ${e.sujet}\n\n${e.texte}\n────────────────────────────────────────────────\n`);
    }
    return;
  }
  transport ??= nodemailer.createTransport(url);
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? "Passages CDI <no-reply@passages-cdi.fr>",
    to: e.a, subject: e.sujet, text: e.texte, html: e.html,
  });
}

/** Adresse publique de l'application, pour les liens des e-mails. */
export function urlApplication(chemin = "") {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "") + chemin;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Mise en page commune des e-mails : un titre, quelques paragraphes, un bouton. */
export function gabarit(titre: string, paragraphes: string[], bouton?: { texte: string; lien: string }) {
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#F3F5F4;font-family:Segoe UI,Arial,sans-serif;color:#16252A">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="font-weight:700;font-size:18px;margin:0 0 18px">Passages CDI</p>
<div style="background:#fff;border:1px solid #D5DCD9;border-radius:10px;padding:24px">
<h1 style="font-size:20px;margin:0 0 14px">${esc(titre)}</h1>
${paragraphes.map((p) => `<p style="margin:0 0 12px;line-height:1.5">${esc(p)}</p>`).join("")}
${bouton ? `<p style="margin:20px 0 8px"><a href="${esc(bouton.lien)}" style="display:inline-block;background:#1F4E8C;color:#fff;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px">${esc(bouton.texte)}</a></p>
<p style="margin:0;font-size:12px;color:#5B6B6F">Si le bouton ne fonctionne pas, copiez ce lien : ${esc(bouton.lien)}</p>` : ""}
</div></div></body></html>`;
  const texte = [titre, "", ...paragraphes, ...(bouton ? ["", `${bouton.texte} : ${bouton.lien}`] : [])].join("\n");
  return { html, texte };
}
