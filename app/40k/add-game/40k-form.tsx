"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Result = "W" | "L" | "D";

function toIsoDateTimeLocalValue(d: Date) {
  // yyyy-MM-ddTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function isProbablyDriveUrl(url: string) {
  const u = url.trim().toLowerCase();
  if (!u) return true; // champ vide = ok
  return u.startsWith("https://drive.google.com/") || u.startsWith("https://docs.google.com/");
}

function normalizeUrlList(raw: string) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Add40kForm() {
  const router = useRouter();

  // 1) Identification
  const [playedAtLocal, setPlayedAtLocal] = useState(() =>
    toIsoDateTimeLocalValue(new Date())
  );
  const [opponent, setOpponent] = useState("");
  const [points, setPoints] = useState<1000 | 1500 | 2000>(2000);

  // 2) Mission & table
  const [missionPack, setMissionPack] = useState("");
  const [primaryMission, setPrimaryMission] = useState("");
  const [deployment, setDeployment] = useState("");
  const [terrainLayout, setTerrainLayout] = useState("");

  // 3) Armées
  const [myFaction, setMyFaction] = useState("");
  const [myDetachment, setMyDetachment] = useState("");
  const [oppFaction, setOppFaction] = useState("");
  const [oppDetachment, setOppDetachment] = useState("");

  // PDF Drive (optionnels)
  const [myArmyPdfUrl, setMyArmyPdfUrl] = useState("");
  const [oppArmyPdfUrl, setOppArmyPdfUrl] = useState("");

  // Texte enrichi (optionnels)
  const [myListText, setMyListText] = useState("");
  const [oppListText, setOppListText] = useState("");

  // 4) Score & résultat
  const [myScore, setMyScore] = useState<number>(0);
  const [oppScore, setOppScore] = useState<number>(0);

  const computedResult: Result = useMemo(() => {
    if (myScore === oppScore) return "D";
    return myScore > oppScore ? "W" : "L";
  }, [myScore, oppScore]);

  const resultLabel =
    computedResult === "D" ? "Égalité" : computedResult === "W" ? "Victoire" : "Défaite";

  // 5) Notes (unique champ)
  const [notes, setNotes] = useState("");

  // 6) Médias Drive (optionnels)
  // -> on laisse 2 approches: soit 1 lien par ligne, soit un dossier Drive unique.
  const [photoLinksRaw, setPhotoLinksRaw] = useState("");

  const photoUrls = useMemo(() => normalizeUrlList(photoLinksRaw), [photoLinksRaw]);

  const [saving, setSaving] = useState(false);

  function resetForm() {
    setPlayedAtLocal(toIsoDateTimeLocalValue(new Date()));
    setOpponent("");
    setPoints(2000);

    setMissionPack("");
    setPrimaryMission("");
    setDeployment("");
    setTerrainLayout("");

    setMyFaction("");
    setMyDetachment("");
    setOppFaction("");
    setOppDetachment("");

    setMyArmyPdfUrl("");
    setOppArmyPdfUrl("");

    setMyListText("");
    setOppListText("");

    setMyScore(0);
    setOppScore(0);

    setNotes("");
    setPhotoLinksRaw("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // validations légères MVP (pas bloquantes sauf l’essentiel)
    if (!opponent.trim()) {
      alert("Adversaire requis.");
      return;
    }

    if (!isProbablyDriveUrl(myArmyPdfUrl) || !isProbablyDriveUrl(oppArmyPdfUrl)) {
      alert("Liens Drive invalides. Mets un lien Google Drive (drive.google.com) ou laisse vide.");
      return;
    }
    for (const u of photoUrls) {
      if (!isProbablyDriveUrl(u)) {
        alert("Un des liens photo n’est pas un lien Google Drive. Corrige-le ou supprime-le.");
        return;
      }
    }

    setSaving(true);
    try {
      const playedAt = new Date(playedAtLocal);
      if (Number.isNaN(playedAt.getTime())) {
        alert("Date invalide.");
        return;
      }

      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "40k",

          // v1 inputs
          playedAt: playedAt.toISOString(),
          opponent: opponent.trim(),
          points,

          missionPack: missionPack.trim() || null,
          primaryMission: primaryMission.trim() || null,
          deployment: deployment.trim() || null,
          terrainLayout: terrainLayout.trim() || null,

          myFaction: myFaction.trim() || null,
          myDetachment: myDetachment.trim() || null,
          oppFaction: oppFaction.trim() || null,
          oppDetachment: oppDetachment.trim() || null,

          // Drive links (optionnels)
          myArmyPdfUrl: myArmyPdfUrl.trim() || null,
          oppArmyPdfUrl: oppArmyPdfUrl.trim() || null,

          // texte enrichi (optionnels)
          myListText: myListText.trim() || null,
          oppListText: oppListText.trim() || null,

          // score + résultat
          myScore,
          oppScore,
          result: computedResult,

          // notes
          notes,

          // photos
          photoUrls,
        }),
      });

     if (!res.ok) {
  let msg = `Erreur serveur (${res.status})`;

  try {
    // 1️⃣ On tente JSON (API Next / Prisma renvoient souvent { error })
    const data = await res.json();
    if (typeof data === "string") {
      msg += `\n\n${data}`;
    } else if (data?.error) {
      msg += `\n\n${data.error}`;
    } else {
      msg += `\n\n${JSON.stringify(data, null, 2)}`;
    }
  } catch {
    try {
      // 2️⃣ Sinon texte brut
      const text = await res.text();
      if (text) msg += `\n\n${text}`;
    } catch {
      // 3️⃣ Rien à lire → message par défaut
      msg += `\n\nUne erreur inconnue est survenue.`;
    }
  }

  alert(msg);
  return;
}


      alert("Partie 40k enregistrée ✅");
      router.push("/40k/games");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Vignette + fumée (grimdark global) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-start px-6 py-14">
        <div className="w-full rounded-[28px] border border-white/10 bg-black/55 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/40k/games"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
            >
              ← Retour 40k
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/15 transition"
              >
                Reset
              </button>
              <div className="hidden sm:block text-[10px] tracking-[0.35em] text-white/35">
                ADD • GAME • LOG
              </div>
            </div>
          </div>

          {/* Title grimdark */}
          <div className="mt-6">
            <h1
              className="
                text-4xl sm:text-5xl font-extrabold
                tracking-[0.04em]
                text-white
                drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]
              "
            >
              <span className="block text-xs tracking-[0.45em] text-white/40 mb-2">
                WARTRACKER
              </span>
              AJOUTER UNE PARTIE • 40K
            </h1>

            <div className="mt-4 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="mt-3 text-sm text-white/60">
              Résultat détecté via score :{" "}
              <span className="font-semibold text-white">{resultLabel}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8 space-y-7">
            {/* SECTION 1 — Identification */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">IDENTIFICATION</div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Date</span>
                  <input
                    type="datetime-local"
                    value={playedAtLocal}
                    onChange={(e) => setPlayedAtLocal(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Format (points)</span>
                  <select
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value) as 1000 | 1500 | 2000)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  >
                    <option value={1000}>1000</option>
                    <option value={1500}>1500</option>
                    <option value={2000}>2000</option>
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-white/80">
                    Adversaire (nom / pseudo)
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="ex : Kévin / OrkBoss92"
                    required
                  />
                </label>
              </div>
            </section>

            {/* SECTION 2 — Mission & table */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.35em] text-white/35">MISSION & TABLE</div>
                <div className="text-[11px] text-white/40">
                  Référence : Leviathan – Take and Hold – Hammer and Anvil – GW Layout 4
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Pack de mission</span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={missionPack}
                    onChange={(e) => setMissionPack(e.target.value)}
                    placeholder="Leviathan / Pariah Nexus / Core"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Mission primaire</span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={primaryMission}
                    onChange={(e) => setPrimaryMission(e.target.value)}
                    placeholder="Take and Hold"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Déploiement</span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={deployment}
                    onChange={(e) => setDeployment(e.target.value)}
                    placeholder="Hammer and Anvil"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Layout terrain</span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={terrainLayout}
                    onChange={(e) => setTerrainLayout(e.target.value)}
                    placeholder="GW Layout 4 / Custom – Standard"
                  />
                </label>
              </div>
            </section>

            {/* SECTION 3 — Armées */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">ARMÉES</div>
              <div className="mt-2 text-xs text-white/45">
                Le PDF (Drive) fait foi si présent. Le texte est un enrichissement.
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Toi */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">TOI</div>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">Faction</span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={myFaction}
                      onChange={(e) => setMyFaction(e.target.value)}
                      placeholder="Ultramarines"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">Détachement</span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={myDetachment}
                      onChange={(e) => setMyDetachment(e.target.value)}
                      placeholder="Gladius Task Force"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">PDF liste (Drive)</span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={myArmyPdfUrl}
                      onChange={(e) => setMyArmyPdfUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                    />
                    <span className="text-[11px] text-white/45">
                      Astuce : partage “Toute personne ayant le lien” (lecture).
                    </span>
                    {myArmyPdfUrl.trim() ? (
                      <a
                        className="inline-block text-xs underline text-white/70 hover:text-white transition"
                        href={myArmyPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📄 Ouvrir le PDF
                      </a>
                    ) : (
                      <span className="block text-[11px] text-white/45">Optionnel</span>
                    )}
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      Texte enrichi (optionnel)
                    </span>
                    <textarea
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      rows={3}
                      value={myListText}
                      onChange={(e) => setMyListText(e.target.value)}
                      placeholder="Résumé / variantes / notes sur la liste…"
                    />
                  </label>
                </div>

                {/* Adversaire */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">ADVERSAIRE</div>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">Faction</span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={oppFaction}
                      onChange={(e) => setOppFaction(e.target.value)}
                      placeholder="Orks"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">Détachement (optionnel)</span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={oppDetachment}
                      onChange={(e) => setOppDetachment(e.target.value)}
                      placeholder="Bully Boyz"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">PDF liste (Drive)</span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={oppArmyPdfUrl}
                      onChange={(e) => setOppArmyPdfUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                    />
                    {oppArmyPdfUrl.trim() ? (
                      <a
                        className="inline-block text-xs underline text-white/70 hover:text-white transition"
                        href={oppArmyPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📄 Ouvrir le PDF
                      </a>
                    ) : (
                      <span className="block text-[11px] text-white/45">Optionnel</span>
                    )}
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      Texte enrichi (optionnel)
                    </span>
                    <textarea
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      rows={3}
                      value={oppListText}
                      onChange={(e) => setOppListText(e.target.value)}
                      placeholder="Résumé / menaces clés / plan adverse…"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* SECTION 4 — Score & résultat */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">SCORE & RÉSULTAT</div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Score final — toi</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={myScore}
                    onChange={(e) => setMyScore(Number(e.target.value || 0))}
                    min={0}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">Score final — adversaire</span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={oppScore}
                    onChange={(e) => setOppScore(Number(e.target.value || 0))}
                    min={0}
                  />
                </label>

                <div className="rounded-xl border border-white/10 bg-black/50 p-4 sm:col-span-2">
                  <div className="text-xs tracking-[0.25em] text-white/35">RÉSULTAT AUTO</div>
                  <div className="mt-2 text-lg font-bold text-white">
                    {computedResult === "D"
                      ? "⚖️ Égalité"
                      : computedResult === "W"
                      ? "✅ Victoire"
                      : "❌ Défaite"}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    Basé sur le score {myScore} - {oppScore} (enregistré aussi dans la DB)
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5 — Notes */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">NOTES / AMÉLIORATIONS</div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-white/80">Notes post-partie</span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Erreurs, idées à tester, rappels, ajustements..."
                />
              </label>
            </section>

            {/* SECTION 6 — Médias */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">MÉDIAS (DRIVE)</div>
              <div className="mt-2 text-xs text-white/45">
                Mets 1 lien par ligne (photos) ou un lien de dossier Drive partagé.
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Liens photos (Drive) — 1 par ligne
                </span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  rows={4}
                  value={photoLinksRaw}
                  onChange={(e) => setPhotoLinksRaw(e.target.value)}
                  placeholder={`https://drive.google.com/file/d/...\nhttps://drive.google.com/file/d/...`}
                />
              </label>

              {!!photoUrls.length && (
                <div className="mt-3 text-xs text-white/55">
                  {photoUrls.length} lien(s) détecté(s)
                </div>
              )}
            </section>

            <button
              type="submit"
              disabled={saving}
              className="
                mt-2 w-full rounded-xl
                border border-white/10
                bg-white/10 px-4 py-3
                font-semibold text-white
                shadow-[0_14px_40px_rgba(0,0,0,0.6)]
                transition hover:bg-white/15
                disabled:opacity-50
              "
            >
              {saving ? "Enregistrement..." : "Enregistrer la partie 40k"}
            </button>
          </form>

          <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="mt-4 text-center text-xs text-white/35">
            Record the battle. Learn the pattern.
          </div>
        </div>
      </div>
    </main>
  );
}
