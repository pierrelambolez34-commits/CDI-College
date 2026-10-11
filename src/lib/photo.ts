import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Photo d'élèves entrant au CDI, déposée dans public/accueil (eleves-cdi.jpg, .webp ou .png).
 * Sans photo, on affiche l'illustration fournie avec l'application.
 */
export function photoAccueil(): string {
  for (const nom of ["eleves-cdi.webp", "eleves-cdi.jpg", "eleves-cdi.jpeg", "eleves-cdi.png"]) {
    if (existsSync(path.join(process.cwd(), "public", "accueil", nom))) return `/accueil/${nom}`;
  }
  return "/accueil/illustration-cdi.svg";
}
