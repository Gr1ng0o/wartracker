export const MISSION_PACK = "Chapter Approved 2026–27 · Event Companion v1.3";
export const MISSION_GUIDE_SOURCE = "https://assets.warhammer-community.com/eng_14-10_wh40k_event_companion-rdwnqprl4c-nj8oqogadv.pdf";
export const MISSION_GROUPS = [
    { disposition: "Take and Hold", label: "Contrôle du terrain", missions: ["Battlefield Dominance", "Immovable Object", "Determined Acquisition", "Purge and Secure", "Inescapable Dominion"] },
    { disposition: "Purge the Foe", label: "Destruction", missions: ["Unstoppable Force", "Meatgrinder", "Punishment", "Consecrate", "Destroyer’s Wrath"] },
    { disposition: "Disruption", label: "Sabotage", missions: ["Death Trap", "Delaying Action", "Outmanoeuvre", "Smoke and Mirrors", "Locate and Deny"] },
    { disposition: "Reconnaissance", label: "Reconnaissance", missions: ["Reconnaissance Sweep", "Triangulation", "Surveil the Foe", "Gather Intel", "Search and Scour"] },
    { disposition: "Priority Assets", label: "Actifs stratégiques", missions: ["Secure Asset", "Vital Link", "Extract Relic", "Vanguard Operation", "Sabotage"] },
] as const;
export const TERRAIN_GROUPS = MISSION_GROUPS.flatMap((left, index) => MISSION_GROUPS.slice(index).map(right => ({
    pairing: `${left.disposition} / ${right.disposition}`,
    layouts: ["A", "B", "C"].map(variant => `${left.disposition} / ${right.disposition} — ${variant}`),
})));
export const SETUP_STEPS = [
    "Inscrire la Disposition des Forces de chaque armée.",
    "Croiser les dispositions et lire la mission primaire de chaque joueur sur les cartes.",
    "Choisir le layout A/B/C selon l’organisateur ou le tirage.",
    "Placer les empreintes, décors, objectifs et zones selon le plan officiel.",
    "Déterminer l’Attaquant et le Défenseur ainsi que les bords de table.",
    "Choisir et révéler les secondaires Tactiques ou Fixes.",
    "Déclarer les transports et les réserves stratégiques.",
    "Déployer en alternance, en commençant par le Défenseur (règle spéciale TITANIC).",
    "Résoudre les redéploiements, en commençant par l’Attaquant.",
    "Déterminer le premier joueur, puis résoudre les effets avant-bataille.",
    "Commencer le premier des cinq rounds.",
];
