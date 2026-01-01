"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../types";

function fmtFR(iso: string) {
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

function badgeClass(result?: string | null) {
  if (result === "W")
    return "bg-green-600/15 text-green-200 ring-1 ring-green-600/30";
  if (result === "L")
    return "bg-red-600/15 text-red-200 ring-1 ring-red-600/30";
  if (result === "D")
    return "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20";
  return "bg-white/10 text-white/70 ring-1 ring-white/20";
}

function resultLabel(result?: string | null) {
  if (result === "W") return "Victoire";
  if (result === "L") return "Défaite";
  if (result === "D") return "Nul";
  return result ?? "—";
}

function Field({
  label,
  value,
  right,
}: {
  label: string;
  value: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.35em] text-white/35">{label}</div>
        <div className="mt-1 text-sm font-semibold text-white/90 break-words">{value}</div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
      {children}
    </span>
  );
}

function linkPill(href: string, label: string, icon: string) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
    >
      <span>{icon}</span>
      <span className="underline decoration-white/25 underline-offset-4">{label}</span>
      <span className="text-white/35">→</span>
    </a>
  );
}

function isDirectImageUrl(url: string) {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
}

// ✅ validation légère Drive (cohérent avec Add40kForm)
function isProbablyDriveUrl(url: string) {
  const u = (url ?? "").trim().toLowerCase();
  if (!u) return true;
  return u.startsWith("https://drive.google.com/") || u.startsWith("https://docs.google.com/");
}

export default function GameDetailClient({ game }: { game: GameDTO }) {
  const [notes, setNotes] = useState(game.notes ?? "");
  const [scoreSheetUrl, setScoreSheetUrl] = useState(game.scoreSheetUrl ?? "");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dateStr = useMemo(() => {
    const iso = game.playedAt || game.createdAt;
    return fmtFR(iso);
  }, [game.playedAt, game.createdAt]);

  const missionLine = useMemo(() => {
    const parts = [
      game.missionPack?.trim(),
      game.primaryMission?.trim(),
      game.deployment?.trim(),
      game.terrainLayout?.trim(),
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(" – ") : null;
  }, [game.missionPack, game.primaryMission, game.deployment, game.terrainLayout]);

  const scoreLine =
    typeof game.myScore === "number" && typeof game.oppScore === "number"
      ? `${game.myScore} — ${game.oppScore}`
      : null;

  const titleLeft =
    (game.myFaction?.trim() || "40k") +
    (game.oppFaction?.trim()
      ? ` vs ${game.oppFaction}`
      : game.opponent?.trim()
      ? ` vs ${game.opponent}`
      : "");

  // ✅ on sauvegarde notes + scoreSheetUrl ensemble (simple, robuste)
  async function saveGameEdits() {
    if (!isProbablyDriveUrl(scoreSheetUrl)) {
      setMsg("❌ Lien Drive invalide pour la feuille de score.");
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          scoreSheetUrl: scoreSheetUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        let text = "";
        try {
          const j = await res.json();
          text = j?.error || j?.details || JSON.stringify(j);
        } catch {
          text = await res.text().catch(() => "");
        }
        throw new Error(text || `PATCH failed (${res.status})`);
      }

      setMsg("✅ Sauvegardé (notes + feuille de score).");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Erreur"}`);
    } finally {
      setSaving(false);
    }
  }

  const hasDirty =
    (notes ?? "") !== (game.notes ?? "") ||
    (scoreSheetUrl ?? "") !== (game.scoreSheetUrl ?? "");

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Fond grimdark global */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6">
        {/* Carte principale */}
        <div className="rounded-[28px] border border-white/10 bg-black/55 p-6 sm:p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.45em] text-white/40">WARTRACKER • 40K</div>

              <h1 className="mt-2 truncate text-2xl sm:text-3xl font-extrabold tracking-[0.03em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                {titleLeft}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/75">
                <span className="text-white/50">Jouée le {dateStr}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(game.result)}`}>
                  {resultLabel(game.result)}
                </span>
                {typeof game.points === "number" ? <Pill>{game.points} pts</Pill> : null}
                {scoreLine ? <Pill>Score {scoreLine}</Pill> : null}
              </div>

              {missionLine ? (
                <div className="mt-3 truncate text-sm text-white/80">
                  <span className="text-white/45">Mission:</span>{" "}
                  <span className="text-white/95">{missionLine}</span>
                </div>
              ) : null}

              <div className="mt-4 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            {/* Petit cartouche "log" */}
            <div className="hidden sm:block rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs text-white/55">
              <div className="tracking-[0.35em] text-white/35">GAME LOG</div>
              <div className="mt-2">
                ID <span className="text-white/70">{game.id}</span>
              </div>
              {hasDirty ? (
                <div className="mt-2 text-[11px] text-amber-200/70">Modifs non sauvegardées</div>
              ) : null}
            </div>
          </div>

          {/* Mission & Score + Armées */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="ADVERSAIRE"
              value={game.opponent ?? "—"}
              right={scoreLine ? <Pill>{scoreLine}</Pill> : <Pill>—</Pill>}
            />

            <Field
              label="SCORE / RÉSULTAT"
              value={scoreLine ?? "—"}
              right={
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(game.result)}`}>
                  {resultLabel(game.result)}
                </span>
              }
            />

            <div className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-2">
              <div className="text-[10px] tracking-[0.35em] text-white/35">TOI</div>
              <div className="text-sm text-white/85">
                <span className="text-white/45">Faction:</span>{" "}
                <span className="font-semibold text-white/95">{game.myFaction ?? "—"}</span>
              </div>
              <div className="text-sm text-white/85">
                <span className="text-white/45">Détachement:</span>{" "}
                <span className="font-semibold text-white/95">{game.myDetachment ?? "—"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-2">
              <div className="text-[10px] tracking-[0.35em] text-white/35">ADVERSAIRE</div>
              <div className="text-sm text-white/85">
                <span className="text-white/45">Faction:</span>{" "}
                <span className="font-semibold text-white/95">{game.oppFaction ?? "—"}</span>
              </div>
              <div className="text-sm text-white/85">
                <span className="text-white/45">Détachement:</span>{" "}
                <span className="font-semibold text-white/95">{game.oppDetachment ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* PDFs + texte enrichi */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Listes d’armée</div>
              <div className="text-[10px] tracking-[0.35em] text-white/35">DRIVE • PDF</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/45 mb-2">Toi</div>
                {game.myArmyPdfUrl ? linkPill(game.myArmyPdfUrl, "Ouvrir le PDF (toi)", "📄") : (
                  <div className="text-xs text-white/45">Aucun PDF</div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <div className="text-xs text-white/45 mb-2">Adversaire</div>
                {game.oppArmyPdfUrl ? linkPill(game.oppArmyPdfUrl, "Ouvrir le PDF (adversaire)", "📄") : (
                  <div className="text-xs text-white/45">Aucun PDF</div>
                )}
              </div>
            </div>

            {game.myListText ? (
              <div className="pt-2">
                <div className="text-[10px] tracking-[0.35em] text-white/35">TEXTE ENRICHI • TOI</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{game.myListText}</div>
              </div>
            ) : null}

            {game.oppListText ? (
              <div className="pt-2">
                <div className="text-[10px] tracking-[0.35em] text-white/35">TEXTE ENRICHI • ADVERSAIRE</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-white/85">{game.oppListText}</div>
              </div>
            ) : null}
          </section>

          {/* ✅ Feuille de score (Drive) */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Feuille de score</div>
              <div className="text-[10px] tracking-[0.35em] text-white/35">DRIVE • PDF/PHOTO</div>
            </div>

            <input
              className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-amber-200/30 focus:ring-1 focus:ring-amber-200/15"
              value={scoreSheetUrl}
              onChange={(e) => setScoreSheetUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />

            {scoreSheetUrl.trim() ? (
              <div className="flex flex-wrap items-center gap-2">
                {linkPill(scoreSheetUrl, "Ouvrir la feuille de score", "🧾")}
                <span className="text-xs text-white/40">
                  Astuce : partage “Toute personne ayant le lien” (lecture).
                </span>
              </div>
            ) : (
              <div className="text-xs text-white/45">Aucune feuille de score.</div>
            )}
          </section>

          {/* Notes (persist + sauvegarde) */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Notes post-partie</div>
              <div className="text-[10px] tracking-[0.35em] text-white/35">PERSISTENT</div>
            </div>

            <textarea
              className="w-full rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-amber-200/30 focus:ring-1 focus:ring-amber-200/15"
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Erreurs, idées à tester, ajustements..."
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={saveGameEdits}
                disabled={saving}
                className="
                  inline-flex items-center justify-center
                  rounded-xl border border-white/10
                  bg-black/60 px-4 py-2
                  text-sm font-semibold text-white/85
                  shadow-[0_10px_30px_rgba(0,0,0,0.8)]
                  backdrop-blur
                  transition
                  hover:bg-black/75 hover:border-amber-200/20 hover:text-white
                  disabled:opacity-50
                "
              >
                {saving ? "Sauvegarde..." : hasDirty ? "Sauvegarder les modifs" : "Sauvegarder"}
              </button>

              {msg ? (
                <span className="text-xs text-white/70">{msg}</span>
              ) : hasDirty ? (
                <span className="text-xs text-amber-200/60">Des changements sont en attente.</span>
              ) : (
                <span className="text-xs text-white/35">Modifie puis sauvegarde pour persister.</span>
              )}
            </div>
          </section>

          {/* Photos */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Photos (Drive)</div>
              <div className="text-[10px] tracking-[0.35em] text-white/35">MEDIA</div>
            </div>

            {game.photoUrls && game.photoUrls.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {game.photoUrls.map((u, i) => (
                  <div key={`${u}-${i}`} className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-white/45">Photo {i + 1}</div>
                        <div className="truncate text-sm text-white/80">{u}</div>
                      </div>

                      <a
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition"
                      >
                        Ouvrir →
                      </a>
                    </div>

                    {isDirectImageUrl(u) ? (
                      <img
                        src={u}
                        alt={`Photo ${i + 1}`}
                        className="mt-3 h-44 w-full rounded-lg object-cover border border-white/10"
                      />
                    ) : (
                      <div className="mt-2 text-xs text-white/45">
                        Preview désactivé (Drive). Clique “Ouvrir”.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/45">📷 Pas de photos renseignées.</div>
            )}
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="text-center text-xs text-white/35">The Long War is logged.</div>
        </div>
      </div>
    </main>
  );
}
