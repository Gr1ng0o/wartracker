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
  return (
    u.startsWith("https://drive.google.com/") ||
    u.startsWith("https://docs.google.com/")
  );
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

  // ✅ Feuille de score (Drive) — PDF ou photo (optionnel)
  const [scoreSheetUrl, setScoreSheetUrl] = useState("");

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
    computedResult === "D"
      ? "Égalité"
      : computedResult === "W"
      ? "Victoire"
      : "Défaite";

  // 5) Notes (unique champ)
  const [notes, setNotes] = useState("");

  // 6) ✅ Photos par tour (Drive) — 1 lien par champ
  const [deploymentPhotoUrl, setDeploymentPhotoUrl] = useState("");
  const [t1PhotoUrl, setT1PhotoUrl] = useState("");
  const [t2PhotoUrl, setT2PhotoUrl] = useState("");
  const [t3PhotoUrl, setT3PhotoUrl] = useState("");
  const [t4PhotoUrl, setT4PhotoUrl] = useState("");
  const [t5PhotoUrl, setT5PhotoUrl] = useState("");

  // ✅ Notes par tour (timeline)
  const [deploymentNotes, setDeploymentNotes] = useState("");
  const [t1Notes, setT1Notes] = useState("");
  const [t2Notes, setT2Notes] = useState("");
  const [t3Notes, setT3Notes] = useState("");
  const [t4Notes, setT4Notes] = useState("");
  const [t5Notes, setT5Notes] = useState("");

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

    // ✅ reset feuille de score
    setScoreSheetUrl("");

    setMyListText("");
    setOppListText("");

    setMyScore(0);
    setOppScore(0);

    setNotes("");

    // ✅ reset photos par tour
    setDeploymentPhotoUrl("");
    setT1PhotoUrl("");
    setT2PhotoUrl("");
    setT3PhotoUrl("");
    setT4PhotoUrl("");
    setT5PhotoUrl("");

    // ✅ reset notes par tour
    setDeploymentNotes("");
    setT1Notes("");
    setT2Notes("");
    setT3Notes("");
    setT4Notes("");
    setT5Notes("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // validations légères MVP (pas bloquantes sauf l’essentiel)
    if (!opponent.trim()) {
      alert("Adversaire requis.");
      return;
    }

    if (!isProbablyDriveUrl(myArmyPdfUrl) || !isProbablyDriveUrl(oppArmyPdfUrl)) {
      alert(
        "Liens Drive invalides. Mets un lien Google Drive (drive.google.com) ou laisse vide."
      );
      return;
    }

    // ✅ validation feuille de score (Drive)
    if (!isProbablyDriveUrl(scoreSheetUrl)) {
      alert(
        "Lien de feuille de score invalide. Mets un lien Google Drive ou laisse vide."
      );
      return;
    }

    // ✅ validation photos par tour (Drive)
    const turnUrls = [
      deploymentPhotoUrl,
      t1PhotoUrl,
      t2PhotoUrl,
      t3PhotoUrl,
      t4PhotoUrl,
      t5PhotoUrl,
    ];

    for (const u of turnUrls) {
      if (!isProbablyDriveUrl(u)) {
        alert(
          "Un des liens (Déploiement / T1–T5) n’est pas un lien Google Drive. Corrige-le ou laisse vide."
        );
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

          // ✅ feuille de score (Drive)
          scoreSheetUrl: scoreSheetUrl.trim() || null,

          // texte enrichi (optionnels)
          myListText: myListText.trim() || null,
          oppListText: oppListText.trim() || null,

          // score + résultat
          myScore,
          oppScore,
          result: computedResult,

          // notes
          notes,

          // ✅ photos par tour (Drive)
          deploymentPhotoUrl: deploymentPhotoUrl.trim() || null,
          t1PhotoUrl: t1PhotoUrl.trim() || null,
          t2PhotoUrl: t2PhotoUrl.trim() || null,
          t3PhotoUrl: t3PhotoUrl.trim() || null,
          t4PhotoUrl: t4PhotoUrl.trim() || null,
          t5PhotoUrl: t5PhotoUrl.trim() || null,

          // ✅ notes par tour
          deploymentNotes: deploymentNotes.trim() || null,
          t1Notes: t1Notes.trim() || null,
          t2Notes: t2Notes.trim() || null,
          t3Notes: t3Notes.trim() || null,
          t4Notes: t4Notes.trim() || null,
          t5Notes: t5Notes.trim() || null,
        }),
      });

      if (!res.ok) {
        let msg = `Erreur serveur (${res.status})`;

        try {
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
            const text = await res.text();
            if (text) msg += `\n\n${text}`;
          } catch {
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
              <div className="text-xs tracking-[0.35em] text-white/35">
                IDENTIFICATION
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Date
                  </span>
                  <input
                    type="datetime-local"
                    value={playedAtLocal}
                    onChange={(e) => setPlayedAtLocal(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Format (points)
                  </span>
                  <select
                    value={points}
                    onChange={(e) =>
                      setPoints(Number(e.target.value) as 1000 | 1500 | 2000)
                    }
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
                <div className="text-xs tracking-[0.35em] text-white/35">
                  MISSION & TABLE
                </div>
                <div className="text-[11px] text-white/40">
                  Référence : Leviathan – Take and Hold – Hammer and Anvil – GW Layout 4
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Pack de mission
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={missionPack}
                    onChange={(e) => setMissionPack(e.target.value)}
                    placeholder="Leviathan / Pariah Nexus / Core"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Mission primaire
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={primaryMission}
                    onChange={(e) => setPrimaryMission(e.target.value)}
                    placeholder="Take and Hold"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Déploiement
                  </span>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={deployment}
                    onChange={(e) => setDeployment(e.target.value)}
                    placeholder="Hammer and Anvil"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Layout terrain
                  </span>
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
              <div className="text-xs tracking-[0.35em] text-white/35">
                ARMÉES
              </div>
              <div className="mt-2 text-xs text-white/45">
                Le PDF (Drive) fait foi si présent. Le texte est un enrichissement.
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Toi */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">
                    TOI
                  </div>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      Faction
                    </span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={myFaction}
                      onChange={(e) => setMyFaction(e.target.value)}
                      placeholder="Ultramarines"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      Détachement
                    </span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={myDetachment}
                      onChange={(e) => setMyDetachment(e.target.value)}
                      placeholder="Gladius Task Force"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      PDF liste (Drive)
                    </span>
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
                      <span className="block text-[11px] text-white/45">
                        Optionnel
                      </span>
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
                  <div className="text-xs tracking-[0.25em] text-white/35">
                    ADVERSAIRE
                  </div>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      Faction
                    </span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={oppFaction}
                      onChange={(e) => setOppFaction(e.target.value)}
                      placeholder="Orks"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      Détachement (optionnel)
                    </span>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                      value={oppDetachment}
                      onChange={(e) => setOppDetachment(e.target.value)}
                      placeholder="Bully Boyz"
                    />
                  </label>

                  <label className="mt-3 block space-y-2">
                    <span className="text-sm font-semibold text-white/80">
                      PDF liste (Drive)
                    </span>
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
                      <span className="block text-[11px] text-white/45">
                        Optionnel
                      </span>
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
              <div className="text-xs tracking-[0.35em] text-white/35">
                SCORE & RÉSULTAT
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Score final — toi
                  </span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={myScore}
                    onChange={(e) => setMyScore(Number(e.target.value || 0))}
                    min={0}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white/80">
                    Score final — adversaire
                  </span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    value={oppScore}
                    onChange={(e) => setOppScore(Number(e.target.value || 0))}
                    min={0}
                  />
                </label>

                <div className="rounded-xl border border-white/10 bg-black/50 p-4 sm:col-span-2">
                  <div className="text-xs tracking-[0.25em] text-white/35">
                    RÉSULTAT AUTO
                  </div>
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

            {/* SECTION 4bis — Feuille de score */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">
                FEUILLE DE SCORE (DRIVE)
              </div>
              <div className="mt-2 text-xs text-white/45">
                Lien Google Drive vers un PDF ou une photo de la feuille finale (optionnel).
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Lien feuille de score
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={scoreSheetUrl}
                  onChange={(e) => setScoreSheetUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
                {scoreSheetUrl.trim() ? (
                  <a
                    className="inline-block text-xs underline text-white/70 hover:text-white transition"
                    href={scoreSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    🧾 Ouvrir la feuille de score
                  </a>
                ) : (
                  <span className="block text-[11px] text-white/45">
                    Optionnel
                  </span>
                )}
              </label>
            </section>

            {/* SECTION 5 — Notes */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">
                NOTES / AMÉLIORATIONS
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Notes post-partie
                </span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Erreurs, idées à tester, rappels, ajustements..."
                />
              </label>
            </section>

            {/* ✅ SECTION 6 — Timeline (photos + notes par tour) */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="text-xs tracking-[0.35em] text-white/35">
                TIMELINE (TOUR PAR TOUR)
              </div>
              <div className="mt-2 text-xs text-white/45">
                Ajoute un lien Drive (photo) et tes remarques/ajustements par tour. Tout est optionnel.
              </div>

              <div className="mt-5 space-y-5">
                {/* Déploiement */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">DÉPLOIEMENT</div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Photo (Drive)</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        value={deploymentPhotoUrl}
                        onChange={(e) => setDeploymentPhotoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {deploymentPhotoUrl.trim() ? (
                        <a
                          className="inline-block text-xs underline text-white/70 hover:text-white transition"
                          href={deploymentPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📷 Ouvrir
                        </a>
                      ) : (
                        <span className="block text-[11px] text-white/45">Optionnel</span>
                      )}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Remarques / ajustements</span>
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        rows={3}
                        value={deploymentNotes}
                        onChange={(e) => setDeploymentNotes(e.target.value)}
                        placeholder="Plan de jeu, erreurs de déploiement, trade-offs..."
                      />
                    </label>
                  </div>
                </div>

                {/* T1 */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">T1</div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Photo (Drive)</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        value={t1PhotoUrl}
                        onChange={(e) => setT1PhotoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {t1PhotoUrl.trim() ? (
                        <a
                          className="inline-block text-xs underline text-white/70 hover:text-white transition"
                          href={t1PhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📷 Ouvrir
                        </a>
                      ) : (
                        <span className="block text-[11px] text-white/45">Optionnel</span>
                      )}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Remarques / ajustements</span>
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        rows={3}
                        value={t1Notes}
                        onChange={(e) => setT1Notes(e.target.value)}
                        placeholder="Séquences clés, erreurs, timings..."
                      />
                    </label>
                  </div>
                </div>

                {/* T2 */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">T2</div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Photo (Drive)</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        value={t2PhotoUrl}
                        onChange={(e) => setT2PhotoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {t2PhotoUrl.trim() ? (
                        <a
                          className="inline-block text-xs underline text-white/70 hover:text-white transition"
                          href={t2PhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📷 Ouvrir
                        </a>
                      ) : (
                        <span className="block text-[11px] text-white/45">Optionnel</span>
                      )}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Remarques / ajustements</span>
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        rows={3}
                        value={t2Notes}
                        onChange={(e) => setT2Notes(e.target.value)}
                        placeholder="Trades, scoring, priorités..."
                      />
                    </label>
                  </div>
                </div>

                {/* T3 */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">T3</div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Photo (Drive)</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        value={t3PhotoUrl}
                        onChange={(e) => setT3PhotoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {t3PhotoUrl.trim() ? (
                        <a
                          className="inline-block text-xs underline text-white/70 hover:text-white transition"
                          href={t3PhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📷 Ouvrir
                        </a>
                      ) : (
                        <span className="block text-[11px] text-white/45">Optionnel</span>
                      )}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Remarques / ajustements</span>
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        rows={3}
                        value={t3Notes}
                        onChange={(e) => setT3Notes(e.target.value)}
                        placeholder="Tempo, deny, pivot..."
                      />
                    </label>
                  </div>
                </div>

                {/* T4 */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">T4</div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Photo (Drive)</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        value={t4PhotoUrl}
                        onChange={(e) => setT4PhotoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {t4PhotoUrl.trim() ? (
                        <a
                          className="inline-block text-xs underline text-white/70 hover:text-white transition"
                          href={t4PhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📷 Ouvrir
                        </a>
                      ) : (
                        <span className="block text-[11px] text-white/45">Optionnel</span>
                      )}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Remarques / ajustements</span>
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        rows={3}
                        value={t4Notes}
                        onChange={(e) => setT4Notes(e.target.value)}
                        placeholder="Clutch plays, gestion ressources..."
                      />
                    </label>
                  </div>
                </div>

                {/* T5 */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <div className="text-xs tracking-[0.25em] text-white/35">T5</div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Photo (Drive)</span>
                      <input
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        value={t5PhotoUrl}
                        onChange={(e) => setT5PhotoUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      {t5PhotoUrl.trim() ? (
                        <a
                          className="inline-block text-xs underline text-white/70 hover:text-white transition"
                          href={t5PhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📷 Ouvrir
                        </a>
                      ) : (
                        <span className="block text-[11px] text-white/45">Optionnel</span>
                      )}
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-white/80">Remarques / ajustements</span>
                      <textarea
                        className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                        rows={3}
                        value={t5Notes}
                        onChange={(e) => setT5Notes(e.target.value)}
                        placeholder="Fin de game, erreurs de closing..."
                      />
                    </label>
                  </div>
                </div>
              </div>
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
