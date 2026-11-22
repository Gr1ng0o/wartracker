"use client";
import { useState } from "react";
import catalog from "@/lib/40k-factions.json";

const factions: Record<string, string[]> = catalog.factions;

export default function ArmySelection({ factionName, detachmentName, initialFaction = "", initialDetachments = "" }: { factionName: string; detachmentName: string; initialFaction?: string; initialDetachments?: string }) {
    const [faction, setFaction] = useState(initialFaction);
    const [selected, setSelected] = useState<string[]>(initialDetachments.split(" · ").filter(Boolean));
    const available = (factions[faction] || []).filter(name => !selected.includes(name)).sort((a, b) => a.localeCompare(b, "fr"));
    return <>
        <label>Faction<select name={factionName} value={faction} onChange={event => { setFaction(event.target.value); setSelected([]); }}>
            <option value="">Sélectionner une faction</option>
            {[...new Set([...Object.keys(factions), ...(faction ? [faction] : [])])].sort((a, b) => a.localeCompare(b, "fr")).map(name => <option key={name}>{name}</option>)}
        </select></label>
        <label>Ajouter un détachement<select value="" disabled={!faction || !available.length} onChange={event => {
            const name = event.target.value;
            if (name) setSelected(previous => [...previous, name]);
        }}>
            <option value="">Sélectionner un détachement</option>
            {available.map(name => <option key={name}>{name}</option>)}
        </select></label>
        {selected.map(name => <div key={name}>
            <input type="hidden" name={detachmentName} value={name} />
            <span>{name} </span>
            <button type="button" aria-label={`Retirer ${name}`} onClick={() => setSelected(previous => previous.filter(value => value !== name))}>Retirer</button>
        </div>)}
        <p className="intro-copy">{faction && !factions[faction]?.length ? "Aucun détachement dans le catalogue officiel pour cette faction." : `${selected.length} détachement(s) sélectionné(s). Tu peux en ajouter plusieurs.`}</p>
        <p className="intro-copy">V11 · Choix du référentiel fourni le 18/11/2026.</p>
    </>;
}
