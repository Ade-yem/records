import { prisma } from "@/lib/db";
import { StockStatus } from "@/generated/prisma/client";
import { dispatchPushNotification } from "@/lib/push";
import { ok, parseJson, parseQuery, requireUser, withErrorHandling } from "@/lib/api/http";
import { createInventorySchema, inventoryListQuerySchema } from "@/lib/api/schemas";

// GET /api/inventory — list shortage items (paginated)
export const GET = withErrorHandling(async (req: Request) => {
  await requireUser();
  const { all, cursor, limit } = parseQuery(req.url, inventoryListQuerySchema);

  const where = all ? {} : { NOT: { status: StockStatus.RESTOCKED } };

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  const reporterIds = [...new Set(page.map((i) => i.reportedBy))];
  const reporters =
    reporterIds.length > 0
      ? await prisma.$queryRaw<{ id: string; name: string }[]>`
          SELECT id, name FROM neon_auth.user WHERE id = ANY(${reporterIds})`
      : [];
  const reporterMap = Object.fromEntries(reporters.map((r) => [r.id, r.name]));

  const data = page.map((i) => ({
    ...i,
    reporterName: reporterMap[i.reportedBy] || "Unknown",
  }));

  return ok({ items: data, nextCursor });
});

// POST /api/inventory — report a shortage
export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { itemName, status, quantity } = await parseJson(req, createInventorySchema);

  const item = await prisma.inventoryItem.create({
    data: { itemName, status, quantity, reportedBy: user.id },
  });

  const statusLabel = status === "OUT_OF_STOCK" ? "Out of Stock" : "Low Stock";
  dispatchPushNotification(
    {
      title: status === "OUT_OF_STOCK" ? "🚨 Out of Stock Alert" : "⚠️ Low Stock Alert",
      body: `${itemName} reported as ${statusLabel} (${quantity} left).`,
      url: "/inventory",
    },
    user.id
  );

  return ok(item, { status: 201 });
});
