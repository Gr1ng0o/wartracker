import Link from "next/link";
import Image from "next/image";

function GrimLink({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="
        group relative overflow-hidden rounded-2xl
        border border-white/10
        bg-black/55 backdrop-blur-md
        px-6 py-5
        shadow-[0_18px_60px_rgba(0,0,0,0.75)]
        transition
        hover:border-amber-200/25
        hover:bg-black/65
      "
    >
      {/* grain + highlight */}
      <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,180,80,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute -inset-24 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle,rgba(255,170,70,0.12),transparent_60%)]" />

      {/* bevel subtle */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/60" />

      <div className="relative flex items-center gap-4">
        <div
          className="
            grid h-11 w-11 place-items-center rounded-xl
            bg-white/5 ring-1 ring-white/10
            text-xl
            group-hover:ring-amber-200/20
            transition
          "
          aria-hidden
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-wide text-white/95">
            {title}
          </div>
          <div className="text-xs text-white/55">{subtitle}</div>
        </div>

        <div className="ml-auto text-white/40 group-hover:text-amber-200/40 transition">
          →
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Vignette + fumée (grimdark global) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center px-6 py-14">
        {/* Panel central unique */}
        <div className="w-full rounded-[28px] border border-white/10 bg-black/55 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {/* top thin ornament */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="text-[10px] tracking-[0.35em] text-white/35">
              RECORD • REVIEW • IMPROVE
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Logo (sans rectangle autour) */}
          <div className="flex justify-center">
            <Image
              src="/branding/wartracker-logo.png"
              alt="WarTracker"
              width={1200}
              height={600}
              priority
              className="
                w-full max-w-[560px] select-none
                drop-shadow-[0_0_26px_rgba(255,170,70,0.25)]
                [mask-image:radial-gradient(circle,black_55%,transparent_100%)]
                [-webkit-mask-image:radial-gradient(circle,black_55%,transparent_100%)]
              "
            />
          </div>

          {/* Subtitle */}
          <p className="mt-5 text-center text-sm text-white/60">
            Un tracker grimdark pour tes parties : stats, notes, listes d’armées,
            photos et fiche de scores.
          </p>

          {/* CTA blocks */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <GrimLink
              href="/40k"
              title="Warhammer 40k"
              subtitle="Parties • listes • photos • score sheet"
              icon="⚔️"
            />
            <GrimLink
              href="/fab"
              title="Flesh and Blood"
              subtitle="Games • notes • decks (soon)"
              icon="🩸"
            />
          </div>

          {/* bottom ornament */}
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="mt-4 text-center text-xs text-white/35">
            Built for the long war.
          </div>
        </div>
      </div>
    </main>
  );
}
