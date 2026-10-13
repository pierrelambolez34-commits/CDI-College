import Link from "next/link";
import { calculerStats, lireFiltres, type Filtres } from "@/lib/data/stats";
import { utilisateurCollege } from "@/lib/session";
import { JOURS, formatMinute } from "@/lib/texte";
import Infobulles from "./Infobulles";
import FiltreListe from "./FiltreListe";
import { nomsGroupes } from "@/lib/data/groupes";
import { listerProjets } from "@/lib/data/projets";
import Icone from "@/components/Icone";
import EnTete, { TeteCarte } from "@/components/EnTete";

export const metadata = { title: "Statistiques" };
export const dynamic = "force-dynamic";

const couleur = (ordre: number) => `var(--s${Math.min(Math.max(ordre, 1), 8)})`;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const nb = (n: number) => n.toLocaleString("fr-FR");
const style = (o: Record<string, string | number>) => o as React.CSSProperties;

export default async function Statistiques({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await utilisateurCollege();
  const f = lireFiltres(await searchParams);
  const [s, groupes, projets] = await Promise.all([calculerStats(u.collegeId, f), nomsGroupes(u.collegeId), listerProjets(u.collegeId)]);

  const lien = (changement: Partial<Filtres>) => {
    const n = { ...f, ...changement };
    const q = new URLSearchParams();
    if (n.periode !== "annee") q.set("periode", n.periode);
    if (n.niveau !== "tous") q.set("niveau", n.niveau);
    if (n.type !== "tous") q.set("type", n.type);
    if (n.groupe) q.set("groupe", n.groupe);
    if (n.projet) q.set("projet", n.projet);
    return `?${q}`;
  };
  const filtre = (titre: string, cle: keyof Filtres, options: [string, string][]) => (
    <div><span className="lab">{titre}</span><div className="seg">
      {options.map(([v, l]) => <Link key={v} href={lien({ [cle]: v })} scroll={false} className={f[cle] === v ? "on" : ""} aria-current={f[cle] === v ? "true" : undefined}>{l}</Link>)}
    </div></div>
  );

  const motifsAffiches = s.motifs.filter((m) => m.actif || s.parMotif[m.id]);
  const compte = motifsAffiches.map((m) => ({ m, n: s.parMotif[m.id] ?? 0 })).sort((a, b) => b.n - a.n);
  const maxMotif = Math.max(1, ...compte.map((x) => x.n));
  const premier = compte[0];

  // Carte de chaleur
  const lignesPlages = [...new Map(s.chaleur.map((c) => [`${c.debut}-${c.fin}`, c])).values()].sort((a, b) => a.debut - b.debut);
  const maxMoy = Math.max(1, ...s.chaleur.map((c) => c.moyenne));
  const pas = (v: number) => Math.min(7, 1 + Math.floor((v / maxMoy) * 6.999));

  // Semaines
  const maxSem = Math.max(1, ...s.semaines.map((w) => w.n));
  const plafond = maxSem <= 50 ? Math.ceil(maxSem / 10) * 10 : Math.ceil(maxSem / 100) * 100;
  const dateCourte = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const exportHref = `/statistiques/export${lien({})}`;

  return (
    <main className="wrap">
      <EnTete sur={s.college.nom} icone="graphique" titre="Statistiques du CDI"
        intro={`Depuis le ${new Date(`${s.depuis}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}. Survolez les graphiques pour voir le détail.`}>
        <a className="btn" href={exportHref}><Icone nom="import" taille={18} /> Exporter en CSV</a>
      </EnTete>

      <div className="filters">
        {filtre("Période", "periode", [["annee", "Année scolaire"], ["30", "30 derniers jours"], ["7", "Cette semaine"]])}
        {filtre("Niveau", "niveau", [["tous", "Tous"], ["6e", "6e"], ["5e", "5e"], ["4e", "4e"], ["3e", "3e"]])}
        {filtre("Type de plage", "type", [["tous", "Toutes"], ...s.types.map((t) => [t, t === "Pause méridienne" ? "Midi" : t === "Récréation" ? "Récré" : t] as [string, string])])}
        {groupes.length > 0 && (
          <FiltreListe id="filtre-groupe" titre="Groupe" valeur={f.groupe ?? ""} options={[
            { valeur: "", label: "Tous les élèves", href: lien({ groupe: undefined }) },
            ...groupes.map((g) => ({ valeur: g.id, label: g.nom, href: lien({ groupe: g.id }) })),
          ]} />
        )}
        {projets.length > 0 && (
          <FiltreListe id="filtre-projet" titre="Projet" valeur={f.projet ?? ""} options={[
            { valeur: "", label: "Tous les passages", href: lien({ projet: undefined }) },
            ...projets.map((p) => ({ valeur: p.id, label: p.nom, href: lien({ projet: p.id }) })),
          ]} />
        )}
      </div>

      {s.passages === 0 ? (
        <div className="panel empty-state">Aucun passage sur cette période avec ces filtres. Les statistiques apparaîtront dès les premières saisies.</div>
      ) : <>
        <div className="kpis">
          <div className="kpi"><span className="lab">Passages</span><span className="val">{nb(s.passages)}</span><span className="sub">sur {s.jours} jour{s.jours > 1 ? "s" : ""} d&apos;ouverture</span></div>
          <div className="kpi"><span className="lab">Passages par jour</span><span className="val">{s.jours ? Math.round(s.passages / s.jours) : 0}</span><span className="sub">en moyenne</span></div>
          <div className="kpi"><span className="lab">Élèves venus au moins une fois</span><span className="val">{pct(s.elevesVenus, s.population)} %</span><span className="sub">{s.elevesVenus} sur {s.population} élèves</span></div>
          <div className="kpi"><span className="lab">Premier motif</span><span className="val txt">{premier?.m.libelle ?? "—"}</span><span className="sub">{premier ? `${pct(premier.n, s.passages)} % des passages` : ""}</span></div>
        </div>

        <div className="cards">
          <section className="card">
            <TeteCarte icone="graphique" titre="Pourquoi viennent-ils ?" sous="Nombre de passages par motif" />
            <div className="hbars">
              {compte.map(({ m, n }) => (
                <div key={m.id} className="hb" tabIndex={0} data-tip={`${m.libelle}\n${nb(n)} passages · ${pct(n, s.passages)} %`}>
                  <span className="l">{m.libelle}{!m.actif && <span className="muted"> (retiré)</span>}</span>
                  <span className="tr"><span className="f" style={style({ "--c": couleur(m.ordre), width: `${(n / maxMotif) * 100}%` })} /></span>
                  <span className="v"><b>{nb(n)}</b><span>{pct(n, s.passages)} %</span></span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <TeteCarte icone="horloge" couleur="var(--pep)" titre="Motifs selon le moment" sous="Répartition des motifs pour chaque type de plage, en %" />
            <div className="legend">{motifsAffiches.filter((m) => m.actif).map((m) => <span key={m.id} style={style({ "--c": couleur(m.ordre) })}><i />{m.libelle}</span>)}</div>
            <div className="stacks">
              {[...s.types, ...new Set(s.parTypeMotif.map((r) => r.type_plage).filter((t) => !s.types.includes(t)))].map((t) => {
                const lignes = s.parTypeMotif.filter((r) => r.type_plage === t);
                const total = lignes.reduce((a, r) => a + r.n, 0);
                if (!total) return null;
                return (
                  <div className="st" key={t}>
                    <div className="l"><b>{t}</b><span>{nb(total)} passages</span></div>
                    <div className="bar100">
                      {motifsAffiches.map((m) => {
                        const n = lignes.find((r) => r.motif_id === m.id)?.n ?? 0;
                        return n ? <div key={m.id} tabIndex={0} style={style({ "--c": couleur(m.ordre), flex: n })} data-tip={`${t} · ${m.libelle}\n${pct(n, total)} % · ${nb(n)} passages`} /> : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card wide">
            <TeteCarte icone="calendrier" couleur="var(--mint)" titre="Quand le CDI est-il le plus fréquenté ?" sous="Nombre moyen d'élèves par séance, selon le jour et la plage horaire" />
            <div className="hm-wrap"><div className="hm">
              <div />
              {JOURS.map((j) => <div key={j} className="ch">{j.slice(0, 3)}.</div>)}
              {lignesPlages.map((l) => (
                <Ligne key={`${l.debut}`} l={l} s={s} f={f} pas={pas} />
              ))}
            </div></div>
            <div className="scale"><span>Peu</span><span className="ramp">{[1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} style={style({ "--c": `var(--q${i})` })} />)}</span><span>Beaucoup (jusqu&apos;à {Math.round(maxMoy)} élèves)</span></div>
          </section>

          <section className="card">
            <TeteCarte icone="graphique" couleur="var(--sun)" titre="Évolution par semaine" sous="Nombre de passages par semaine" />
            <div className="colchart">
              <div className="yax">{[0, plafond / 2, plafond].map((t) => <span key={t} style={{ bottom: `${(t / plafond) * 100}%` }}>{nb(t)}</span>)}</div>
              <div className="plot">
                <span className="gl" style={{ bottom: "50%" }} /><span className="gl" style={{ bottom: "100%" }} />
                {s.semaines.slice(-12).map((w) => (
                  <div key={w.semaine} className="colw" tabIndex={0} style={style({ "--h": `${(w.n / plafond) * 100}%` })} data-tip={`Semaine du ${dateCourte(w.semaine)}\n${nb(w.n)} passages`}>
                    <em>{nb(w.n)}</em><div style={{ height: `${(w.n / plafond) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div className="xax">{s.semaines.slice(-12).map((w) => <span key={w.semaine}>{dateCourte(w.semaine)}</span>)}</div>
            </div>
          </section>

          <section className="card">
            <TeteCarte icone="ecole" titre="Quels élèves touche-t-on ?" sous="Part des élèves venus au moins une fois, par niveau" />
            <div className="niv">
              {s.niveaux.map((n) => (
                <div key={n.niveau} className="nv" tabIndex={0} data-tip={`${n.niveau}\n${n.venus} élèves venus sur ${n.population}`}>
                  <b>{n.niveau}</b><span className="tr"><span className="f" style={{ width: `${pct(n.venus, n.population)}%` }} /></span>
                  <span className="v">{pct(n.venus, n.population)} %<span>{n.venus} / {n.population} élèves</span></span>
                </div>
              ))}
            </div>
            <div>
              <p className="small muted" style={{ margin: "0 0 6px" }}>Élèves jamais venus sur la période, par classe</p>
              <div className="divs">{s.jamaisVenus.length ? s.jamaisVenus.map((d) => <span key={d.division}>{d.division} <small>{d.n}</small></span>) : <span className="muted small">Aucun : tous les élèves sont venus.</span>}</div>
            </div>
          </section>
        </div>
      </>}
      <Infobulles />
    </main>
  );
}

/** Une ligne de la carte de chaleur (une plage horaire, cinq jours). */
function Ligne({ l, s, f, pas }: { l: { debut: number; fin: number; type: string }; s: Awaited<ReturnType<typeof calculerStats>>; f: Filtres; pas: (v: number) => number }) {
  return (
    <>
      <div className="rh"><b>{formatMinute(l.debut)}–{formatMinute(l.fin)}</b><span>{l.type === "Pause méridienne" ? "Midi" : l.type}</span></div>
      {JOURS.map((j, i) => {
        const c = s.chaleur.find((x) => x.jour === i + 1 && x.debut === l.debut && x.fin === l.fin);
        if (!c) return <div key={j} className="c off">fermé</div>;
        if (f.type !== "tous" && c.type !== f.type) return <div key={j} className="c off">—</div>;
        const k = pas(c.moyenne);
        return (
          <div key={j} className="c" tabIndex={0} style={{ "--b": `var(--q${k})`, "--t": k >= 4 ? "var(--surface)" : "var(--ink)" } as React.CSSProperties}
            data-tip={`${j} · ${formatMinute(c.debut)}–${formatMinute(c.fin)} · ${c.type}\n${c.moyenne.toFixed(1).replace(".", ",")} élèves en moyenne · ${c.total} passages`}>
            {Math.round(c.moyenne)}
          </div>
        );
      })}
    </>
  );
}
