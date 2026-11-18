export type UnitProfile = {
    movement: string;
    toughness: string;
    save: string;
    wounds: string;
    leadership: string;
    objectiveControl: string;
};
export type AlnUnit = {
    position: number;
    name: string;
    category: string;
    models: number;
    points: number;
    leader: boolean;
    attachedToPosition: number | null;
    profile: UnitProfile | null;
    equipment: string[];
    enhancements: string[];
    weapons: string[];
};
export type AlnRoster = {
    name: string;
    faction: string;
    detachment: string;
    units: AlnUnit[];
    declaredPoints: number | null;
    declaredModels: number | null;
    declaredUnits: number | null;
    warnings: string[];
};
export function unitKey(name: string) { return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").toLocaleLowerCase("fr").replace(/[^a-z0-9]+/g, " ").trim(); }
const heading = /^M\s+E\s+S[Vv]\s+PV\s+(?:CD|Cd)\s+(?:CO|OC)$/i;
const section = /^(?:Ligne|Infanterie|V[ée]hicules?|Personnages?|Transports? assign[ée]s?|Mont[ée]s?|B[êe]tes?|Monstres?|Fortifications?|Autres|[ÉE]lite|Soutien|Attaque rapide|QG|Alli[ée]s?)$/iu;
export function parseAlnText(text: string): AlnRoster {
    const lines = text.normalize("NFC").replace(/\u00a0/g, " ").split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
    const title = lines.find(l => /\[[^\]]+\]/.test(l)) || "";
    const faction = title.match(/\[([^\]]+)\]/)?.[1] || "";
    const name = title.includes("]") ? title.slice(title.indexOf("]") + 1).trim() : "Liste ALN";
    const detachAt = lines.findIndex(l => /^D[ée]tachement$/i.test(l));
    let detachment = "";
    if (detachAt >= 0) {
        const area = lines.slice(detachAt + 1, detachAt + 5);
        const costLine = area.find(l => /\(\d+ points?\)/i.test(l));
        if (costLine)
            detachment = costLine.split(/\(\d+ points?\)/i)[0].replace(new RegExp("^" + faction.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&") + "\\s*-\\s*"), "").trim();
    }
    const totalLine = lines.find(l => /\d+\s+points?\s*[-–—]/i.test(l) && /figurines?|unit[ée]s?/i.test(l));
    const number = (pattern: RegExp) => { const value = totalLine?.match(pattern)?.[1]; return value ? Number(value) : null; };
    const result: AlnRoster = { name: name || "Liste ALN", faction, detachment, units: [], declaredPoints: number(/(\d+)\s+points?/i), declaredModels: number(/(\d+)\s+figurines?/i), declaredUnits: number(/(\d+)\s+unit[ée]s?/i), warnings: [] };
    let category = "Autres", lastBase: number | null = null;
    for (let i = 0; i < lines.length; i++) {
        if (section.test(lines[i]))
            category = lines[i];
        if (!heading.test(lines[i]))
            continue;
        let header = lines[i - 1] || "";
        // Some ALN PDFs draw the right-aligned points slightly above the name.
        if (!/\s\d+(?:\s*(?:pts?|points?))?$/i.test(header) && /^\d+$/.test(lines[i - 2] || ""))
            header += " " + lines[i - 2];
        const match = header.match(/^(.*?)(?:\s+\((\d+)\))?\s+(\d+)(?:\s*(?:pts?|points?))?$/i);
        if (!match) {
            result.warnings.push("Fiche non reconnue près de : " + header);
            continue;
        }
        const leader = /^Meneur\s*:/i.test(match[1]);
        const unitName = match[1].replace(/^Meneur\s*:\s*/i, "").trim();
        const models = match[2] ? Number(match[2]) : 1, points = Number(match[3]);
        if (!unitName || !models || models > 1000 || points > 100000) {
            result.warnings.push("Fiche incohérente : " + header);
            continue;
        }
        const values = (lines[i + 1] || "").split(/\s+/);
        const profile = values.length === 6 ? { movement: values[0], toughness: values[1], save: values[2], wounds: values[3], leadership: values[4], objectiveControl: values[5] } : null;
        if (!profile)
            result.warnings.push("Profil incomplet : " + unitName);
        let end = i + 2;
        while (end < lines.length && !heading.test(lines[end]) && !/^Total$/i.test(lines[end]))
            end++;
        const block = lines.slice(i + 2, end);
        const equipmentLine = block.find(l => /^[ÉE]quipement\s*:/i.test(l));
        const equipment = equipmentLine ? equipmentLine.replace(/^[ÉE]quipement\s*:\s*/i, "").split(/,\s*/).filter(Boolean) : [];
        const enhancements = block.filter(l => /^Optimisations?\s*:/i.test(l)).map(l => l.replace(/^Optimisations?\s*:\s*/i, ""));
        const weaponStart = block.findIndex(l => /^Port[ée]e\s+A\s+/i.test(l)), weaponEnd = block.findIndex(l => /^[ÉE]quipement\s*:/i.test(l));
        const weapons = weaponStart >= 0 && weaponEnd > weaponStart ? block.slice(weaponStart + 1, weaponEnd) : [];
        const position = result.units.length;
        result.units.push({ position, name: unitName, category: leader ? "Personnage" : category, models, points, leader, attachedToPosition: leader ? lastBase : null, profile, equipment, enhancements, weapons });
        if (!leader)
            lastBase = position;
    }
    if (!result.units.length)
        throw new Error("Aucune fiche d’unité ALN reconnue. Utilise un export PDF ALN avec texte et profils M / E / SV / PV / CD / CO. Les scans nécessitent un OCR.");
    const bases = result.units.filter(u => !u.leader), total = result.units.reduce((s, u) => s + u.points, 0), models = result.units.reduce((s, u) => s + u.models, 0);
    if (result.declaredPoints !== null && result.declaredPoints !== total)
        result.warnings.push("Points différents du total ALN : " + total + " calculés / " + result.declaredPoints + " annoncés. Vérifie les fiches et les optimisations avant d’enregistrer.");
    if (result.declaredUnits !== null && result.declaredUnits !== bases.length && result.declaredUnits !== result.units.length)
        result.warnings.push("Nombre d’unités différent du total ALN. Vérifie les meneurs et les fiches manquantes.");
    if (result.declaredModels !== null && result.declaredModels !== models) {
        const baseModels = bases.reduce((s, u) => s + u.models, 0);
        result.warnings.push(result.declaredModels === baseModels ? "Le total de figurines ALN exclut les meneurs : " + baseModels + " hors meneurs, " + models + " en les incluant." : "Effectif différent du total ALN : " + models + " calculés / " + result.declaredModels + " annoncés.");
    }
    return result;
}
