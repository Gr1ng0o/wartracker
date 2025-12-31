import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

// Evite de recréer PrismaClient à chaque HMR en dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
