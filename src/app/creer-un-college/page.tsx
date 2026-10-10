import CadreAccueil from "@/components/CadreAccueil";
import FormulaireDemande from "./FormulaireDemande";

export const metadata = { title: "Création d'un collège" };

export default function CreerUnCollege() {
  return <CadreAccueil><FormulaireDemande /></CadreAccueil>;
}
