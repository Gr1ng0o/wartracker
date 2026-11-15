"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const turns = ["deployment", "t1", "t2", "t3", "t4", "t5"];
const sides = [
    { name: "my", label: "Mon armée", faction: "myFaction", detachment: "myDetachment", score: "myScore", text: "myListText" },
    { name: "opponent", label: "Armée adverse", faction: "oppFaction", detachment: "oppDetachment", score: "oppScore", text: "oppListText" },
] as const;
type SavedRoster = { id: string; name: string; faction: string };

async function readRoster(form: FormData, side: (typeof sides)[number]) {
    const file = form.get(side.name + "Pdf");
    const savedId = String(form.get(side.name + "Saved") || "");
    if (!(file instanceof File) || !file.size) return savedId ? { savedId } : undefined;
    if (savedId) throw new Error(side.label + " — choisis un PDF ou une liste enregistrée.");
    if (file.size > 4 * 1024 * 1024) throw new Error(side.label + " — le PDF dépasse 4 Mo.");

    const upload = new FormData();
    upload.set("file", file);
    const response = await fetch("/api/rosters/preview", { method: "POST", body: upload });
    const draft = await response.json().catch(() => null);
    if (!response.ok) throw new Error(side.label + " — " + (draft?.error || "Lecture du PDF impossible."));
    return { draft };
}

export default function AddGameForm({ gameType, savedRosters = [] }: {
    gameType: "40k" | "FaB";
    savedRosters?: SavedRoster[];
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const is40k = gameType === "40k";

    async function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        const form = new FormData(event.currentTarget);
        setSaving(true);
        setError("");
        try {
            const [myRoster, opponentRoster] = is40k
                ? await Promise.all(sides.map(side => readRoster(form, side)))
                : [undefined, undefined];
            const data = Object.fromEntries(
                Array.from(form.entries()).filter(([name]) => !name.endsWith("Saved") && !name.endsWith("Pdf")),
            );
            const response = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data, gameType, myRoster, opponentRoster,
                    first: form.has("first"),
                    playedAt: data.playedAt ? new Date(String(data.playedAt)).toISOString() : undefined,
                }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Enregistrement impossible.");
            router.push((is40k ? "/40k/lists?gameId=" : "/media?gameId=") + body.id);
            router.refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    }

    return <main className="sanctum new-game">
        <p className="eyebrow">{is40k ? "WARHAMMER 40,000" : "FLESH AND BLOOD"} / CONSIGNER</p>
        <h1>Une nouvelle bataille</h1>
        {is40k && <p className="intro-copy">Ajoute les listes des deux camps pour les comparer après avoir enregistré la partie.</p>}
        {error && <p role="alert" className="media-error">{error}</p>}
        <form onSubmit={save}>
            <fieldset disabled={saving}>
                <legend>La bataille</legend>
                <div className="new-game-grid">
                    <label>Adversaire<input name="opponent" required maxLength={200} /></label>
                    <label>Date de la partie<input name="playedAt" type="datetime-local" required /></label>
                    <label>{is40k ? "Nom de la partie ou de la liste" : "Deck / héros"}<input name="build" required maxLength={200} /></label>
                    {is40k
                        ? <label>Format<select name="points" defaultValue="2000"><option>1000</option><option>1500</option><option>2000</option></select></label>
                        : <label>Résultat<select name="result"><option value="W">Victoire</option><option value="L">Défaite</option><option value="D">Égalité</option></select></label>}
                </div>
                <label className="first-turn"><input name="first" type="checkbox" defaultChecked /> J’ai joué en premier</label>
            </fieldset>
            {is40k && <>
                <div className="new-game-grid">
                    {sides.map(side => <fieldset key={side.name} disabled={saving} className="new-game-army">
                        <legend>{side.label}</legend>
                        <label>Score de la partie<input name={side.score} type="number" min="0" max="1000" defaultValue="0" required /></label>
                        {savedRosters.length > 0 && <label>Liste enregistrée<select name={side.name + "Saved"}>
                            <option value="">Choisir dans la bibliothèque</option>
                            {savedRosters.map(roster => <option key={roster.id} value={roster.id}>{roster.name} · {roster.faction}</option>)}
                        </select></label>}
                        <label>PDF ALN (4 Mo max.)<input name={side.name + "Pdf"} type="file" accept="application/pdf,.pdf" /></label>
                        <details>
                            <summary>Faction, détachement et texte de liste</summary>
                            <label>Faction<input name={side.faction} maxLength={200} /></label>
                            <label>Détachement<input name={side.detachment} maxLength={200} /></label>
                            <label>Texte de la liste<textarea name={side.text} maxLength={10000} /></label>
                        </details>
                    </fieldset>)}
                </div>
                <fieldset disabled={saving}>
                    <legend>Mission et terrain</legend>
                    <div className="new-game-grid">
                        {[["missionPack", "Pack de missions"], ["primaryMission", "Mission principale"], ["deployment", "Déploiement"], ["terrainLayout", "Terrain"]].map(([name, label]) => <label key={name}>{label}<input name={name} maxLength={200} /></label>)}
                    </div>
                </fieldset>
                <details>
                    <summary>Notes par tour</summary>
                    <div className="new-game-grid">
                        {turns.map(turn => <label key={turn}>{turn === "deployment" ? "Déploiement" : "Tour " + turn.slice(1)}<textarea name={turn + "Notes"} /></label>)}
                    </div>
                </details>
            </>}
            <label>Enseignements de la partie<textarea name="notes" rows={5} /></label>
            <button disabled={saving} type="submit">
                {saving ? (is40k ? "Analyse des listes et enregistrement…" : "Enregistrement…") : (is40k ? "Enregistrer la partie et les listes →" : "Enregistrer et ajouter des médias →")}
            </button>
        </form>
    </main>;
}
