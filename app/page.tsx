import Link from "next/link";
export default function Home() {
 return <main className="sanctum">
  <div className="archive-index"><span>ARCHIVES DE GUERRE</span><span>VOL. I / M.XLI</span></div>
  <section className="sanctum-intro" aria-labelledby="home-title">
   <div className="reliquary" aria-hidden="true"><span>✦</span></div>
   <p className="eyebrow">Chaque bataille laisse une trace.</p>
   <h1 id="home-title" className="wordmark">WAR<span>TRACKER</span></h1>
   <p className="intro-copy">Consigne tes batailles. Étudie tes défaites.<br/>Forge la prochaine victoire.</p>
   <div className="ritual-rule" aria-hidden="true">✧</div>
  </section>
  <div className="campaign-grid">
   <Link href="/40k" className="campaign-card"><span className="eyebrow">I — LE LOINTAIN FUTUR</span><span className="campaign-symbol" aria-hidden="true">✣</span><h2>Warhammer <em>40,000</em></h2><p>Armées, missions et chroniques de la longue guerre.</p><span className="card-action">Ouvrir les archives <span aria-hidden="true">↗</span></span></Link>
   <Link href="/fab" className="campaign-card campaign-card-blood"><span className="eyebrow">II — LA CHAIR & LE SANG</span><span className="campaign-symbol" aria-hidden="true">⟡</span><h2>Flesh <em>and Blood</em></h2><p>Héros, decks et mémoire de chaque affrontement.</p><span className="card-action">Ouvrir les archives <span aria-hidden="true">↗</span></span></Link>
  </div><p className="sanctum-motto">LA MÉMOIRE EST UNE ARME. AIGUISE-LA.</p>
 </main>;
}
