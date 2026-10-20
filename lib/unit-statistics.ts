import { unitKey } from "./aln-parser";
type Roster = {
    id: string;
    faction: string;
    side: string;
    game: {
        id: string;
        result: string;
        myScore: number | null;
        oppScore: number | null;
    } | null;
    units: {
        name: string;
        points: number;
        models: number;
    }[];
};
export function unitStatistics(rosters: Roster[]) {
    const stats = new Map<string, {
        name: string;
        faction: string;
        games: number;
        wins: number;
        losses: number;
        draws: number;
        unknown: number;
        copies: number;
        models: number;
        points: number;
        scored: number;
        scoreGames: number;
    }>();
    for (const roster of rosters) {
        if (!roster.game)
            continue;
        const grouped = new Map<string, {
            name: string;
            copies: number;
            models: number;
            points: number;
        }>();
        for (const unit of roster.units) {
            const key = unitKey(unit.name);
            const value = grouped.get(key) || { name: unit.name, copies: 0, models: 0, points: 0 };
            value.copies++;
            value.models += unit.models;
            value.points += unit.points;
            grouped.set(key, value);
        }
        for (const [key, unit] of grouped) {
            const composite = unitKey(roster.faction) + ":" + key;
            const row = stats.get(composite) || { name: unit.name, faction: roster.faction, games: 0, wins: 0, losses: 0, draws: 0, unknown: 0, copies: 0, models: 0, points: 0, scored: 0, scoreGames: 0 };
            row.games++;
            row.copies += unit.copies;
            row.models += unit.models;
            row.points += unit.points;
            const won = roster.side === "my" ? "W" : "L", lost = roster.side === "my" ? "L" : "W";
            if (roster.game.result === won)
                row.wins++;
            else if (roster.game.result === lost)
                row.losses++;
            else if (roster.game.result === "D")
                row.draws++;
            else
                row.unknown++;
            const score = roster.side === "my" ? roster.game.myScore : roster.game.oppScore;
            if (score !== null) {
                row.scored += score;
                row.scoreGames++;
            }
            stats.set(composite, row);
        }
    }
    return [...stats.values()].map(row => ({ ...row, winRate: row.wins + row.losses ? Math.round(100 * row.wins / (row.wins + row.losses)) : null, averageCopies: row.copies / row.games, averagePoints: row.points / row.games, averageArmyScore: row.scoreGames ? row.scored / row.scoreGames : null })).sort((a, b) => b.games - a.games || a.name.localeCompare(b.name, "fr"));
}
