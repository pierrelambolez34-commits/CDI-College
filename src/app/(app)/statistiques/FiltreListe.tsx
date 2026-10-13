"use client";
/** Filtre sous forme de liste déroulante (groupes, projets) : chaque choix ouvre l'adresse correspondante. */
import { useRouter } from "next/navigation";

export default function FiltreListe({ id, titre, valeur, options }: { id: string; titre: string; valeur: string; options: { valeur: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <div>
      <label className="lab" htmlFor={id}>{titre}</label>
      <select id={id} className="inp filtre-liste" value={valeur} onChange={(e) => {
        const o = options.find((x) => x.valeur === e.target.value);
        if (o) router.push(o.href, { scroll: false });
      }}>
        {options.map((o) => <option key={o.valeur} value={o.valeur}>{o.label}</option>)}
      </select>
    </div>
  );
}
