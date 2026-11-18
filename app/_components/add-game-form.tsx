"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import heroes from "@/lib/fab-heroes.json";
import DrivePhoto, { DriveLinkField } from "./drive-photo";
import ArmySelection from "./army-selection";

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

export default function AddGameForm({ gameType, savedRosters = [], initialGame }: {
    gameType: "40k" | "FaB";
    savedRosters?: SavedRoster[];
    initialGame?: Record<string, any>;
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const router = useRouter();
    const is40k = gameType === "40k";

    async function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        const form = new FormData(event.currentTarget);
        const status = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") || "in_progress";
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const [myRoster, opponentRoster] = is40k
                ? await Promise.all(sides.map(side => readRoster(form, side)))
                : [undefined, undefined];
            const data = Object.fromEntries(
                Array.from(form.entries()).filter(([name]) => !name.endsWith("Saved") && !name.endsWith("Pdf")),
            );
            const response = await fetch(initialGame ? `/api/games/${initialGame.id}` : "/api/games", {
                method: initialGame ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data, gameType, myRoster, opponentRoster, status,
                    opponent: data.opponent || (status === "in_progress" ? "À renseigner" : ""),
                    build: data.build || (status === "in_progress" ? "Partie en cours" : ""),
                    photoUrls: String(form.get("photoUrlsText") || "").split("\n").map(value => value.trim()).filter(Boolean),
                    myDetachment: form.getAll("myDetachment").join(" · "),
                    oppDetachment: form.getAll("oppDetachment").join(" · "),
                    first: form.has("first"),
                    playedAt: data.playedAt ? new Date(String(data.playedAt)).toISOString() : undefined,
                }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Enregistrement impossible.");
            setMessage(status === "in_progress" ? "Partie enregistrée en cours." : "Partie validée.");
            router.push((is40k ? "/40k/games/" : "/games/") + body.id);
            router.refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    }

    return <main className="sanctum new-game">
        <p className="eyebrow">{is40k ? "WARHAMMER 40,000" : "FLESH AND BLOOD"} / CONSIGNER</p>
        <h1>{initialGame ? "Modifier la partie" : "Une nouvelle bataille"}</h1>
        <p className="eyebrow">{!initialGame || initialGame.result.startsWith("IN_PROGRESS") ? "En cours" : "Partie validée"}</p>
        {is40k && <p className="intro-copy">Ajoute les listes des deux camps pour les comparer après avoir enregistré la partie.</p>}
        {message && <p role="status">{message}</p>}
        {error && <p role="alert" className="media-error">{error}</p>}
        <form onSubmit={save}>
            <fieldset disabled={saving}>
                <legend>La bataille</legend>
                <div className="new-game-grid">
                    <label>Adversaire<input defaultValue={initialGame?.opponent ?? ""} name="opponent" required maxLength={200} /></label>
                    <label>Date de la partie<input defaultValue={initialGame?.playedAt?.slice(0, 10) ?? ""} name="playedAt" type="date" required /></label>
                    {is40k ? <label>Nom de la partie ou de la liste<input defaultValue={initialGame?.build ?? ""} name="build" required maxLength={200} /></label> : <>
                        <label>Mon héros<select name="build" required defaultValue={initialGame?.build || ""}><option value="">Sélectionner un héros</option>{initialGame?.build && ![...heroes.heroes, ...heroes.livingLegend].includes(initialGame.build) && <option>{initialGame.build}</option>}<optgroup label="Classic Constructed — référentiel"><>{heroes.heroes.map(hero => <option key={hero}>{hero}</option>)}</></optgroup><optgroup label="Format Living Legend">{heroes.livingLegend.map(hero => <option key={hero}>{hero}</option>)}</optgroup></select></label>
                        <label>Héros adverse<select name="oppFaction" defaultValue={initialGame?.oppFaction || ""}><option value="">Sélectionner un héros</option>{initialGame?.oppFaction && ![...heroes.heroes, ...heroes.livingLegend].includes(initialGame.oppFaction) && <option>{initialGame.oppFaction}</option>}<optgroup label="Classic Constructed — référentiel">{heroes.heroes.map(hero => <option key={hero}>{hero}</option>)}</optgroup><optgroup label="Format Living Legend">{heroes.livingLegend.map(hero => <option key={hero}>{hero}</option>)}</optgroup></select></label>
                        <p className="intro-copy">Héros du référentiel du 18/11/2026. Les héros Living Legend sont inclus pour ce format ; vérifie la légalité selon ton format.</p>
                    </>}
                    {is40k
                        ? <label>Format<select name="points" defaultValue={initialGame?.points || "2000"}><option>1000</option><option>1500</option><option>2000</option></select></label>
                        : <label>Résultat<select name="result" defaultValue={initialGame?.result?.startsWith("IN_PROGRESS") ? initialGame.result.split(":")[1] || "W" : initialGame?.result || "W"}><option value="W">Victoire</option><option value="L">Défaite</option><option value="D">Égalité</option></select></label>}
                </div>
                <label className="first-turn"><input name="first" type="checkbox" defaultChecked={initialGame?.first ?? true} /> J’ai joué en premier</label>
            </fieldset>
            {is40k && <>
                <div className="new-game-grid">
                    {sides.map(side => <fieldset key={side.name} disabled={saving} className="new-game-army">
                        <legend>{side.label}</legend>
                        <label>Score de la partie<input name={side.score} type="number" min="0" max="1000" defaultValue={initialGame?.[side.score] ?? "0"} required /></label>
                        {savedRosters.length > 0 && <label>Liste enregistrée<select name={side.name + "Saved"}>
                            <option value="">Choisir dans la bibliothèque</option>
                            {savedRosters.map(roster => <option key={roster.id} value={roster.id}>{roster.name} · {roster.faction}</option>)}
                        </select></label>}
                        <label>PDF ALN (4 Mo max.)<input name={side.name + "Pdf"} type="file" accept="application/pdf,.pdf" /></label>
                        <ArmySelection factionName={side.faction} detachmentName={side.detachment} initialFaction={initialGame?.[side.faction] || ""} initialDetachments={initialGame?.[side.detachment] || ""} />
                        <details>
                            <summary>Texte de liste</summary>
                            <label>Texte de la liste<textarea defaultValue={initialGame?.[side.text] || ""} name={side.text} maxLength={10000} /></label>
                        </details>
                    </fieldset>)}
                </div>
                <fieldset disabled={saving}>
                    <legend>Mission et terrain</legend>
                    <div className="new-game-grid">
                        {[["missionPack", "Pack de missions"], ["primaryMission", "Mission principale"], ["deployment", "Déploiement"], ["terrainLayout", "Terrain"]].map(([name, label]) => <label key={name}>{label}<input defaultValue={initialGame?.[name] || ""} name={name} maxLength={200} /></label>)}
                    </div>
                </fieldset>
                <details>
                    <summary>Notes par tour</summary>
                    <div className="new-game-grid">
                        {turns.map(turn => <label key={turn}>{turn === "deployment" ? "Déploiement" : "Tour " + turn.slice(1)}<textarea defaultValue={initialGame?.[turn + "Notes"] || ""} name={turn + "Notes"} /></label>)}
                    </div>
                </details>
            </>}
            {(initialGame?.score != null || !is40k) && <label>Score<input type="number" name="score" defaultValue={initialGame?.score ?? ""} /></label>}
            {(initialGame?.tag1 || initialGame?.tag2) && <div className="new-game-grid"><label>Tag 1<input name="tag1" defaultValue={initialGame?.tag1 || ""} /></label><label>Tag 2<input name="tag2" defaultValue={initialGame?.tag2 || ""} /></label></div>}
            <label>Enseignements de la partie<textarea defaultValue={initialGame?.notes || ""} name="notes" rows={5} /></label>
            <fieldset disabled={saving}>
                <legend>Photos et documents Google Drive</legend>
                {[["scoreSheetUrl", "Feuille de score"], ["myArmyPdfUrl", "Ma liste PDF"], ["oppArmyPdfUrl", "Liste adverse PDF"], ...turns.map(turn => [turn + "PhotoUrl", turn === "deployment" ? "Photo du déploiement" : "Photo du tour " + turn.slice(1)])].map(([name, label]) => <DriveLinkField key={name} name={name} label={label} initialValue={initialGame?.[name] || ""} photo={name.endsWith("PhotoUrl")} />)}
                <label>Autres photos (un lien par ligne)<textarea name="photoUrlsText" defaultValue={(initialGame?.photoUrls || []).join("\n")} /></label>
                {(initialGame?.photoUrls || []).map((url: string) => <DrivePhoto key={url} url={url} label="Photo de la partie" />)}
                <p className="intro-copy">Les photos Drive doivent être partagées avec « Toute personne ayant le lien ».</p>
            </fieldset>
            <button disabled={saving} type="submit" formNoValidate value="in_progress">{saving ? "Enregistrement…" : "Enregistrer en cours"}</button>
            <button disabled={saving} type="submit" value="submitted">Valider la partie →</button>
        </form>
    </main>;
}
