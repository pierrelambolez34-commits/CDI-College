import Link from "next/link";

/** Logo de l'application : une porte de CDI ouverte sur des livres, et le nom. */
export default function Logo({ href = "/", clair = false }: { href?: string; clair?: boolean }) {
  return (
    <Link href={href} className={`marque-logo ${clair ? "clair" : ""}`} aria-label="Passages CDI, page d'accueil">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="10" fill={clair ? "#FFFFFF" : "var(--accent)"} />
        <path d="M9 25V11.5A2.5 2.5 0 0 1 11.5 9h11A2.5 2.5 0 0 1 25 11.5V25" fill="none" stroke={clair ? "var(--band)" : "#FFFFFF"} strokeWidth="2.2" strokeLinecap="round" />
        <rect x="12.5" y="13" width="3" height="9" rx="1" fill={clair ? "var(--band)" : "#FFFFFF"} />
        <rect x="16.5" y="15" width="3" height="7" rx="1" fill={clair ? "var(--band)" : "#FFFFFF"} opacity=".75" />
        <rect x="20.5" y="12" width="2.5" height="10" rx="1" fill="var(--pep)" />
        <path d="M7 25h20" stroke={clair ? "var(--band)" : "#FFFFFF"} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span>Passages <span className="cdi">CDI</span></span>
    </Link>
  );
}
