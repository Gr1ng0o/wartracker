"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditNotes({
  id,
  initialNotes,
}: {
  id: string;
  initialNotes: string | null;
}) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert("Erreur lors de la mise à jour\n" + txt);
        return;
      }

      setEditing(false);
      router.refresh(); // re-fetch server data
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-gray-200">Notes</div>

        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
          >
            ✏️ Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(initialNotes ?? "");
                setEditing(false);
              }}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
          {initialNotes?.trim() ? initialNotes : "—"}
        </div>
      ) : (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder="Tes notes de partie…"
        />
      )}
    </div>
  );
}
