/**
 * Envoi des e-mails.
 *
 * - Avec SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (ou une seule variable SMTP_URL) : envoi réel par ce serveur.
 * - Sans réglage SMTP (mode test) : rien n'est envoyé. L'e-mail est affiché dans le terminal et rangé
 *   dans le fichier .emails-test.json, que le super-administrateur consulte sur /admin/emails.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

export type Email = { a: string | string[]; sujet: string; texte: string; html: string };
export type EmailTest = Email & { date: string };

/** Derniers e-mails « envoyés » sans SMTP, en mémoire (utilisé par les tests automatiques). */
export const boiteDeDev: Email[] = [];

const FICHIER_TEST = path.join(process.cwd(), ".emails-test.json");
const MAX_TEST = 50;

export const smtpConfigure = () => Boolean(process.env.SMTP_URL || process.env.SMTP_HOST);

/** E-mails du mode test, du plus récent au plus ancien. Le fichier survit aux redémarrages. */
export function lireEmailsTest(): EmailTest[] {
  try {
    return existsSync(FICHIER_TEST) ? (JSON.parse(readFileSync(FICHIER_TEST, "utf8")) as EmailTest[]) : [];
  } catch {
    return [];
  }
}

function rangerEmailTest(e: Email) {
  const liste = [{ ...e, date: new Date().toISOString() }, ...lireEmailsTest()].slice(0, MAX_TEST);
  try { writeFileSync(FICHIER_TEST, JSON.stringify(liste, null, 2)); } catch (err) { console.error("E-mail de test non enregistré :", err); }
}

export function viderEmailsTest() {
  try { writeFileSync(FICHIER_TEST, "[]"); } catch { /* rien à vider */ }
}

let transport: nodemailer.Transporter | null = null;

export async function envoyerEmail(e: Email) {
  if (!smtpConfigure()) {
    boiteDeDev.push(e);
    if (boiteDeDev.length > MAX_TEST) boiteDeDev.shift();
    if (process.env.NODE_ENV !== "test") {
      rangerEmailTest(e);
      console.log(`\n──── E-mail de test (non envoyé : aucun serveur SMTP configuré) ────\nÀ : ${[e.a].flat().join(", ")}\nObjet : ${e.sujet}\n\n${e.texte}\nÀ retrouver aussi sur ${urlApplication("/admin/emails")}\n───────────────────────────────────────────────────────\n`);
    }
    return;
  }
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transport = process.env.SMTP_URL
      ? nodemailer.createTransport(process.env.SMTP_URL)
      : nodemailer.createTransport({
          host: process.env.SMTP_HOST, port, secure: port === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
  }
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
