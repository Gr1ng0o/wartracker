import RosterLibrary from "./roster-library";
export const metadata = { title: "Listes ALN et statistiques d’unités" };
export default async function Page({ searchParams }: {
    searchParams: Promise<{
        gameId?: string;
    }>;
}) { return <RosterLibrary initialGameId={(await searchParams).gameId || ""}/>; }
