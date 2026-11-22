import { Prisma } from "@prisma/client";
import { unitKey, type AlnUnit } from "./aln-parser";

export function rosterUnits(units: AlnUnit[]) {
    return units.map(unit => ({
        ...unit,
        unitKey: unitKey(unit.name),
        profile: unit.profile ?? Prisma.DbNull,
    }));
}
