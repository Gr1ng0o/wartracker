import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: { default: "WarTracker — Archives de guerre", template: "%s | WarTracker" }, description: "Tes chroniques de bataille Warhammer 40,000 et Flesh and Blood. Consigne, analyse et progresse." };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="fr"><body><a className="skip-link" href="#content">Aller au contenu</a><header className="site-header"><Link className="site-brand" href="/" aria-label="WarTracker, accueil">✣ WARTRACKER</Link><nav aria-label="Navigation principale"><Link href="/40k">Warhammer 40k</Link><Link href="/fab">Flesh and Blood</Link><Link href="/games">Historique</Link><Link href="/media">Médiathèque</Link></nav></header><div id="content" className="site-content">{children}</div><footer className="site-footer"><span>WARTRACKER / ARCHIVES DE GUERRE</span><span>Consigner. Comprendre. Vaincre.</span></footer></body></html>;
}
