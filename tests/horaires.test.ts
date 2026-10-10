import { describe, expect, it } from "vitest";
import { verifierHoraires } from "@/lib/horaires";
import { plageEnCours } from "@/lib/temps";
import { plagesDefaut, TYPES_PLAGE_DEFAUT } from "@/lib/defauts";

describe("horaires", () => {
  it("la semaine par défaut est valide", () => {
    expect(verifierHoraires(plagesDefaut(), TYPES_PLAGE_DEFAUT)).toEqual([]);
  });
  it("détecte un chevauchement", () => {
    const e = verifierHoraires([{ jour: 1, debut: 480, fin: 540, type: "Cours" }, { jour: 1, debut: 530, fin: 600, type: "Cours" }], ["Cours"]);
    expect(e[0]).toMatch(/chevauchent/);
  });
  it("trouve la plage en cours", () => {
    const p = plagesDefaut().map((x, i) => ({ ...x, id: String(i) }));
    expect(plageEnCours(p, 2, 9 * 60 + 55)?.type).toBe("Récréation");
    expect(plageEnCours(p, 3, 14 * 60)).toBeNull(); // mercredi après-midi : fermé
  });
});
