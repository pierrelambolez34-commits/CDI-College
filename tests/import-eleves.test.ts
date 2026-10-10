import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { importerEleves, listerElevesActifs } from "@/lib/data/eleves";
import { nouveauCollege, viderBase } from "./aide";

describe("import annuel des élèves", () => {
  let C: { id: string };
  beforeEach(async () => { await viderBase(); C = await nouveauCollege(); });

  it("met à jour la classe, ajoute les nouveaux et archive les partis", async () => {
    await importerEleves(C.id, [
      { nom: "MARTIN", prenom: "Léa", division: "6A" },
      { nom: "PETIT", prenom: "Hugo", division: "3B" },
    ], true);
    const r = await importerEleves(C.id, [
      { nom: "Martin", prenom: "Lea", division: "5C" },  // passée en 5e, saisie sans accent
      { nom: "NOUVEAU", prenom: "Sam", division: "6D" },
    ], true);
    expect(r).toMatchObject({ ajoutes: 1, misAJour: 1, archives: 1 });
    const actifs = await listerElevesActifs(C.id);
    expect(actifs.map((e) => `${e.nom} ${e.division}`)).toEqual(["MARTIN 5C", "NOUVEAU 6D"]);
    // L'élève parti reste en base (pour l'historique), mais archivé
    expect(await db.select().from(schema.eleves)).toHaveLength(3);
  });

  it("distingue deux homonymes de classes différentes", async () => {
    await importerEleves(C.id, [
      { nom: "NGUYEN", prenom: "Linh", division: "6A" },
      { nom: "NGUYEN", prenom: "Linh", division: "4C" },
    ], true);
    expect(await listerElevesActifs(C.id)).toHaveLength(2);
  });

  it("n'archive rien si l'option est décochée", async () => {
    await importerEleves(C.id, [{ nom: "A", prenom: "A", division: "6A" }], true);
    const r = await importerEleves(C.id, [{ nom: "B", prenom: "B", division: "6A" }], false);
    expect(r.archives).toBe(0);
    expect(await listerElevesActifs(C.id)).toHaveLength(2);
  });
});
