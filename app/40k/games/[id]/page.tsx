/**
 * PAGE DÉTAIL D’UNE PARTIE WARHAMMER 40K
 * Route : /40k/games/[id]
 *
 * v1 Inputs (actuels) :
 * - playedAt (date), opponent, points
 * - missionPack / primaryMission / deployment / terrainLayout
 * - myFaction/myDetachment + myArmyPdfUrl (Drive, optionnel) + myListText (optionnel)
 * - oppFaction/oppDetachment + oppArmyPdfUrl (Drive, optionnel) + oppListText (optionnel)
 * - myScore / oppScore + result (W/L/D)
 * - notes (éditables) + photoUrls (Drive, optionnel)
 *
 * - Server Component (App Router) : Prisma côté serveur uniquement (runtime Node.js).
 * - Notes éditables via <EditNotes /> (client component).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import EditNotes from "./edit-notes";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getId(params: any): Promise<string | null> {
  const resolved = params && typeof params.then === "function" ? await params : params;
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

function safeStr(x: any): string {
  return typeof x === "string" ? x : "";
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
  if (r === "D") return "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20";
  return "bg-white/10 text-white/70 ring-1 ring-white/20";
}

function isDirectImageUrl(url: string) {
  // Google Drive n’est pas “direct image” en général -> on ne preview pas.
  // On preview seulement si URL finit par .png/.jpg/.jpeg/.webp/.gif
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(url);
}

function joinMissionLine(g: any) {
  const parts = [
    safeStr(g.missionPack).trim(),
    safeStr(g.primaryMission).trim(),
    safeStr(g.deployment).trim(),
    safeStr(g.terrainLayout).trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" – ") : null;
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

export default async function Page({ params }: { params: any }) {
  const id = await getId(params);
  if (!id) notFound();

  const g = await prisma.game.findUnique({ where: { id } });
  if (!g) notFound();

  const photos: string[] = Array.isArray((g as any).photoUrls) ? ((g as any).photoUrls as string[]) : [];

  // Compat anciens champs
  const myPdf = (g as any).myArmyPdfUrl ?? (g as any).armyListPdfUrl ?? null;
  const oppPdf = (g as any).oppArmyPdfUrl ?? (g as any).armyListPdfUrl2 ?? null;

  const playedAt = (g as any).playedAt ? new Date((g as any).playedAt) : g.createdAt;

  const scoreLine =
    g.myScore !== null &&
    g.myScore !== undefined &&
    g.oppScore !== null &&
    g.oppScore !== undefined
      ? `${g.myScore} — ${g.oppScore}`
      : null;

  const mission = joinMissionLine(g);

  const titleLeft =
    (safeStr((g as any).myFaction).trim() || "40k") +
    (safeStr((g as any).oppFaction).trim()
      ? ` vs ${(g as any).oppFaction}`
      : safeStr(g.opponent).trim()
      ? ` vs ${g.opponent}`
      : "");

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
              <div className="text-xs tracking-[0.45em] text-white/40">WARHAMMER 40K</div>

              <h1 className="mt-1 truncate text-2xl sm:text-3xl font-extrabold tracking-[0.03em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
                {titleLeft}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-white/50">Jouée le {fmtDate(playedAt)}</span>

                {typeof (g as any).points === "number" ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    {(g as any).points} pts
                  </span>
                ) : null}

                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resultBadge(g.result)}`}>
                  {resultLabel(g.result)}
                </span>

                {scoreLine ? (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10">
                    Score {scoreLine}
                  </span>
                ) : null}
              </div>

              {mission ? (
                <div className="mt-2 text-sm text-white/75 truncate">
                  <span className="text-white/45">Mission:</span>{" "}
                  <span className="text-white/90">{mission}</span>
                </div>
              ) : null}

              <div className="mt-3 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            {/* CTA sombre */}
            <Link
              href="/40k/add-game"
              className="
                w-fit rounded-xl
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

          {/* Infos */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mission & Table */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Mission & table</h2>
              <div className="mt-3 text-sm text-white/80 space-y-2">
                <div>
                  <span className="text-white/45">Pack :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).missionPack ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/45">Primaire :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).primaryMission ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/45">Déploiement :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).deployment ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/45">Layout :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).terrainLayout ?? "—"}</span>
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
                  Adversaire : <span className="text-white/80">{g.opponent ?? "—"}</span>
                </div>
              </div>
            </section>

            {/* Armée — Toi */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Toi</h2>
              <div className="mt-3 text-sm text-white/80 space-y-2">
                <div>
                  <span className="text-white/45">Faction :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).myFaction ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/45">Détachement :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).myDetachment ?? "—"}</span>
                </div>

                <div className="pt-2">
                  <div className="text-xs tracking-[0.25em] text-white/35">LISTE (PDF DRIVE)</div>
                  <div className="mt-2">
                    {myPdf ? linkPill(myPdf, "Ouvrir le PDF (toi)", "📄") : (
                      <div className="text-sm text-white/45">Aucun PDF</div>
                    )}
                  </div>
                </div>

                {(g as any).myListText ? (
                  <div className="pt-2">
                    <div className="text-xs tracking-[0.25em] text-white/35">TEXTE ENRICHI</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                      {(g as any).myListText}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Armée — Adversaire */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Adversaire</h2>
              <div className="mt-3 text-sm text-white/80 space-y-2">
                <div>
                  <span className="text-white/45">Faction :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).oppFaction ?? "—"}</span>
                </div>
                <div>
                  <span className="text-white/45">Détachement :</span>{" "}
                  <span className="font-semibold text-white/90">{(g as any).oppDetachment ?? "—"}</span>
                </div>

                <div className="pt-2">
                  <div className="text-xs tracking-[0.25em] text-white/35">LISTE (PDF DRIVE)</div>
                  <div className="mt-2">
                    {oppPdf ? linkPill(oppPdf, "Ouvrir le PDF (adversaire)", "📄") : (
                      <div className="text-sm text-white/45">Aucun PDF</div>
                    )}
                  </div>
                </div>

                {(g as any).oppListText ? (
                  <div className="pt-2">
                    <div className="text-xs tracking-[0.25em] text-white/35">TEXTE ENRICHI</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                      {(g as any).oppListText}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Photos (Drive) */}
            <section className="rounded-2xl border border-white/10 bg-black/45 p-4 shadow-sm md:col-span-2">
              <h2 className="text-sm font-semibold tracking-wide text-white/85">Photos (Drive)</h2>

              {photos.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {photos.map((url: string, i: number) => (
                    <div
                      key={`${url}-${i}`}
                      className="rounded-xl border border-white/10 bg-black/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-white/45">Photo {i + 1}</div>
                          <div className="truncate text-sm text-white/80">{url}</div>
                        </div>

                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition"
                        >
                          Ouvrir →
                        </a>
                      </div>

                      {isDirectImageUrl(url) ? (
                        <div className="mt-3">
                          {/* preview seulement si lien direct image */}
                          <img
                            src={url}
                            alt={`Photo ${i + 1}`}
                            className="h-44 w-full rounded-lg object-cover border border-white/10"
                          />
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-white/45">
                          Preview désactivé (Drive). Clique “Ouvrir”.
                        </div>
                      )}
                    </div>
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
