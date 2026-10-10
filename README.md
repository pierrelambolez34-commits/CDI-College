# Passages CDI

Application web pour suivre ce que les élèves viennent faire au CDI du collège.
Elle est **multi-collèges** : chaque collège a ses propres élèves, horaires, motifs et statistiques, totalement séparés des autres.

| Écran | Pour qui | Ce qu'on y fait |
|---|---|---|
| **Saisie** | tous les comptes du collège | Déclarer l'entrée d'un élève en 3 touches : quelques lettres, Entrée, chiffre du motif |
| **Statistiques** | tous les comptes du collège | Motifs, moments de fréquentation, évolution, élèves touchés, export CSV |
| **Paramétrage** | administrateurs du collège | Établissement, horaires du CDI, motifs, import des élèves, comptes |
| **Collèges** (`/admin`) | super-administrateur (toi) | Confirmer ou refuser les demandes de création de collège, suivre les collèges ouverts |

## Comment un nouveau collège arrive

1. Sur l'écran de connexion, le professeur documentaliste clique sur **Création d'un collège** et remplit le formulaire : nom, ville, code postal, académie, code UAI (facultatif) et son e-mail.
2. Tu reçois un e-mail avec un lien vers l'application. Dans **Collèges**, la demande apparaît dans « Demandes à traiter ».
3. Tu cliques sur **Confirmer la création** : le collège est créé avec des horaires et des motifs par défaut, et le documentaliste reçoit un e-mail d'invitation.
4. Il clique sur le lien (valable 7 jours, une seule fois), choisit et confirme son mot de passe, puis arrive directement dans le paramétrage.

Si le lien a expiré, le bouton **Renvoyer l'invitation** dans la liste des collèges en envoie un nouveau.

---

## 1. Installer le projet sur ton ordinateur

Il faut installer une seule fois :

1. **Node.js 22** : https://nodejs.org (version « LTS »).
2. **Docker Desktop** : https://www.docker.com/products/docker-desktop. Il sert à faire tourner la base de données PostgreSQL sans l'installer à la main.
3. **Git** : https://git-scm.com.

Ensuite, dans un terminal :

```bash
git clone https://github.com/<compte>/<depot>.git passages-cdi
cd passages-cdi
npm install                 # télécharge les bibliothèques
cp .env.example .env        # crée le fichier de configuration (sous Windows : copy .env.example .env)
docker compose up -d        # démarre PostgreSQL
npm run db:migrate          # crée les tables
npm run db:superadmin       # crée ton compte super-administrateur (voir .env)
npm run db:demo             # (facultatif) crée un collège de démonstration rempli de données fictives
npm run dev                 # lance l'application
```

Ouvre ensuite http://localhost:3000.

- Collège de démonstration : `demo@exemple.fr` / `demonstration` (administrateur) ou `assistant@exemple.fr` / `demonstration` (saisie seulement).
- Super-administrateur : l'adresse et le mot de passe indiqués dans ton fichier `.env`. **Change le mot de passe** avant toute mise en ligne.
- En développement, aucun e-mail n'est réellement envoyé : ils s'affichent dans le terminal où tourne `npm run dev`, avec leurs liens cliquables.

## 2. Les commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'application en mode développement (elle se recharge à chaque modification) |
| `npm test` | Lance les tests automatiques (21 tests : cloisonnement entre collèges, parcours de création d'un collège…) |
| `npm run typecheck` | Vérifie le code TypeScript sans le lancer |
| `npm run build` puis `npm start` | Version de production |
| `npm run db:generate` | Après une modification de `src/db/schema.ts` : crée le fichier de migration |
| `npm run db:migrate` | Applique les migrations à la base |
| `npm run db:demo` | Recrée le collège de démonstration |

## 3. Où se trouve quoi

```
src/
  db/schema.ts            Les tables de la base (collèges, comptes, plages, motifs, élèves, passages)
  lib/
    session.ts            Connexion, sessions, et LE garde-fou : utilisateurCollege()
    data/college.ts       Collèges, horaires, motifs, comptes
    data/eleves.ts        Import annuel des élèves
    data/passages.ts      Enregistrement et annulation des passages
    data/stats.ts         Calcul des statistiques et export CSV
    data/demandes.ts      Demandes de création de collège, invitations, choix du mot de passe
    email.ts              Envoi des e-mails (SMTP), modèle de mise en page
    limite.ts             Limite du nombre de tentatives (connexion, demandes)
    csv.ts                Lecture du fichier Pronote/SIECLE (s'exécute dans le navigateur)
    horaires.ts           Vérification des plages horaires
    temps.ts              Heure de Paris, plage en cours
    validation.ts         Contrôle des données reçues par le serveur
  app/
    connexion/            Page de connexion
    creer-un-college/     Formulaire public de demande de création
    activation/[jeton]/   Choix du mot de passe depuis le lien d'invitation
    admin/                Espace super-administrateur (demandes et collèges)
    (app)/saisie/         Écran de saisie (Saisie.tsx contient toute la logique clavier)
    (app)/statistiques/   Tableau de bord et export CSV
    (app)/parametrage/    Les 5 rubriques du paramétrage
    globals.css           Toutes les couleurs et styles
tests/                    Tests automatiques
scripts/                  Migrations, super-administrateur, collège de démonstration
drizzle/                  Fichiers de migration SQL (générés)
```

## 4. Comment les collèges sont séparés

- Chaque table de données a une colonne `college_id`.
- Chaque page et chaque action commence par `utilisateurCollege()`, qui lit le collège **depuis la session**, jamais depuis ce qu'envoie le navigateur.
- Toutes les fonctions de `src/lib/data/` reçoivent ce `collegeId` et filtrent dessus. Avant d'enregistrer un passage, le serveur vérifie que l'élève et le motif appartiennent bien au collège.
- Le fichier `tests/cloisonnement.test.ts` vérifie ces règles. **Si tu ajoutes une fonctionnalité, garde ce principe** : toute nouvelle requête doit filtrer sur `college_id`.

## 5. Données personnelles (RGPD)

- Seuls **le nom, le prénom et la classe** des élèves sont enregistrés.
- Le fichier CSV est lu **dans le navigateur** : les colonnes des responsables légaux (noms, téléphones) ne sont jamais envoyées au serveur.
- Un élève qui quitte le collège est **archivé** au réimport suivant : il disparaît de la saisie, ses passages restent dans les statistiques.
- Les polices sont hébergées par l'application (pas d'appel à Google Fonts).
- Les mots de passe sont chiffrés (bcrypt) ; la session est un cookie sécurisé valable 30 jours.
- À prévoir avant la commercialisation : hébergement en France, contrat de sous-traitance (article 28) à faire signer par chaque chef d'établissement, durée de conservation et suppression automatique des données anciennes.

## 6. Mettre en ligne

L'application a besoin d'un hébergeur Node.js et d'une base PostgreSQL. Par exemple chez **Scalingo** ou **Clever Cloud** (hébergement en France) :

1. Crée une application Node.js et ajoute une base PostgreSQL.
2. Renseigne les variables `DATABASE_URL`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, `APP_URL` (l'adresse publique, pour les liens des e-mails), `SMTP_URL`, `MAIL_FROM` et `NODE_ENV=production`.
   Pour `SMTP_URL`, un service d'envoi français comme Brevo fournit des identifiants SMTP : `smtps://identifiant:motdepasse@smtp-relay.brevo.com:465`.
3. Commande de construction : `npm run build` ; commande de démarrage : `npm run db:migrate && npm start`.
4. Une fois en ligne, lance une fois `npm run db:superadmin` depuis la console de l'hébergeur.

## 7. Prochaines étapes possibles

- « Mot de passe oublié » par e-mail (le mécanisme de lien à usage unique existe déjà).
- Rapport d'activité annuel en PDF.
- Mode hors-ligne (saisie conservée si le Wi-Fi coupe).
- Lecture des cartes élèves par douchette (code-barres).
- Connexion via l'ENT académique.
