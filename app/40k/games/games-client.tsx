/**
 * ✅ NOTES (à lire avant)
 * - Fichier : app/40k/games/games-client.tsx (Client Component)
 * - Rôle : page "review" / liste des parties 40k (route: /40k/games) côté UI
 * - Fonctions :
 *   - recherche locale
 *   - stats (W/L/D + winrate)
 *   - cards cliquables vers /40k/games/[id]
 *   - suppression via DELETE /api/games/[id] puis router.refresh()
 * - Esthétique : grimdark (fond fumée/vignette + cards verre/acier + accents ambre) sans lib UI imposée.
 *
 * ✅ v1 Inputs (actuels)
 * - Date jouée (playedAt), opponent, points
 * - Mission line : missionPack / primaryMission / deployment / terrainLayout
 * - Armées : factions/detachments + PDFs Drive optionnels + texte enrichi optionnel
 * - Score final + résultat W/L/D
 * - Notes + photos (liens Drive) optionnels
 */

"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../../types";
import Link from "next/link";
import { useRouter } from "next/navigation";

function badgeClass(result?: string | null) {
  if (result === "W")
    return "bg-green-600/15 text-green-300 ring-1 ring-green-600/30";
  if (result === "L")
    return "bg-red-600/15 text-red-300 ring-1 ring-red-600/30";
  if (result === "D")
    return "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20";
  return "bg-white/10 text-gray-200 ring-1 ring-white/20";
}

function resultLabel(result?: string | null) {
  if (result === "W") return "Victoire";
  if (result === "L") return "Défaite";
  if (result === "D") return "Nul";
  return result ?? "—";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function missionLine(g: any) {
  const parts = [g.missionPack, g.primaryMission, g.deployment, g.terrainLayout]
    .map((x: any) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(" – ") : null;
}

export default function GamesClient40k({
  initialGames,
}: {
  initialGames: GameDTO[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const only40k = useMemo(
    () => initialGames.filter((g) => g.gameType === "40k"),
    [initialGames]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return only40k;

    return only40k.filter((g: any) => {
      const hay = [
        g.opponent,
        typeof g.points === "number" ? String(g.points) : "",
        g.missionPack,
        g.primaryMission,
        g.deployment,
        g.terrainLayout,
        g.myFaction,
        g.myDetachment,
        g.oppFaction,
        g.oppDetachment,
        typeof g.myScore === "number" ? String(g.myScore) : "",
        typeof g.oppScore === "number" ? String(g.oppScore) : "",
        g.result,
        g.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [only40k, q]);

  const total = filtered.length;
  const wins = filtered.filter((g) => g.result === "W").length;
  const losses = filtered.filter((g) => g.result === "L").length;
  const draws = filtered.filter((g) => g.result === "D").length;

  const decisive = wins + losses;
  const winrate = decisive ? Math.round((wins / decisive) * 100) : 0;

  async function deleteGame(id: string) {
    const confirmed = confirm("Supprimer définitivement cette partie 40k ?");
    if (!confirmed) return;

    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erreur lors de la suppression");
      return;
    }
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Grimdark background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href="/40k"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
          >
            ← 40k
          </Link>

          <div className="hidden sm:block text-[10px] tracking-[0.35em] text-white/35">
            WARTRACKER • 40K • HISTORY
          </div>
        </div>

        {/* Header */}
        <div className="rounded-[28px] border border-white/10 bg-black/55 p-6 sm:p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs tracking-[0.45em] text-white/40">
                WARHAMMER
              </div>
              <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-[0.04em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                Parties 40k
              </h1>

              <p className="mt-2 text-sm text-white/65">
                Affichées :{" "}
                <span className="font-semibold text-white/90">{total}</span> • W
                : <span className="font-semibold text-white/90">{wins}</span> •
                L :{" "}
                <span className="font-semibold text-white/90">{losses}</span> •
                D :{" "}
                <span className="font-semibold text-white/90">{draws}</span> •
                Winrate :{" "}
                <span className="font-semibold text-white/90">{winrate}%</span>{" "}
                <span className="text-white/40">(sur W/L)</span>
              </p>

              <div className="mt-3 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <div className="flex gap-2">
              <Link
                href="/40k/add-game"
                className="
                  inline-flex items-center justify-center
                  rounded-xl
                  border border-white/10
                  bg-black/60
                  px-4 py-2
                  text-sm font-semibold text-white/85
                  shadow-[0_10px_30px_rgba(0,0,0,0.8)]
                  backdrop-blur
                  transition
                  hover:bg-black/75
                  hover:border-amber-200/20
                  hover:text-white
                "
              >
                + Ajouter une partie
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-200/30 focus:ring-1 focus:ring-amber-200/15"
              placeholder="Rechercher (opponent / factions / missions / layout / notes / score / points)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="mt-4 grid gap-3">
          {filtered.map((g: any) => {
            const dateStr = formatDate(g.playedAt ?? g.createdAt);
            const scoreLine =
              typeof g.myScore === "number" && typeof g.oppScore === "number"
                ? `${g.myScore} — ${g.oppScore}`
                : null;

            const titleLeft =
              (g.myFaction || "Ta faction") +
              (g.oppFaction
                ? ` vs ${g.oppFaction}`
                : g.opponent
                ? ` vs ${g.opponent}`
                : "");

            const mLine = missionLine(g);

            const hasMyPdf = !!(g.myArmyPdfUrl || g.armyListPdfUrl);
            const hasOppPdf = !!(g.oppArmyPdfUrl || g.armyListPdfUrl2);
            const hasPhotos = Array.isArray(g.photoUrls)
              ? g.photoUrls.length > 0
              : false;

            return (
              <Link
                key={g.id}
                href={`/40k/games/${g.id}`}
                className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.75)] transition hover:border-amber-200/25 hover:bg-black/60"
              >
                {/* subtle glow */}
                <div className="pointer-events-none absolute -inset-24 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle,rgba(255,170,70,0.12),transparent_60%)]" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                          g.result
                        )}`}
                      >
                        {resultLabel(g.result)}
                      </span>

                      {typeof g.points === "number" ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                          {g.points} pts
                        </span>
                      ) : null}

                      {scoreLine ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                          Score {scoreLine}
                        </span>
                      ) : null}

                      {hasMyPdf ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">
                          📄 PDF (toi)
                        </span>
                      ) : null}

                      {hasOppPdf ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">
                          📄 PDF (opp)
                        </span>
                      ) : null}

                      {hasPhotos ? (
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75 ring-1 ring-white/10">
                          🖼️ Photos
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 truncate text-base font-semibold">
                      {titleLeft}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                      <span>Jouée le {dateStr}</span>
                      {g.opponent ? <span>• Opponent: {g.opponent}</span> : null}
                      {g.myDetachment ? (
                        <span>• My detachment: {g.myDetachment}</span>
                      ) : null}
                      {g.oppDetachment ? (
                        <span>• Opp detachment: {g.oppDetachment}</span>
                      ) : null}
                    </div>

                    {mLine ? (
                      <div className="mt-2 truncate text-sm text-white/75">
                        <span className="text-white/45">Mission:</span>{" "}
                        <span className="text-white/90">{mLine}</span>
                      </div>
                    ) : null}

                    {g.notes ? (
                      <div className="mt-2 line-clamp-2 text-sm text-white/75">
                        <span className="text-white/45">Notes:</span> {g.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end">
                    <span className="text-sm text-white/35 group-hover:text-amber-200/50 transition">
                      Open →
                    </span>

                    {/* ✅ IMPORTANT : pas de <button> dans un <a> (Link) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteGame(g.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteGame(g.id);
                        }
                      }}
                      className="
                        cursor-pointer select-none
                        rounded-xl bg-red-600/80 px-3 py-2
                        text-xs font-semibold text-white
                        hover:bg-red-700
                        ring-1 ring-white/10
                        focus:outline-none focus:ring-2 focus:ring-red-300/30
                      "
                      title="Supprimer"
                    >
                      Supprimer
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-sm text-white/70">
              Aucun résultat.
            </div>
          ) : null}
        </div>

        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="mt-4 text-center text-xs text-white/35">
          The Long War is logged.
        </div>
      </div>
    </main>
  );
}
