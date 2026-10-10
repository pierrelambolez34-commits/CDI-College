import { beforeEach, describe, expect, it } from "vitest";
import { lireMotifs } from "@/lib/data/college";
import { importerEleves, listerElevesActifs } from "@/lib/data/eleves";
import { enregistrerPassages } from "@/lib/data/passages";
import { calculerStats, debutPeriode } from "@/lib/data/stats";
import { verifierIdentifiants } from "@/lib/session";
import { instantParis } from "@/lib/temps";
import { nouveauCollege, viderBase } from "./aide";

describe("statistiques", () => {
  beforeEach(viderBase);

  it("compte les passages par motif, par niveau et les élèves jamais venus, sans mélanger les collèges", async () => {
    const A = await nouveauCollege("A"), B = await nouveauCollege("B");
    await importerEleves(A.id, [
      { nom: "UN", prenom: "Ana", division: "6A" }, { nom: "DEUX", prenom: "Bo", division: "6A" }, { nom: "TROIS", prenom: "Cy", division: "3B" },
    ], true);
    await importerEleves(B.id, [{ nom: "AUTRE", prenom: "Zed", division: "5C" }], true);
    const elA = await listerElevesActifs(A.id), [elB] = await listerElevesActifs(B.id);
    const [m1, m2] = await lireMotifs(A.id), [mB] = await lireMotifs(B.id);
    const ici = instantParis();
    const instant = { ...ici, minute: 600 };
    const un = elA.find((e) => e.nom === "UN")!, trois = elA.find((e) => e.nom === "TROIS")!;
    await enregistrerPassages(A.id, null, { eleveIds: [un.id, trois.id], motifId: m1.id, typePlage: "Récréation", instant });
    await enregistrerPassages(A.id, null, { eleveIds: [un.id], motifId: m2.id, typePlage: "Cours", instant });
    await enregistrerPassages(B.id, null, { eleveIds: [elB.id], motifId: mB.id, typePlage: "Cours", instant });

    const s = await calculerStats(A.id, { periode: "annee", niveau: "tous", type: "tous" });
    expect(s.passages).toBe(3);
    expect(s.elevesVenus).toBe(2);
    expect(s.population).toBe(3);
    expect(s.parMotif[m1.id]).toBe(2);
    expect(s.jamaisVenus).toEqual([{ division: "6A", n: 1 }]);
    expect(s.niveaux.find((n) => n.niveau === "6e")).toMatchObject({ population: 2, venus: 1 });

    const recre = await calculerStats(A.id, { periode: "annee", niveau: "tous", type: "Récréation" });
    expect(recre.passages).toBe(2);
    const sixiemes = await calculerStats(A.id, { periode: "7", niveau: "6e", type: "tous" });
    expect(sixiemes.passages).toBe(2);
  });

  it("calcule le début des périodes", () => {
    const mardi = { jour: "2026-10-06", minute: 600, jourSemaine: 2 };
    expect(debutPeriode("7", "2026-2027", mardi)).toBe("2026-10-05");
    expect(debutPeriode("30", "2026-2027", mardi)).toBe("2026-09-07");
    expect(debutPeriode("annee", "2026-2027", mardi)).toBe("2026-08-15");
  });
});

describe("connexion", () => {
  beforeEach(viderBase);
  it("vérifie le mot de passe et ignore la casse de l'e-mail", async () => {
    await nouveauCollege();
    const { db, schema } = await import("@/db");
    const [admin] = await db.select().from(schema.users);
    expect(await verifierIdentifiants(admin.email.toUpperCase(), "motdepasse-solide")).toMatchObject({ role: "admin" });
    expect(await verifierIdentifiants(admin.email, "mauvais")).toBeNull();
    expect(await verifierIdentifiants("inconnu@exemple.fr", "motdepasse-solide")).toBeNull();
  });
});
