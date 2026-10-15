import { prisma } from "./prisma";
import type { GameStore } from "./game-api";

export const gameStore: GameStore = {
  create: (data) => prisma.game.create({ data, select: { id: true } }),
  update: (id, data) =>
    prisma.game.update({ where: { id }, data, select: { id: true } }),
  delete: (id) => prisma.game.delete({ where: { id }, select: { id: true } }),
  createMany: (data) => prisma.game.createMany({ data }),
};
