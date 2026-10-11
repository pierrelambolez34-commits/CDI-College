import Link from "next/link";
import { lireEmailsTest, smtpConfigure } from "@/lib/email";
import { superAdmin } from "@/lib/session";
import { actionVider } from "./actions";
import EnTete from "@/components/EnTete";

export const metadata = { title: "E-mails de test" };
export const dynamic = "force-dynamic";

/** Transforme les adresses http(s) d'un texte en liens cliquables. */
function AvecLiens({ texte }: { texte: string }) {
  const morceaux = texte.split(/(https?:\/\/\S+)/g);
  return <>{morceaux.map((m, i) => (/^https?:\/\//.test(m) ? <a key={i} href={m}>{m}</a> : m))}</>;
}

/** Boîte de réception du mode test : les e-mails que l'application aurait envoyés. */
export default async function EmailsTest() {
  await superAdmin();
  const emails = lireEmailsTest();
  return (
    <>
      <main className="wrap">
        <EnTete sur="Super-administrateur" icone="document" titre="E-mails de test" intro="Les e-mails que l'application aurait envoyés, avec leurs liens cliquables.">
          {emails.length > 0 && <form action={actionVider}><button className="btn">Vider la boîte</button></form>}
        </EnTete>
        {smtpConfigure()
          ? <div className="alert ok" style={{ marginTop: 0 }}>Un serveur d&apos;envoi est configuré : les e-mails partent vraiment. Cette page ne montre que ceux envoyés avant sa mise en place.</div>
          : <div className="alert warn" style={{ marginTop: 0 }}>Mode test : aucun e-mail n&apos;est réellement envoyé. Ils arrivent ici à la place. Ouvrez les liens d&apos;invitation dans une <b>fenêtre de navigation privée</b>, sinon vous serez déconnecté de ce compte.</div>}
        {emails.length === 0 ? (
          <div className="panel empty-state">Aucun e-mail pour l&apos;instant. Faites une demande de création de collège depuis l&apos;écran de connexion : l&apos;e-mail qui vous est destiné apparaîtra ici.</div>
        ) : emails.map((e, i) => (
          <article key={i} className="panel" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 17 }}>{e.sujet}</h2>
              <span className="muted small">{new Date(e.date).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <span className="small"><span className="muted">À :</span> {[e.a].flat().join(", ")}</span>
            <div style={{ whiteSpace: "pre-wrap", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, fontSize: 14, overflowWrap: "anywhere" }}>
              <AvecLiens texte={e.texte} />
            </div>
          </article>
        ))}
      </main>
    </>
  );
}
