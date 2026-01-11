"use client";

function openExternal(url: string) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function DriveAction({
  label,
  url,
  kind = "GOOGLE DRIVE",
}: {
  label: string;
  url: string;
  kind?: string;
}) {
  return (
    <div
      className="
        grid grid-cols-1 gap-2
        sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center
        rounded-xl border border-white/10 bg-white/5
        px-3 py-2
      "
    >
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.35em] text-white/35">
          {kind}
        </div>
        <div className="mt-1 min-w-0 truncate text-sm text-white/85" title={url}>
          {label}
        </div>
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
