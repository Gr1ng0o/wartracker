import { MISSION_PACK, MISSION_GUIDE_SOURCE, MISSION_GROUPS, TERRAIN_GROUPS, SETUP_STEPS } from "@/lib/40k-missions";

type MissionValues = { missionPack?: string | null; primaryMission?: string | null; deployment?: string | null; terrainLayout?: string | null };
function HistoricalOption({ value, choices }: {value?: string | null; choices: readonly string[]}) {
    return value && !choices.includes(value) ? <option value={value}>{value} (valeur enregistrée)</option> : null;
}
export default function MissionSelection({ initial = {}, disabled = false }: {initial?: MissionValues; disabled?: boolean}) {
    return <fieldset disabled={disabled} className="mission-selection">
        <legend>Mission et terrain · V11</legend>
        <div className="new-game-grid">
            <label>Pack de missions<select name="missionPack" defaultValue={initial.missionPack ?? ""}>
                <option value="">Sélectionner un pack</option>
                <HistoricalOption value={initial.missionPack} choices={[MISSION_PACK]} />
                <option>{MISSION_PACK}</option>
            </select></label>
            <label>Ma mission primaire<select name="primaryMission" defaultValue={initial.primaryMission ?? ""}>
                <option value="">Sélectionner une mission</option>
                <HistoricalOption value={initial.primaryMission} choices={MISSION_GROUPS.flatMap(group => [...group.missions])} />
                {MISSION_GROUPS.map(group => <optgroup key={group.disposition} label={`${group.disposition} · ${group.label}`}>
                    {group.missions.map(mission => <option key={mission}>{mission}</option>)}
                </optgroup>)}
            </select></label>
            <label>Mon rôle au déploiement<select name="deployment" defaultValue={initial.deployment ?? ""}>
                <option value="">Sélectionner un rôle</option>
                <HistoricalOption value={initial.deployment} choices={["Attaquant", "Défenseur"]} />
                <option>Attaquant</option><option>Défenseur</option>
            </select></label>
            <label>Layout de terrain · appariement des dispositions<select name="terrainLayout" defaultValue={initial.terrainLayout ?? ""}>
                <option value="">Sélectionner un layout A/B/C</option>
                <HistoricalOption value={initial.terrainLayout} choices={TERRAIN_GROUPS.flatMap(group => group.layouts)} />
                {TERRAIN_GROUPS.map(group => <optgroup key={group.pairing} label={group.pairing}>
                    {group.layouts.map(layout => <option key={layout}>{layout}</option>)}
                </optgroup>)}
            </select></label>
        </div>
        <p className="intro-copy">Choix issus du guide fourni le 22/11/2026, pour le jeu égal à 2 000 points. Chaque joueur a sa primaire : vérifie l’attribution sur les cartes après avoir croisé les dispositions. Le choix du rôle ne détermine pas qui joue en premier.</p>
        <details>
            <summary>Préparer la table et vérifier le score</summary>
            <p className="intro-copy">Table de 60 × 44 pouces (152,4 × 111,76 cm). Les 15 appariements ont chacun trois variantes A/B/C. Dans la séquence Event Companion, les layouts remplacent les cartes de déploiement et les Twist du deck standard.</p>
            <ol>{SETUP_STEPS.map(step => <li key={step}>{step}</li>)}</ol>
            <div className="roster-table-scroll"><table><caption>Repères de score du guide</caption><thead><tr><th>Source</th><th>Plafond</th></tr></thead><tbody>
                <tr><td>Primaires</td><td>45 PV · 15 PV par round</td></tr>
                <tr><td>Secondaires</td><td>45 PV · 15 PV par round</td></tr>
                <tr><td>Secondaires fixes</td><td>20 PV par carte fixe</td></tr>
                <tr><td>Armée Battle Ready</td><td>10 PV</td></tr>
                <tr><td>Total</td><td>100 PV</td></tr>
            </tbody></table></div>
            <p className="intro-copy">Les PV de fin de bataille ne sont pas soumis au plafond de 15 PV d’un round. Les cartes et le règlement de l’organisateur précisent les conditions et adaptations.</p>
            <p className="intro-copy">Secondaires tactiques : tirer deux cartes au début de chaque phase de commandement. Une fois par bataille, remplacer une secondaire active coûte 1 PC en fin de phase de commandement. La défausse en fin de tour peut accorder 1 PC ; hors PC fondamentaux, le gain supplémentaire est limité à 1 PC par round.</p>
            <a href={MISSION_GUIDE_SOURCE} target="_blank" rel="noreferrer">Ouvrir l’Event Companion : plans cotés et FAQ →</a>
        </details>
    </fieldset>;
}
