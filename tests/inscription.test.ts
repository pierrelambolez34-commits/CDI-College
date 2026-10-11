/** Parcours complet : inscription → e-mail d'activation → mot de passe → mise en route en 4 étapes. */
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { boiteDeDev } from "@/lib/email";
import { avancerAccueil, lireCollege } from "@/lib/data/college";
import { activerCompte, inscrireCollege, lireInvitation, renvoyerInvitation } from "@/lib/data/demandes";
import { verifierIdentifiants } from "@/lib/session";
import { viderBase } from "./aide";

const inscription = {
  nom: "Collège Frédéric Bazille", ville: "Castelnau-le-Lez", codePostal: "34170", academie: "Montpellier",
  uai: "0341234a", email: "Doc@Exemple.fr",
};
const lienDans = (texte: string) => texte.match(/https:\/\/cdi\.exemple\.fr\/activation\/(\S+)/)![1];

describe("inscription d'un collège", () => {
  beforeEach(async () => { await viderBase(); boiteDeDev.length = 0; });

  it("de l'inscription à la fin de la mise en route, sans validation du super-administrateur", async () => {
    const { jeton, dejaInscrit } = await inscrireCollege(inscription);
    expect(dejaInscrit).toBe(false);

    // Le collège est créé tout de suite, avec les données saisies, et la mise en route commence à l'étape 1
    const [c] = await db.select().from(schema.colleges);
    expect(c).toMatchObject({ nom: inscription.nom, commune: "Castelnau-le-Lez", codePostal: "34170", academie: "Montpellier", uai: "0341234A", etapeAccueil: 1 });

    // Un seul e-mail : l'activation, envoyée au documentaliste (pas au super-administrateur)
    expect(boiteDeDev).toHaveLength(1);
    expect(boiteDeDev[0].a).toBe("doc@exemple.fr");
    expect(lienDans(boiteDeDev[0].texte)).toBe(jeton);

    // Pas de connexion possible avant l'activation
    expect(await verifierIdentifiants("doc@exemple.fr", "")).toBeNull();
    await expect(activerCompte(jeton, "motdepasse-solide", "autre-chose-123")).rejects.toThrow(/identiques/);
    await activerCompte(jeton, "motdepasse-solide", "motdepasse-solide");
    expect(await verifierIdentifiants("doc@exemple.fr", "motdepasse-solide")).toMatchObject({ role: "admin", collegeId: c.id });
    expect(await lireInvitation(jeton)).toBeNull();

    // Les étapes avancent et ne reculent jamais
    await avancerAccueil(c.id, 3);
    await avancerAccueil(c.id, 2);
    expect((await lireCollege(c.id)).etapeAccueil).toBe(3);
    await avancerAccueil(c.id, 5);
    expect((await lireCollege(c.id)).etapeAccueil).toBe(5);
  });

  it("une nouvelle inscription avec la même adresse renvoie le lien si le compte n'est pas activé", async () => {
    const premier = await inscrireCollege(inscription);
    const second = await inscrireCollege({ ...inscription, nom: "Autre nom" });
    expect(second.dejaInscrit).toBe(true);
    expect(await db.select().from(schema.colleges)).toHaveLength(1);
    expect(boiteDeDev).toHaveLength(2);
    await activerCompte(second.jeton, "motdepasse-solide", "motdepasse-solide");
    expect(await lireInvitation(premier.jeton)).toBeNull();
    // Une fois activé, impossible de se réinscrire avec la même adresse
    await expect(inscrireCollege(inscription)).rejects.toThrow(/existe déjà/);
    const [admin] = await db.select().from(schema.users);
    await expect(renvoyerInvitation(admin.id)).rejects.toThrow(/déjà activé/);
  });

  it("refuse les données invalides et un UAI déjà utilisé", async () => {
    await expect(inscrireCollege({ ...inscription, codePostal: "341" })).rejects.toThrow(/5 chiffres/);
    await expect(inscrireCollege({ ...inscription, academie: "Atlantide" })).rejects.toThrow(/académie/);
    await expect(inscrireCollege({ ...inscription, uai: "123" })).rejects.toThrow(/UAI/);
    await inscrireCollege(inscription);
    await expect(inscrireCollege({ ...inscription, email: "autre@exemple.fr" })).rejects.toThrow(/code UAI/);
  });
});
