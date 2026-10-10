/** Parcours complet : demande → confirmation par le super-administrateur → choix du mot de passe. */
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { boiteDeDev } from "@/lib/email";
import {
  accepterDemande, activerCompte, deposerDemande, lireInvitation, listerDemandes, refuserDemande, renvoyerInvitation,
} from "@/lib/data/demandes";
import { verifierIdentifiants } from "@/lib/session";
import { viderBase } from "./aide";

const demande = {
  nom: "Collège Frédéric Bazille", ville: "Castelnau-le-Lez", codePostal: "34170", academie: "Montpellier",
  uai: "", email: "Doc@Exemple.fr",
};
const lienDans = (texte: string) => texte.match(/https:\/\/cdi\.exemple\.fr\/activation\/(\S+)/)![1];

describe("demande de création d'un collège", () => {
  beforeEach(async () => { await viderBase(); boiteDeDev.length = 0; });

  it("de la demande jusqu'à la première connexion", async () => {
    const d = await deposerDemande(demande);
    expect(d.statut).toBe("en_attente");
    expect(d.uai).toBeNull();
    // 1. Le super-administrateur est prévenu, avec un lien vers l'application
    expect(boiteDeDev).toHaveLength(1);
    expect(boiteDeDev[0].a).toEqual(["patron@exemple.fr"]);
    expect(boiteDeDev[0].texte).toContain("https://cdi.exemple.fr/admin");
    expect(await listerDemandes("en_attente")).toHaveLength(1);

    // 2. Il confirme : collège + compte créés, invitation envoyée au documentaliste
    const college = await accepterDemande(d.id);
    expect(college).toMatchObject({ nom: demande.nom, commune: "Castelnau-le-Lez", codePostal: "34170", academie: "Montpellier" });
    expect(await listerDemandes("en_attente")).toHaveLength(0);
    const invitation = boiteDeDev[1];
    expect(invitation.a).toBe("doc@exemple.fr");
    const jeton = lienDans(invitation.texte);

    // Avant d'avoir choisi son mot de passe, impossible de se connecter
    expect(await verifierIdentifiants("doc@exemple.fr", "")).toBeNull();

    // 3. Il choisit son mot de passe
    expect(await lireInvitation(jeton)).toMatchObject({ email: "doc@exemple.fr", college: demande.nom });
    await expect(activerCompte(jeton, "motdepasse-solide", "autre-chose-123")).rejects.toThrow(/identiques/);
    await expect(activerCompte(jeton, "court", "court")).rejects.toThrow(/10 caractères/);
    await activerCompte(jeton, "motdepasse-solide", "motdepasse-solide");
    expect(await verifierIdentifiants("doc@exemple.fr", "motdepasse-solide")).toMatchObject({ role: "admin", collegeId: college.id });

    // Le lien ne sert qu'une fois
    expect(await lireInvitation(jeton)).toBeNull();
    await expect(activerCompte(jeton, "nouveau-mdp-123", "nouveau-mdp-123")).rejects.toThrow(/plus valable/);
    await expect(accepterDemande(d.id)).rejects.toThrow(/déjà été traitée/);
  });

  it("refuse les doublons et les données invalides", async () => {
    await deposerDemande(demande);
    await expect(deposerDemande(demande)).rejects.toThrow(/déjà en cours/);
    await expect(deposerDemande({ ...demande, email: "a@b.fr", codePostal: "341" })).rejects.toThrow(/5 chiffres/);
    await expect(deposerDemande({ ...demande, email: "a@b.fr", academie: "Atlantide" })).rejects.toThrow(/académie/);
    await expect(deposerDemande({ ...demande, email: "a@b.fr", uai: "123" })).rejects.toThrow(/UAI/);
  });

  it("un refus prévient le documentaliste", async () => {
    const d = await deposerDemande(demande);
    await refuserDemande(d.id);
    expect(boiteDeDev.at(-1)?.a).toBe("doc@exemple.fr");
    expect((await listerDemandes("traitees"))[0].statut).toBe("refusee");
  });

  it("une nouvelle invitation remplace l'ancienne une fois utilisée", async () => {
    const d = await deposerDemande(demande);
    await accepterDemande(d.id);
    const ancien = lienDans(boiteDeDev.at(-1)!.texte);
    const [admin] = await db.select().from(schema.users);
    await renvoyerInvitation(admin.id);
    const nouveau = lienDans(boiteDeDev.at(-1)!.texte);
    await activerCompte(nouveau, "motdepasse-solide", "motdepasse-solide");
    expect(await lireInvitation(ancien)).toBeNull();
    await expect(renvoyerInvitation(admin.id)).rejects.toThrow(/déjà choisi/);
  });
});
