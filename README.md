# Passages CDI

Application web pour suivre ce que les élèves viennent faire au CDI du collège.
Elle est **multi-collèges** : chaque collège a ses propres élèves, horaires, motifs et statistiques, totalement séparés des autres.

| Écran | Pour qui | Ce qu'on y fait |
|---|---|---|
| **Saisie** | tous les comptes du collège | Déclarer l'entrée d'un élève en 3 touches : quelques lettres, Entrée, chiffre du motif |
| **Statistiques** | tous les comptes du collège | Motifs, moments de fréquentation, évolution, élèves touchés, export CSV |
| **Paramétrage** | administrateurs du collège | Établissement, horaires du CDI, motifs, import des élèves, comptes |
| **Collèges** (`/admin`) | super-administrateur (toi) | Suivre les collèges inscrits (activation, mise en route, utilisation) |

## Comment un nouveau collège arrive

1. Sur la page d'accueil, le professeur documentaliste clique sur **Ouvrir mon CDI gratuitement** et remplit le formulaire : nom du collège, ville, code postal, académie, code UAI (facultatif) et son e-mail, puis **Envoyer la demande**.
2. Le collège et son compte administrateur sont créés tout de suite, sans validation. Il reçoit un e-mail d'activation (lien valable 7 jours, une seule fois) et choisit son mot de passe.
3. Il est conduit dans la **mise en route en 4 étapes** : établissement (repris de l'inscription), horaires du CDI, motifs de venue, import des élèves. À chaque connexion, tant que ce n'est pas terminé, il reprend à l'étape où il s'était arrêté.

Si le lien a expiré, il suffit de refaire l'inscription avec la même adresse : un nouveau lien est envoyé. Le super-administrateur peut aussi cliquer sur **Renvoyer le lien** dans la liste des collèges.

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
- En développement, aucun e-mail n'est réellement envoyé : connecté en super-administrateur, ouvre **E-mails de test** (`/admin/emails`) pour les lire et cliquer sur leurs liens. Ouvre les liens d'invitation dans une fenêtre privée.
- Pour recevoir de vrais e-mails, renseigne `SMTP_URL` dans `.env` (voir la section « Mettre en ligne »), puis relance l'application.


### Lancer l'application avec les mises à jour automatiques (Windows)

Double-clique sur **`demarrer.cmd`** à la racine du projet (ou tape `.\demarrer.cmd` dans PowerShell).
Le script démarre la base de données, récupère la dernière version sur GitHub, lance l'application sur http://localhost:3000,
puis vérifie GitHub toutes les 15 secondes : à chaque nouvelle version, il l'installe et relance l'application tout seul.
Il suffit ensuite de recharger la page (F5). Pour arrêter : `Ctrl + C`.

### Photo de la page d'accueil

Déposez une photo d'élèves qui entrent au CDI dans `public/accueil/`, nommée **`eleves-cdi.jpg`** (ou `.webp`, `.png`) : paysage, environ 6:5, au moins 1 400 px de large, moins de 400 Ko.
Elle remplace aussitôt l'illustration du hero et de l'écran de connexion. Utilisez une photo dont vous avez les droits
(banque d'images libre avec usage commercial autorisé, ou photo prise au collège avec l'accord écrit des responsables légaux des élèves visibles).

## 2. Les commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'application en mode développement (elle se recharge à chaque modification) |
| `npm test` | Lance les tests automatiques (20 tests : cloisonnement entre collèges, inscription et mise en route d'un collège…) |
| `npm run typecheck` | Vérifie le code TypeScript sans le lancer |
| `npm run build` puis `npm start` | Version de production |
| `npm run db:generate` | Après une modification de `src/db/schema.ts` : crée le fichier de migration |
| `npm run db:migrate` | Applique les migrations à la base (lancé automatiquement en ligne après chaque déploiement) |
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
    data/demandes.ts      Inscription d'un collège, e-mail d'activation, choix du mot de passe
    email.ts              Envoi des e-mails (SMTP), modèle de mise en page
    photo.ts              Photo de la page d'accueil (ou illustration par défaut)
    limite.ts             Limite du nombre de tentatives (connexion, demandes)
    csv.ts                Lecture du fichier Pronote/SIECLE (s'exécute dans le navigateur)
    horaires.ts           Vérification des plages horaires
    temps.ts              Heure de Paris, plage en cours
    validation.ts         Contrôle des données reçues par le serveur
  app/
    connexion/            Page de connexion
    creer-un-college/     Formulaire public d'inscription d'un collège
    bienvenue/[etape]/    Mise en route en 4 étapes après l'activation
    activation/[jeton]/   Choix du mot de passe depuis le lien d'invitation
    admin/                Espace super-administrateur (collèges, e-mails de test)
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

## 6. Mettre en ligne (Scalingo, hébergement en France)

Le projet est prêt pour Scalingo : `Procfile` (démarrage sur le port fourni, mise à jour de la base après chaque déploiement),
version de Node.js fixée, scripts de base de données sans outils de développement.

1. **Créer le compte** sur https://scalingo.com (30 jours d'essai), région **osc-fr1** (Paris).
2. **Créer l'application** (par exemple `passages-cdi`), puis l'onglet *Code* → relier le dépôt GitHub `CDI-College`, branche `main`.
3. **Ajouter la base** : onglet *Addons* → PostgreSQL, offre Starter 512M. Scalingo crée tout seul la variable `SCALINGO_POSTGRESQL_URL`.
4. **Choisir la taille** : onglet *Resources* → conteneur **M** (512 Mo ; le S est trop juste pour Next.js).
5. **Créer le compte d'envoi d'e-mails** sur https://www.brevo.com (offre gratuite : 300 e-mails par jour). Dans *SMTP & API*, noter l'identifiant et la clé SMTP ; dans *Expéditeurs*, valider l'adresse d'expédition.
6. **Renseigner les variables** : onglet *Environment* :
   | Variable | Valeur |
   |---|---|
   | `APP_URL` | l'adresse de l'application, par exemple `https://passages-cdi.osc-fr1.scalingo.io` |
   | `SMTP_HOST` | `smtp-relay.brevo.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | l'identifiant SMTP Brevo |
   | `SMTP_PASS` | la clé SMTP Brevo |
   | `MAIL_FROM` | `Passages CDI <adresse validée dans Brevo>` |
   | `SUPERADMIN_EMAIL` | ton adresse |
   | `SUPERADMIN_PASSWORD` | un mot de passe d'au moins 14 caractères |
7. **Déployer** : onglet *Deploy* → *Manual deployment* → `main`. La base est mise à jour automatiquement à la fin.
8. **Créer ton compte super-administrateur** une fois : bouton *Run* / console de l'application → `npm run db:superadmin`.
9. **Tester** : ouvrir l'adresse, s'inscrire avec une vraie adresse e-mail, vérifier la réception de l'e-mail d'activation.

Ensuite, chaque nouvelle version se met en ligne en cliquant à nouveau sur *Manual deployment* (ou en activant le déploiement automatique, déconseillé tant que l'application évolue beaucoup).

Ne jamais lancer `npm run db:demo` en ligne : le script le refuse.

## 7. Prochaines étapes possibles

- « Mot de passe oublié » par e-mail (le mécanisme de lien à usage unique existe déjà).
- Rapport d'activité annuel en PDF.
- Mode hors-ligne (saisie conservée si le Wi-Fi coupe).
- Lecture des cartes élèves par douchette (code-barres).
- Connexion via l'ENT académique.
