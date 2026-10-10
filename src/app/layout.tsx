import type { Metadata } from "next";
// Polices hébergées par l'application elle-même (pas d'appel à Google : conforme RGPD).
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Passages CDI", template: "%s · Passages CDI" },
  description: "Suivi de la fréquentation du CDI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
