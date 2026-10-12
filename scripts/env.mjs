// Charge le fichier .env s'il existe (sur ton ordinateur). En ligne, les variables viennent de l'hébergeur.
try { (await import("dotenv")).config(); } catch { /* dotenv n'est pas installé en production : rien à faire */ }
