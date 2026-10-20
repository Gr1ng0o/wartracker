"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AlnRoster, AlnUnit } from "@/lib/aln-parser";
import type { unitStatistics } from "@/lib/unit-statistics";
type Draft = AlnRoster & {
    importKey: string;
    sourceHash: string;
};
type Saved = Draft & {
    id: string;
    side: string;
    gameId: string | null;
};
type Game = {
    id: string;
    opponent: string;
    createdAt: string;
};
async function api(url: string, options?: RequestInit) { const res = await fetch(url, { ...options, cache: "no-store" }); const data = await res.json(); if (!res.ok)
    throw Object.assign(new Error(data.error || "Opération impossible."), { status: res.status }); return data; }
export default function RosterLibrary({ initialGameId }: {
    initialGameId: string;
}) {
    const [locked, setLocked] = useState(true), [password, setPassword] = useState("");
    const [draft, setDraft] = useState<Draft | null>(null), [rosters, setRosters] = useState<Saved[]>([]), [games, setGames] = useState<Game[]>([]);
    const [gameId, setGameId] = useState(initialGameId), [side, setSide] = useState("my"), [statsSide, setStatsSide] = useState("my"), [stats, setStats] = useState<ReturnType<typeof unitStatistics>>([]), [rosteredGames, setRosteredGames] = useState(0);
    const [reviewed, setReviewed] = useState(false), [replace, setReplace] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
    const requests = useRef(0);
    const load = useCallback(async () => { const id = ++requests.current; try {
        const [library, statistics] = await Promise.all([api("/api/rosters?" + new URLSearchParams({ gameId })), api("/api/rosters/statistics?side=" + statsSide)]);
        if (id !== requests.current)
            return;
        setRosters(library.rosters);
        setGames(library.games);
        setStats(statistics.units);
        setRosteredGames(statistics.rosteredGames);
        setLocked(false);
    }
    catch (e) {
        if (id !== requests.current)
            return;
        if (e instanceof Error && "status" in e && e.status === 401)
            setLocked(true);
        setError(e instanceof Error ? e.message : "Chargement impossible.");
    } }, [gameId, statsSide]);
    useEffect(() => { const counter = requests; const timer = setTimeout(() => { void load(); }, 0); return () => { clearTimeout(timer); counter.current++; }; }, [load]);
    function report(e: unknown) { if (e instanceof Error && "status" in e && e.status === 401) {
        setLocked(true);
        setRosters([]);
        setStats([]);
    } setError(e instanceof Error ? e.message : "Opération impossible."); }
    async function unlock(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try {
        await api("/api/media/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        setPassword("");
        await load();
    }
    catch (e) {
        report(e);
    }
    finally {
        setBusy(false);
    } }
    async function parse(file: File | undefined) { if (!file)
        return; setDraft(null); setReviewed(false); setReplace(false); setError(""); setMessage(""); if (file.size > 4 * 1024 * 1024) {
        setError("Le PDF doit faire moins de 4 Mo.");
        return;
    } setBusy(true); try {
        const form = new FormData();
        form.append("file", file);
        setDraft(await api("/api/rosters/preview", { method: "POST", body: form }));
    }
    catch (e) {
        report(e);
    }
    finally {
        setBusy(false);
    } }
    function changeUnit(position: number, change: Partial<AlnUnit>) { setDraft(old => old ? { ...old, units: old.units.map((u, i) => i === position ? { ...u, ...change } : u) } : null); setReviewed(false); }
    async function save() { if (!draft || !reviewed)
        return; setBusy(true); setError(""); setMessage(""); try {
        await api("/api/rosters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, gameId: gameId || null, side, replace }) });
        setDraft(null);
        setMessage(gameId ? "Liste enregistrée pour cette partie. Les statistiques sont actualisées." : "Liste enregistrée dans la bibliothèque. Rattache une copie à une partie pour alimenter les statistiques.");
        await load();
    }
    catch (e) {
        report(e);
    }
    finally {
        setBusy(false);
    } }
    const total = draft?.units.reduce((s, u) => s + u.points, 0) || 0;
    return <main className="sanctum roster-library"><p className="eyebrow">WARHAMMER 40,000 / ORDRE DE BATAILLE</p><h1>Listes & statistiques</h1><p className="intro-copy">Importe un PDF ALN, vérifie les fiches puis associe ta liste à une partie. Les doublons et les meneurs sont conservés.</p>
 {error && <p role="alert" className="media-error">{error}</p>}{message && <p role="status" className="roster-message">{message}</p>}
 {locked ? <form className="media-unlock" onSubmit={unlock}><label htmlFor="roster-password">Code d’accès (le même que la médiathèque)</label><input id="roster-password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}/><button disabled={busy}>Ouvrir les listes</button></form> : <>
 <div className="roster-controls"><label>Partie<select value={gameId} disabled={busy} onChange={e => { setGameId(e.target.value); setReviewed(false); setReplace(false); }}><option value="">Bibliothèque / sans partie</option>{games.map(g => <option value={g.id} key={g.id}>{new Date(g.createdAt).toLocaleDateString("fr-FR")} — {g.opponent} · {g.id.slice(-6)}</option>)}</select></label><label>Liste à importer<select value={side} disabled={busy} onChange={e => { setSide(e.target.value); setReviewed(false); }}><option value="my">Mon armée</option><option value="opponent">Armée adverse</option></select></label></div>
 <div className="media-dropzone"><label>Choisir un PDF ALN (4 Mo maximum)<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e => { void parse(e.target.files?.[0]); e.target.value = ""; }}/></label><p className="intro-copy">Le PDF est lu pour extraire les fiches. Il n’est pas conservé dans le stockage. Les scans et les exports sans profils ne sont pas pris en charge.</p>{busy && <p role="status">Traitement en cours…</p>}</div>
 {draft && <section className="roster-review"><h2>Vérifier avant d’enregistrer</h2><div className="roster-controls"><label>Nom de la liste<input value={draft.name} maxLength={200} onChange={e => { setDraft({ ...draft, name: e.target.value }); setReviewed(false); }}/></label><label>Faction<input value={draft.faction} maxLength={200} onChange={e => { setDraft({ ...draft, faction: e.target.value }); setReviewed(false); }}/></label><label>Détachement<input value={draft.detachment} maxLength={300} onChange={e => { setDraft({ ...draft, detachment: e.target.value }); setReviewed(false); }}/></label></div>
 <p className="roster-message">{draft.units.length} fiches · {draft.units.filter(u => !u.leader).length} unités hors meneurs · {draft.units.filter(u => u.leader).length} meneurs · {draft.units.reduce((s, u) => s + u.models, 0)} figurines · <strong>{total} points</strong>{draft.declaredPoints !== null && " / " + draft.declaredPoints + " points annoncés par ALN"}</p>
 {draft.warnings.map((warning, i) => <p role="status" className="roster-warning" key={i}>{warning}</p>)}{draft.declaredPoints !== null && total !== draft.declaredPoints && <p className="media-error">Le total calculé ne correspond pas au total ALN. Corrige les fiches ou confirme cette différence en connaissance de cause.</p>}
 <div className="roster-unit-grid">{draft.units.map((u, index) => <article className="roster-unit" key={index}><span className="eyebrow">{u.category} / FICHE {index + 1}</span><label>Unité<input value={u.name} maxLength={200} onChange={e => changeUnit(index, { name: e.target.value })}/></label><div className="roster-controls"><label>Figurines<input type="number" min="1" max="1000" value={u.models} onChange={e => changeUnit(index, { models: Number(e.target.value) })}/></label><label>Points<input type="number" min="0" max="100000" value={u.points} onChange={e => changeUnit(index, { points: Number(e.target.value) })}/></label></div>
 {u.leader && <label>Meneur attaché à<select value={u.attachedToPosition ?? ""} onChange={e => changeUnit(index, { attachedToPosition: e.target.value === "" ? null : Number(e.target.value) })}><option value="">Non attaché / à vérifier</option>{draft.units.filter(base => !base.leader && base.position < index).map(base => <option key={base.position} value={base.position}>Fiche {base.position + 1} — {base.name}</option>)}</select></label>}
 <details><summary>Profil et équipement</summary>{u.profile && <p className="roster-profile">M {u.profile.movement} · E {u.profile.toughness} · SV {u.profile.save} · PV {u.profile.wounds} · CD {u.profile.leadership} · CO {u.profile.objectiveControl}</p>}<ul>{u.equipment.map((item, i) => <li key={i}>{item}</li>)}{u.enhancements.map((item, i) => <li key={"e" + i}>Optimisation : {item}</li>)}</ul><ul>{u.weapons.map((item, i) => <li key={i}>{item}</li>)}</ul></details></article>)}</div>
 <label className="roster-checkbox"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)}/> J’ai vérifié les unités, les attachements, les points et les avertissements.</label>{gameId && <label className="roster-checkbox"><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)}/> Remplacer la liste déjà associée à ce camp pour cette partie.</label>}<button disabled={busy || !reviewed} onClick={() => void save()}>Enregistrer toutes les unités →</button>
 </section>}
 <section><h2>{gameId ? "Listes de cette partie" : "Bibliothèque de listes (100 plus récentes)"}</h2>{rosters.length === 0 && <p className="intro-copy">Aucune liste enregistrée ici.</p>}<div className="roster-unit-grid">{rosters.map(roster => <article className="roster-unit" key={roster.id}><p className="eyebrow">{roster.side === "my" ? "MON ARMÉE" : "ARMÉE ADVERSE"}</p><h3>{roster.name}</h3><p>{roster.faction} · {roster.detachment}</p><p>{roster.units.length} fiches · {roster.units.reduce((s, u) => s + u.points, 0)} points</p><details><summary>Voir les unités</summary><ul>{roster.units.map(u => <li key={u.position}>{u.name} × {u.models} — {u.points} pts {u.leader ? "(meneur)" : ""}</li>)}</ul></details><button disabled={busy} onClick={() => { setDraft({ ...roster, importKey: crypto.randomUUID(), warnings: [] }); setReviewed(false); setReplace(false); setMessage("Copie chargée dans l’aperçu. Choisis la partie et le camp avant de l’enregistrer."); }}>Réutiliser cette liste</button></article>)}</div></section>
 <section><h2>Statistiques par unité</h2><label>Camp analysé<select value={statsSide} disabled={busy} onChange={e => setStatsSide(e.target.value)}><option value="my">Mes armées</option><option value="opponent">Armées adverses</option></select></label><p className="intro-copy">{rosteredGames} parties avec liste pour ce camp. Une partie compte une fois par type d’unité, même avec plusieurs exemplaires. Victoires / défaites du camp choisi ; taux sur les parties décisives. Les listes sans partie sont exclues. Le score moyen est celui de l’armée, pas celui de l’unité.</p>
 <div className="roster-table-scroll"><table><thead><tr><th>Unité / faction</th><th>Parties</th><th>V / D / N</th><th>Victoires</th><th>Exemplaires / partie</th><th>Points / partie</th><th>Score armée moyen</th></tr></thead><tbody>{stats.map(row => <tr key={row.faction + row.name}><td>{row.name}<small>{row.faction}</small></td><td>{row.games}</td><td>{row.wins} / {row.losses} / {row.draws}</td><td>{row.winRate === null ? "—" : row.winRate + " %"}</td><td>{row.averageCopies.toFixed(1)}</td><td>{row.averagePoints.toFixed(0)}</td><td>{row.averageArmyScore === null ? "—" : row.averageArmyScore.toFixed(1)}</td></tr>)}</tbody></table></div>{stats.length === 0 && <p className="intro-copy">Associe une liste à une partie pour démarrer les statistiques.</p>}<p className="intro-copy">Ces associations décrivent ton historique ; elles ne mesurent pas l’effet causal d’une unité sur la victoire. Éliminations, survie et points d’objectif individuels ne figurent pas dans le PDF.</p></section>
 <Link className="media-detail-link" href={"/media" + (gameId ? "?gameId=" + gameId : "")}>Ajouter les photos et vidéos →</Link>
 </>}
 </main>;
}
