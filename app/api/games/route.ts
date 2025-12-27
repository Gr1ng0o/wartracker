import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();

  const game = await prisma.game.create({
    data: {
      gameType: body.gameType,
      build: body.build,
      opponent: body.opponent,
      first: Boolean(body.first),
      result: body.result,
      score: body.score === "" || body.score == null ? null : Number(body.score),
      tag1: body.tag1 || null,
      tag2: body.tag2 || null,
      notes: body.notes || null,
    },
  });

  return Response.json(game);
}

export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(games);
}