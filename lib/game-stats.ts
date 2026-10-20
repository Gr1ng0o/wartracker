export function gameStats(games: ReadonlyArray<{ result?: string | null }>) {
 const stats = { wins: 0, losses: 0, draws: 0 };
 for (const game of games) {
  if (game.result === "W") stats.wins++;
  else if (game.result === "L") stats.losses++;
  else if (game.result === "D") stats.draws++;
 }
 return stats;
}
