import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
if (!process.argv.includes("--confirm-add-draft-column")) throw new Error("Confirmation requise pour ajouter le stockage de brouillon.");
const prisma = new PrismaClient();
try {
    const sql = await readFile(new URL("../prisma/migrations/20261122000000_game_drafts/migration.sql", import.meta.url), "utf8");
    await prisma.$executeRawUnsafe(sql);
    console.log("Colonne de brouillon disponible. Les données existantes sont conservées.");
} finally { await prisma.$disconnect(); }
