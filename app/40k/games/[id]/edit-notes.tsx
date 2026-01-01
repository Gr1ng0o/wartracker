"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditNotes({
  id,
  initialNotes,
}: {
  id: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        setMsg("Erreur lors de la sauvegarde.");
        return;
      }

      setMsg("Sauvegardé ✓");
      router.refresh();
    } catch {
      setMsg("Erreur réseau.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 1200);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes post-game, axes d’amélioration, erreurs, idées…"
        className="min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/30 focus:border-amber-200/30 focus:ring-1 focus:ring-amber-200/15"
      />

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-black/75 disabled:opacity-50"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>

        <div className="text-xs text-white/45">
          {msg ? <span className="text-white/75">{msg}</span> : null}
        </div>
      </div>
    </div>
  );
}
