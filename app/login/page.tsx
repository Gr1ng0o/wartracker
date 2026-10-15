import { getAdminKey, safeReturnPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const configured = Boolean(getAdminKey());
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-white">
      <div className="rounded-3xl border border-white/10 bg-black/75 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">WarTracker</h1>
        <p className="mt-3 text-white/70">
          Connecte-toi pour retrouver tes parties.
        </p>
        {!configured ? (
          <p role="alert" className="mt-6 text-amber-200">
            L’accès privé doit être configuré par le propriétaire avant de
            pouvoir se connecter.
          </p>
        ) : (
          <form
            action="/api/auth/login"
            method="post"
            className="mt-6 space-y-4"
          >
            <input
              type="hidden"
              name="next"
              value={safeReturnPath(params.next)}
            />
            <label className="block text-sm">
              Clé d’accès
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={32}
                maxLength={512}
                className="mt-2 w-full rounded-xl border border-white/20 bg-black/60 p-3"
              />
            </label>
            {params.error ? (
              <p role="alert" className="text-sm text-red-200">
                Connexion impossible. Vérifie ta clé d’accès et réessaie.
              </p>
            ) : null}
            <button className="w-full rounded-xl bg-amber-100 p-3 font-semibold text-black">
              Se connecter
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
