import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditNotes from "./edit-notes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

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

export default async function Page({ params }: { params: any }) {
  const id = await getId(params);
  if (!id) return notFound();

  const g = await prisma.game.findUnique({ where: { id } });
  if (!g) return notFound();

  const photos = Array.isArray(g.photoUrls) ? g.photoUrls : [];

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4 text-white">
      <Link
        href="/40k/games"
        className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
      >
        ← Retour
      </Link>

      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 shadow-xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">
            40k — {g.build} vs {g.opponent}
          </h1>
          <div className="text-sm text-gray-300">
            Enregistrée le {fmtDate(g.createdAt)} • Résultat{" "}
            <span className="font-semibold">{g.result}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-semibold text-gray-200">Factions</div>
            <div className="mt-2 text-sm text-gray-200">
              <div>
                Toi : <span className="font-semibold">{g.myFaction ?? "—"}</span>
                {g.myDetachment ? ` (${g.myDetachment})` : ""}
              </div>
              <div className="mt-1">
                Adverse :{" "}
                <span className="font-semibold">{g.oppFaction ?? "—"}</span>
                {g.oppDetachment ? ` (${g.oppDetachment})` : ""}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-semibold text-gray-200">Score</div>
            <div className="mt-2 text-sm text-gray-200">
              {g.myScore !== null && g.oppScore !== null ? (
                <span className="text-lg font-bold">
                  {g.myScore} - {g.oppScore}
                </span>
              ) : (
                "—"
              )}
              <div className="mt-2 text-xs text-gray-400">
                First : {g.first ? "Oui" : "Non"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-semibold text-gray-200">
              Liste d’armée (PDF)
            </div>
            <div className="mt-2">
              {g.armyListPdfUrl ? (
                <a
                  href={g.armyListPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline decoration-white/30 hover:decoration-white"
                >
                  📄 Ouvrir le PDF
                </a>
              ) : (
                <div className="text-sm text-gray-400">Aucun PDF</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-semibold text-gray-200">Tags</div>
            <div className="mt-2 text-sm text-gray-200">
              {g.tag1 ?? "—"} {g.tag2 ? `• ${g.tag2}` : ""}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="text-xs font-semibold text-gray-200">Photos</div>
          {photos.length ? (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, i) => (
                <a
                  key={`${url}-${i}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="h-28 w-full rounded-lg object-cover border border-white/10 hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-400">Aucune photo</div>
          )}
        </div>

        {/* ✅ NOTES EDITABLES via composant client */}
        <EditNotes id={g.id} initialNotes={g.notes} />
      </div>
    </main>
  );
}
