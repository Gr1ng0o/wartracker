import AddGameForm from "../../_components/add-game-form";
import { prisma } from "@/lib/prisma";

export default async function Form() {
    const savedRosters = await prisma.armyRoster.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, name: true, faction: true },
    });
    return <AddGameForm gameType="40k" savedRosters={savedRosters} />;
}
