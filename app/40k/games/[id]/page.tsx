/**
 * PAGE DÉTAIL D’UNE PARTIE WARHAMMER 40K
 * Route : /40k/games/[id]
 *
 * - Affiche toutes les infos enregistrées pour une partie (build, opponent, factions, scores, tags, fichiers).
 * - Affiche les photos et le PDF si présents.
 * - Permet l’édition persistée des notes via <EditNotes /> (client component).
 * - Server Component (App Router) : Prisma côté serveur uniquement (runtime Node.js).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import EditNotes from "./edit-notes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getId(params: any): Promise<string | null> {
  const resolved =
    params && typeof params.then === "function" ? await params : params;

  const id = resolved?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resultLabel(r: string | null) {
  if (r === "W") return "Victoire";
  if (r === "L") return "Défaite";
  if (r === "D") return "Nul";
  return r ?? "—";
}

function resultBadge(r: string | null) {
  if (r === "W") return "bg-green-600/15 text-green-300 ring-1 ring-green-600/30";
  if (r === "L") return "bg-red-600/15 text-red-300 ring-1 ring-red-600/30";
  return "bg-white/10 text-white/70 ring-1 ring-white/20";
}

export default async function Page({ params }: { params: any }) {
  const id = await getId(params);
  if (!id) notFound();

  const g = await prisma.game.findUnique({ where: { id } });
  if (!g) notFound();

  // Sécurité : photoUrls peut être null/undefined en DB
  const photos = Array.isArray(g.photoUrls) ? g.photoUrls : [];

  const scoreLine =
    g.myScore !== null && g.myScore !== undefined && g.oppScore !== null && g.oppScore !== undefined
      ? `${g.myScore} — ${g.oppScore}`
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      {/* Fond grimdark global */}
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
            href="/40k/games"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
          >
            ← Historique 40k
          </Link>

          <div className="hidden sm:block text-[10px] tracking-[0.35em] text-white/35">
            WARTRACKER • 40K • GAME LOG
          </div>
        </div>

        {/* Carte principale */}
        <div className="rounded-[28px] border border-white/10 bg-black/55 p-6 sm:p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs tracking-[0.45em] text-white/40">
                WARHAMMER 40K
              </div>

              <h1 className="mt-1 truncate text-2xl sm:text-3xl font-extrabold tracking-[0.03em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                40k — {g.build || "Game"}{" "}
                <span className="text-white/35">vs</span>{" "}
                {g.opponent || g.oppFaction || "Opponent"}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-white/50">Enregistrée le {fmtDate(g.createdAt)}</span>

                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resultBadge(g.result)}`}>
                  {resultLabel(g.result)}
                </span>

                {scoreLine ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    Score {scoreLine}
                  </span>
                ) : null}

                {g.first !== null && g.first !== undefined ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    {g.first ? "First" : "Second"}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            <Link
              href="/40k/add-game"
              className="w-fit rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-white transition"
            >
              + Add game
            </Link>
          </div>

          {/* Infos */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Factions */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Factions</h2>
              <div className="mt-3 text-sm text-white/80 space-y-2">
                <div>
                  <span className="text-white/45">Toi :</span>{" "}
                  <span className="font-semibold text-white/90">{g.myFaction ?? "—"}</span>
                  {g.myDetachment ? <span className="text-white/55">{` (${g.myDetachment})`}</span> : null}
                </div>
                <div>
                  <span className="text-white/45">Adverse :</span>{" "}
                  <span className="font-semibold text-white/90">{g.oppFaction ?? "—"}</span>
                  {g.oppDetachment ? <span className="text-white/55">{` (${g.oppDetachment})`}</span> : null}
                </div>
              </div>
            </section>

            {/* Score */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Score</h2>
              <div className="mt-3 text-sm text-white/80">
                {g.myScore !== null && g.oppScore !== null ? (
                  <div className="text-2xl font-extrabold tracking-wide text-white">
                    {g.myScore} <span className="text-white/35">—</span> {g.oppScore}
                  </div>
                ) : (
                  <div className="text-white/45">—</div>
                )}

                <div className="mt-3 text-xs text-white/50">
                  First : <span className="text-white/80">{g.first ? "Oui" : "Non"}</span>
                </div>
              </div>
            </section>

            {/* PDF */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Liste d’armée (PDF)</h2>
              <div className="mt-3">
                {g.armyListPdfUrl ? (
                  <a
                    href={g.armyListPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
                  >
                    <span>📄</span>
                    <span className="underline decoration-white/25 underline-offset-4">Ouvrir le PDF</span>
                    <span className="text-white/35">→</span>
                  </a>
                ) : (
                  <div className="text-sm text-white/45">Aucun PDF</div>
                )}
              </div>
            </section>

            {/* Tags */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {g.tag1 ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-white/80 ring-1 ring-white/10">
                    {g.tag1}
                  </span>
                ) : null}
                {g.tag2 ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-white/80 ring-1 ring-white/10">
                    {g.tag2}
                  </span>
                ) : null}
                {!g.tag1 && !g.tag2 ? <span className="text-sm text-white/45">—</span> : null}
              </div>
            </section>

            {/* Photos */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm md:col-span-2">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Photos</h2>

              {photos.length ? (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((url: string, i: number) => (
                    <a key={`${url}-${i}`} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="h-28 w-full rounded-lg object-cover border border-white/10 hover:opacity-90 transition"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm text-white/45">Aucune photo</div>
              )}
            </section>
          </div>

          {/* ✅ NOTES EDITABLES via composant client */}
          <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
            <h2 className="text-sm font-semibold tracking-wide text-white/85">Notes</h2>
            <div className="mt-3">
              {/* IMPORTANT: on conserve ton API actuelle (EditNotes id=...) */}
              <EditNotes id={g.id} initialNotes={g.notes ?? ""} />
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="text-center text-xs text-white/35">The Long War is logged.</div>
        </div>
      </div>
    </main>
  );
}
