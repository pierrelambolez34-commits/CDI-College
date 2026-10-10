/**
 * Le test le plus important : un collège ne doit jamais pouvoir lire ni modifier
 * les données d'un autre collège.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { lireMotifs } from "@/lib/data/college";
import { importerEleves, listerElevesActifs } from "@/lib/data/eleves";
import { annulerPassages, enregistrerPassages, passagesDuJour } from "@/lib/data/passages";
import { nouveauCollege, viderBase } from "./aide";

const instant = { jour: "2026-10-06", minute: 600, jourSemaine: 2 };

describe("cloisonnement entre collèges", () => {
  let A: { id: string }, B: { id: string };
  beforeEach(async () => {
    await viderBase();
    A = await nouveauCollege("Collège A");
    B = await nouveauCollege("Collège B");
    await importerEleves(A.id, [{ nom: "ALPHA", prenom: "Anna", division: "6A" }], true);
    await importerEleves(B.id, [{ nom: "BRAVO", prenom: "Bob", division: "5B" }], true);
  });

  it("chaque collège ne voit que ses élèves", async () => {
    expect((await listerElevesActifs(A.id)).map((e) => e.nom)).toEqual(["ALPHA"]);
    expect((await listerElevesActifs(B.id)).map((e) => e.nom)).toEqual(["BRAVO"]);
  });

  it("refuse d'enregistrer un élève d'un autre collège", async () => {
    const [eleveB] = await listerElevesActifs(B.id);
    const [motifA] = await lireMotifs(A.id);
    await expect(enregistrerPassages(A.id, null, { eleveIds: [eleveB.id], motifId: motifA.id, typePlage: "Cours", instant }))
      .rejects.toThrow(/n'appartient pas/);
    expect(await db.select().from(schema.passages)).toHaveLength(0);
  });

  it("refuse un motif d'un autre collège", async () => {
    const [eleveA] = await listerElevesActifs(A.id);
    const [motifB] = await lireMotifs(B.id);
    await expect(enregistrerPassages(A.id, null, { eleveIds: [eleveA.id], motifId: motifB.id, typePlage: "Cours", instant }))
      .rejects.toThrow(/motif/);
  });

  it("ne peut ni voir ni annuler les passages d'un autre collège", async () => {
    const [eleveB] = await listerElevesActifs(B.id);
    const [motifB] = await lireMotifs(B.id);
    const [p] = await enregistrerPassages(B.id, null, { eleveIds: [eleveB.id], motifId: motifB.id, typePlage: "Cours", instant });
    expect(await passagesDuJour(A.id, instant.jour)).toHaveLength(0);
    expect(await annulerPassages(A.id, [p.id])).toBe(0);
    expect(await passagesDuJour(B.id, instant.jour)).toHaveLength(1);
  });
});
