import Link from "next/link";
export default function CampaignHub({ kind }: { kind: "40k" | "fab" }) {
 const is40k = kind === "40k";
 return <main className="sanctum hub">
  <div className="archive-index"><Link href="/">← Les archives</Link><span>CHRONIQUES / {is40k ? "I" : "II"}</span></div>
  <section className="hub-heading"><p className="eyebrow">{is40k ? "Dans les ténèbres du lointain futur" : "La chair se souvient. Le sang témoigne."}</p><h1>{is40k ? "Warhammer 40,000" : "Flesh and Blood"}</h1><p className="intro-copy">{is40k ? "Le registre de tes campagnes. Chaque décision compte." : "Le registre de tes duels. Chaque main compte."}</p></section>
  <div className="campaign-grid">
   <Link className="campaign-card" href={"/" + kind + "/add-game"}><span className="eyebrow">01 / CONSIGNER</span><h2>Une nouvelle bataille</h2><p>{is40k ? "Armées, résultat, listes et notes de terrain." : "Deck, adversaire, résultat et enseignements."}</p><span className="card-action">Ajouter une partie <span aria-hidden="true">＋</span></span></Link>
   <Link className="campaign-card" href={"/" + kind + "/games"}><span className="eyebrow">02 / MÉDITER</span><h2>Les batailles passées</h2><p>Retrouve tes affrontements et mesure ta progression.</p><span className="card-action">Consulter l’historique <span aria-hidden="true">↗</span></span></Link>
  </div>{is40k&&<Link className="media-detail-link" href="/40k/lists">Importer une liste ALN et consulter les statistiques d’unités →</Link>}</main>;
}
