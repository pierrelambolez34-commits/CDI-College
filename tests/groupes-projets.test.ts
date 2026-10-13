import { beforeEach, describe, expect, it } from "vitest";
import { lireMotifs } from "@/lib/data/college";
import { importerEleves, listerElevesActifs } from "@/lib/data/eleves";
import { creerGroupe, groupesPourSaisie, lireGroupe, listerGroupes, modifierGroupe, supprimerGroupe } from "@/lib/data/groupes";
import { enregistrerPassages, passagesDuJour } from "@/lib/data/passages";
import { bilanProjet, creerProjet, etatProjet, listerProjets, modifierProjet, projetsEnCours, supprimerProjet } from "@/lib/data/projets";
import { calculerStats } from "@/lib/data/stats";
import { instantParis } from "@/lib/temps";
import { nouveauCollege, viderBase } from "./aide";

const ici = () => ({ ...instantParis(), minute: 600 });

describe("groupes et projets", () => {
  let A: { id: string }, B: { id: string };
  beforeEach(async () => {
    await viderBase();
    A = await nouveauCollege("A"); B = await nouveauCollege("B");
    await importerEleves(A.id, [
      { nom: "UN", prenom: "Ana", division: "4B" }, { nom: "DEUX", prenom: "Bo", division: "4B" },
      { nom: "TROIS", prenom: "Cy", division: "6A" }, { nom: "QUATRE", prenom: "Di", division: "3C" },
    ], true);
    await importerEleves(B.id, [{ nom: "AUTRE", prenom: "Zed", division: "5C" }], true);
  });
  const el = async (nom: string) => (await listerElevesActifs(A.id)).find((e) => e.nom === nom)!;

  it("crée un groupe, gère ses membres et refuse les élèves d'un autre collège", async () => {
    const g = await creerGroupe(A.id, { nom: "Club manga", eleveIds: [(await el("UN")).id, (await el("TROIS")).id] });
    await expect(creerGroupe(A.id, { nom: "club MANGA" })).rejects.toThrow(/déjà/);
    const [autre] = await listerElevesActifs(B.id);
    await expect(modifierGroupe(A.id, g.id, { nom: "Club manga", description: "", eleveIds: [autre.id] })).rejects.toThrow(/n'appartient pas/);
    await modifierGroupe(A.id, g.id, { nom: "Club manga", description: "Le jeudi midi", eleveIds: [(await el("DEUX")).id] });
    expect((await lireGroupe(A.id, g.id))?.eleveIds).toEqual([(await el("DEUX")).id]);
    expect(await listerGroupes(A.id)).toMatchObject([{ nom: "Club manga", nbEleves: 1, description: "Le jeudi midi" }]);
    expect((await groupesPourSaisie(A.id))[0].eleveIds).toHaveLength(1);
    // Cloisonnement
    expect(await lireGroupe(B.id, g.id)).toBeNull();
    expect(await listerGroupes(B.id)).toHaveLength(0);
    await expect(supprimerGroupe(B.id, g.id)).rejects.toThrow();
    await supprimerGroupe(A.id, g.id);
    expect(await listerGroupes(A.id)).toHaveLength(0);
  });

  it("un projet rassemble classes et groupes, reçoit des passages et a son bilan", async () => {
    const g = await creerGroupe(A.id, { nom: "Club lecture", eleveIds: [(await el("TROIS")).id] });
    const jour = instantParis().jour;
    await expect(creerProjet(A.id, { nom: "Prix", description: "", partenaires: "", debut: "2026-10-10", fin: "2026-09-01", classes: [], groupeIds: [] })).rejects.toThrow(/après/);
    const p = await creerProjet(A.id, { nom: "Prix des lecteurs", description: "Lire 5 romans", partenaires: "Mme Durand", debut: "2026-09-01", fin: null, classes: ["4b"], groupeIds: [g.id] });
    expect(p.classes).toEqual(["4B"]);
    expect(etatProjet(p, jour)).toBe("en_cours");
    expect((await projetsEnCours(A.id)).map((x) => x.nom)).toEqual(["Prix des lecteurs"]);
    expect(await projetsEnCours(B.id)).toHaveLength(0);

    const [motif] = await lireMotifs(A.id);
    await enregistrerPassages(A.id, null, { eleveIds: [(await el("UN")).id, (await el("TROIS")).id], motifId: motif.id, typePlage: "Cours", instant: ici(), projetId: p.id });
    await enregistrerPassages(A.id, null, { eleveIds: [(await el("QUATRE")).id], motifId: motif.id, typePlage: "Cours", instant: ici() });
    // Projet d'un autre collège refusé
    const [mB] = await lireMotifs(B.id); const [eB] = await listerElevesActifs(B.id);
    await expect(enregistrerPassages(B.id, null, { eleveIds: [eB.id], motifId: mB.id, typePlage: "Cours", instant: ici(), projetId: p.id })).rejects.toThrow(/projet/);
    expect((await passagesDuJour(A.id, jour)).filter((x) => x.projetId === p.id)).toHaveLength(2);

    const b = await bilanProjet(A.id, p.id);
    expect(b).toMatchObject({ passages: 2, eleves: 2, participants: 3, participantsVenus: 2 });
    expect(b?.parClasse.map((c) => c.division)).toEqual(["4B", "6A"]);
    expect(await bilanProjet(B.id, p.id)).toBeNull();
    expect((await listerProjets(A.id))[0]).toMatchObject({ passages: 2, groupes: ["Club lecture"] });

    // Statistiques filtrées
    const sp = await calculerStats(A.id, { periode: "annee", niveau: "tous", type: "tous", projet: p.id });
    expect(sp).toMatchObject({ passages: 2, population: 3, elevesVenus: 2 });
    const sg = await calculerStats(A.id, { periode: "annee", niveau: "tous", type: "tous", groupe: g.id });
    expect(sg).toMatchObject({ passages: 1, population: 1, elevesVenus: 1 });
    const autre = await calculerStats(B.id, { periode: "annee", niveau: "tous", type: "tous", groupe: g.id });
    expect(autre.passages).toBe(0);

    await modifierProjet(A.id, p.id, { nom: "Prix des lecteurs", description: "", partenaires: "", debut: "2026-09-01", fin: "2026-09-30", classes: [], groupeIds: [] });
    expect(await projetsEnCours(A.id)).toHaveLength(0);
    // Supprimer le projet garde les passages
    await supprimerProjet(A.id, p.id);
    expect(await passagesDuJour(A.id, jour)).toHaveLength(3);
  });
});
