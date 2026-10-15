"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameDTO } from "../types";
import { formatGameDate } from "@/lib/date";
import { apiRequest, errorMessage } from "@/lib/client-api";

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
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.35em] text-white/35">{label}</div>
        <div className="mt-1 text-sm font-semibold text-white/90 break-words">
          {value}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
      {children}
    </span>
  );
}

function openExternal(url: string) {
  const u = (url ?? "").trim();
  if (!u || !u.startsWith("https://")) return;
  window.open(u, "_blank", "noopener,noreferrer");
}

function DriveAction({
  label,
  href,
  icon,
  kind = "GOOGLE DRIVE",
  hint,
}: {
  label: string;
  href: string;
  icon?: string;
  kind?: string;
  hint?: string;
}) {
  const url = (href ?? "").trim();
  if (!url) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
        <div className="text-xs text-white/45">{label}</div>
        <div className="mt-1 text-xs text-white/45">Aucun lien</div>
      </div>
    );
  }

  return (
    <div
      className="
        grid grid-cols-1 gap-2
        sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center
        rounded-xl border border-white/10 bg-black/40
        p-3
      "
    >
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.35em] text-white/35">{kind}</div>
        <div className="mt-1 min-w-0 truncate text-sm text-white/85" title={url}>
          <span className="mr-2">{icon ?? "🔗"}</span>
          <span className="font-semibold text-white/90">{label}</span>
        </div>
        {hint ? <div className="mt-1 text-xs text-white/40">{hint}</div> : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openExternal(url);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            openExternal(url);
          }
        }}
        className="
          w-full sm:w-auto
          cursor-pointer select-none
          rounded-lg
          border border-amber-200/20
          bg-amber-500/15
          px-3 py-2
          text-center text-xs font-semibold text-amber-100
          hover:bg-amber-500/20
          ring-1 ring-white/10
          focus:outline-none focus:ring-2 focus:ring-amber-200/25
          whitespace-nowrap
        "
        title="Ouvrir dans un nouvel onglet"
      >
        Ouvrir →
      </div>
    </div>
  );
}

function isProbablyDriveUrl(url: string) {
  const u = (url ?? "").trim().toLowerCase();
  if (!u) return true;
  return (
    u.startsWith("https://drive.google.com/") ||
    u.startsWith("https://docs.google.com/")
  );
}

/** ---------------------------
 *  ✅ Legacy cleanup:
 *  Si tu as déjà “stocké” la timeline dans notes,
 *  on la retire et on peut la récupérer.
 *  Format attendu: /*WT_TIMELINE_V1:<json>:WT_TIMELINE_V1*\/
 * --------------------------- */
const TL_REGEX =
  /\/\*WT_TIMELINE_V1:\s*([\s\S]*?)\s*:WT_TIMELINE_V1\*\//g;

type TimelinePayload = {
  deploymentNotes?: string | null;
  t1Notes?: string | null;
  t2Notes?: string | null;
  t3Notes?: string | null;
  t4Notes?: string | null;
  t5Notes?: string | null;
};

function safeJsonParseTimeline(s: string): TimelinePayload | null {
  try {
    const obj: unknown = JSON.parse(s);
    if (!obj || typeof obj !== "object") return null;
    const payload: TimelinePayload = {};
    for (const key of ["deploymentNotes", "t1Notes", "t2Notes", "t3Notes", "t4Notes", "t5Notes"] as const) {
      const value = (obj as Record<string, unknown>)[key];
      if (typeof value === "string" || value === null) payload[key] = value;
    }
    return payload;
  } catch {
    return null;
  }
}

function extractTimelineFromNotes(raw: string | null | undefined): {
  cleanNotes: string;
  timeline: TimelinePayload | null;
} {
  const s0 = (raw ?? "").toString();

  let lastJson: string | null = null;
  for (const m of s0.matchAll(TL_REGEX)) {
    lastJson = (m?.[1] ?? "").trim();
  }
  const tl = lastJson ? safeJsonParseTimeline(lastJson) : null;
  const clean = s0.replace(TL_REGEX, "").trim();

  return { cleanNotes: clean, timeline: tl };
}

/**
 * ✅ Bloc Timeline (toujours visible)
 */
function TimelineBlock({
  title,
  photoUrl,
  notes,
  onNotesChange,
  kind = "TIMELINE",
  placeholder,
}: {
  title: string;
  photoUrl?: string | null;
  notes: string;
  onNotesChange: (v: string) => void;
  kind?: string;
  placeholder?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
      <div className="text-xs tracking-[0.25em] text-white/35">{title}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DriveAction
          label="Photo (Drive)"
          href={(photoUrl ?? "").trim()}
          icon="📷"
          kind={kind}
          hint="Astuce : partage “Toute personne ayant le lien” (lecture)."
        />

        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="text-[10px] tracking-[0.35em] text-white/35">
            REMARQUES / AJUSTEMENTS
          </div>

          <textarea
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-amber-200/30 focus:ring-1 focus:ring-amber-200/15"
            rows={4}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder={placeholder ?? "Séquences clés, erreurs, timings..."}
          />
        </div>
      </div>
    </div>
  );
}

export default function GameDetailClient({ game }: { game: GameDTO }) {
  const router = useRouter();

  // ✅ Nettoyage legacy éventuel : notes peut contenir un vieux blob timeline
  const legacy = useMemo(() => extractTimelineFromNotes(game.notes), [game.notes]);

  // ✅ Notes post-partie: on part de notes NETTOYÉES
  const [notes, setNotes] = useState<string>(legacy.cleanNotes ?? "");

  const [scoreSheetUrl, setScoreSheetUrl] = useState(game.scoreSheetUrl ?? "");

  // ✅ Timeline (on privilégie TOUJOURS les colonnes)
  // Si colonnes vides mais legacy timeline existe, on pré-remplit.
  const [deploymentNotes, setDeploymentNotes] = useState(
    (game.deploymentNotes ?? legacy.timeline?.deploymentNotes ?? "") || ""
  );
  const [t1Notes, setT1Notes] = useState(
    (game.t1Notes ?? legacy.timeline?.t1Notes ?? "") || ""
  );
  const [t2Notes, setT2Notes] = useState(
    (game.t2Notes ?? legacy.timeline?.t2Notes ?? "") || ""
  );
  const [t3Notes, setT3Notes] = useState(
    (game.t3Notes ?? legacy.timeline?.t3Notes ?? "") || ""
  );
  const [t4Notes, setT4Notes] = useState(
    (game.t4Notes ?? legacy.timeline?.t4Notes ?? "") || ""
  );
  const [t5Notes, setT5Notes] = useState(
    (game.t5Notes ?? legacy.timeline?.t5Notes ?? "") || ""
  );

  const [saved, setSaved] = useState({ notes, scoreSheetUrl, deploymentNotes, t1Notes, t2Notes, t3Notes, t4Notes, t5Notes });
  const draft = { notes, scoreSheetUrl, deploymentNotes, t1Notes, t2Notes, t3Notes, t4Notes, t5Notes };
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dateStr = useMemo(() => {
    const iso = game.playedAt || game.createdAt;
    return formatGameDate(iso);
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

  const deploymentPhotoUrl = game.deploymentPhotoUrl ?? null;
  const t1PhotoUrl = game.t1PhotoUrl ?? null;
  const t2PhotoUrl = game.t2PhotoUrl ?? null;
  const t3PhotoUrl = game.t3PhotoUrl ?? null;
  const t4PhotoUrl = game.t4PhotoUrl ?? null;
  const t5PhotoUrl = game.t5PhotoUrl ?? null;

  async function saveGameEdits() {
    if (!isProbablyDriveUrl(scoreSheetUrl)) {
      setMsg("❌ Lien Drive invalide pour la feuille de score.");
      return;
    }

    if (saving) return;
    const snapshot = { ...draft };
    setSaving(true);
    setMsg(null);
    try {
      await apiRequest(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      setSaved(snapshot);
      setMsg("Modifications sauvegardées.");
      router.refresh();
    } catch (error) {
      setMsg(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteGame() {
    const ok = window.confirm("Supprimer cette partie ? (irréversible)");
    if (!ok) return;

    setDeleting(true);
    setMsg(null);

    try {
      await apiRequest(`/api/games/${game.id}`, { method: "DELETE" });

      router.push("/40k/games");
      router.refresh();
    } catch (error) {
      setMsg(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const hasDirty = (Object.keys(draft) as Array<keyof typeof draft>).some(key => draft[key] !== saved[key]);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-[28px] border border-white/10 bg-black/55 p-6 sm:p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.45em] text-white/40">
                WARTRACKER • 40K
              </div>

              <h1 className="mt-2 truncate text-2xl sm:text-3xl font-extrabold tracking-[0.03em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                {titleLeft}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/75">
                <span className="text-white/50">Jouée le {dateStr}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                    game.result
                  )}`}
                >
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

            <div className="hidden sm:block rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs text-white/55">
              <div className="tracking-[0.35em] text-white/35">GAME LOG</div>
              <div className="mt-2">
                ID <span className="text-white/70">{game.id}</span>
              </div>
              {hasDirty ? (
                <div className="mt-2 text-[11px] text-amber-200/70">
                  Modifs non sauvegardées
                </div>
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

          {/* Listes d’armée */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Listes d’armée</div>
              <div className="text-[10px] tracking-[0.35em] text-white/35">DRIVE • PDF</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <DriveAction label="PDF (toi)" href={game.myArmyPdfUrl ?? ""} icon="📄" kind="ARMY LIST" />
              <DriveAction label="PDF (adversaire)" href={game.oppArmyPdfUrl ?? ""} icon="📄" kind="ARMY LIST" />
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

          {/* Feuille de score */}
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

            <DriveAction
              label="Ouvrir la feuille de score"
              href={scoreSheetUrl}
              icon="🧾"
              kind="SCORE SHEET"
              hint="Astuce : partage “Toute personne ayant le lien” (lecture)."
            />
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/85">Timeline (tour par tour)</div>
              <div className="text-[10px] tracking-[0.35em] text-white/35">DRIVE • PHOTO + NOTES</div>
            </div>

            <div className="space-y-4">
              <TimelineBlock
                title="DÉPLOIEMENT"
                photoUrl={deploymentPhotoUrl}
                notes={deploymentNotes}
                onNotesChange={setDeploymentNotes}
                kind="DEPLOYMENT"
                placeholder="Plan de jeu, erreurs de déploiement, trade-offs..."
              />
              <TimelineBlock title="T1" photoUrl={t1PhotoUrl} notes={t1Notes} onNotesChange={setT1Notes} kind="TURN 1" />
              <TimelineBlock title="T2" photoUrl={t2PhotoUrl} notes={t2Notes} onNotesChange={setT2Notes} kind="TURN 2" />
              <TimelineBlock title="T3" photoUrl={t3PhotoUrl} notes={t3Notes} onNotesChange={setT3Notes} kind="TURN 3" />
              <TimelineBlock title="T4" photoUrl={t4PhotoUrl} notes={t4Notes} onNotesChange={setT4Notes} kind="TURN 4" />
              <TimelineBlock title="T5" photoUrl={t5PhotoUrl} notes={t5Notes} onNotesChange={setT5Notes} kind="TURN 5" />
            </div>

            {legacy.timeline ? (
              <div className="text-xs text-amber-200/70">
                ⚠️ Les notes d’une ancienne partie ont été récupérées. Sauvegarde pour les conserver dans les sections par tour.
              </div>
            ) : null}
          </section>

          {/* Notes post-partie */}
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

              <button
                onClick={deleteGame}
                disabled={deleting}
                className="
                  inline-flex items-center justify-center
                  rounded-xl border border-red-500/20
                  bg-red-500/10 px-4 py-2
                  text-sm font-semibold text-red-100
                  hover:bg-red-500/15
                  disabled:opacity-50
                "
              >
                {deleting ? "Suppression..." : "Supprimer la partie"}
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

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="text-center text-xs text-white/35">The Long War is logged.</div>
        </div>
      </div>
    </main>
  );
}
