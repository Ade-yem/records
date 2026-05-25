import { prisma } from "@/lib/db";
import { dispatchPushNotification } from "@/lib/push";
import { ok, parseJson, parseQuery, requireUser, withErrorHandling } from "@/lib/api/http";
import { createDebtSchema, debtListQuerySchema } from "@/lib/api/schemas";

// GET /api/debt — list debt entries (paginated)
export const GET = withErrorHandling(async (req: Request) => {
  await requireUser();

  const { name, date, cursor, limit } = parseQuery(req.url, debtListQuerySchema);

  const where: Record<string, unknown> = {};
  if (name) where.customerName = { contains: name, mode: "insensitive" };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  const entries = await prisma.debtEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { payments: { orderBy: { paidAt: "desc" } } },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const creatorIds = [...new Set(page.map((e) => e.createdBy))];
  const creators =
    creatorIds.length > 0
      ? await prisma.$queryRaw<{ id: string; name: string }[]>`
          SELECT id, name FROM neon_auth.user WHERE id = ANY(${creatorIds})`
      : [];
  const creatorMap = Object.fromEntries(creators.map((c) => [c.id, c.name]));

  const items = page.map((e) => ({
    ...e,
    creatorName: creatorMap[e.createdBy] || "Unknown",
  }));

  return ok({ items, nextCursor });
});

// POST /api/debt — create a new debt entry
export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { customerName, totalDebt, notes } = await parseJson(req, createDebtSchema);

  const entry = await prisma.debtEntry.create({
    data: {
      customerName,
      totalDebt,
      amountPaid: 0,
      balance: totalDebt,
      notes,
      createdBy: user.id,
    },
  });

  dispatchPushNotification(
    {
      title: "💳 New Debt Entry",
      body: `${customerName} owes ₦${totalDebt.toLocaleString()}`,
      url: "/ledger",
    },
    user.id
  );

  return ok(entry, { status: 201 });
});
