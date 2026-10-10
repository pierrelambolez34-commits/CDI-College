import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyser, devinerColonnes, lireFichier } from "@/lib/csv";

const octets = readFileSync(new URL("./fixtures/export-fictif-pronote.csv", import.meta.url));

describe("import CSV d'un export Pronote", () => {
  const f = lireFichier(octets);

  it("détecte l'encodage Windows et le point-virgule", () => {
    expect(f.encodage).toBe("Windows (cp1252)");
    expect(f.separateur).toBe(";");
    expect(f.entetes[1]).toBe("Prénom 1");
  });

  it("reconnaît les colonnes de l'élève, pas celles des parents", () => {
    expect(devinerColonnes(f.entetes)).toEqual({ nom: 0, prenom: 1, division: 2 });
  });

  it("ne garde que nom, prénom et classe, et écarte doublons et lignes incomplètes", () => {
    const a = analyser(f, devinerColonnes(f.entetes));
    expect(a.eleves).toHaveLength(4);
    expect(a.doublons).toBe(1);
    expect(a.incompletes).toBe(1);
    expect(a.colonnesIgnorees).toHaveLength(8);
    expect(a.eleves.find((e) => e.nom === "LEFÈVRE")).toEqual({ nom: "LEFÈVRE", prenom: "Noé", division: "6A", niveau: "6e" });
    expect(a.eleves.find((e) => e.nom === "D'ARGENT")?.division).toBe("3B");
    // Aucune donnée des responsables légaux dans le résultat
    expect(JSON.stringify(a.eleves)).not.toMatch(/06 00|Paul|Hélène/);
  });

  it("lit aussi un fichier UTF-8 séparé par des virgules", () => {
    const g = lireFichier(new TextEncoder().encode("﻿Nom,Prénom,Classe\nÉMERY,Chloé,6B\n"));
    expect(g.encodage).toBe("UTF-8");
    const a = analyser(g, devinerColonnes(g.entetes));
    expect(a.eleves).toEqual([{ nom: "ÉMERY", prenom: "Chloé", division: "6B", niveau: "6e" }]);
  });
});
