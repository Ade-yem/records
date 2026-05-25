import { prisma } from "@/lib/db";
import { dispatchPushNotification } from "@/lib/push";
import { ok, parseJson, parseQuery, requireRole, requireUser, withErrorHandling } from "@/lib/api/http";
import { createProductSchema, paginationSchema } from "@/lib/api/schemas";

// GET /api/products — list all products (paginated)
export const GET = withErrorHandling(async (req: Request) => {
  await requireUser();
  const { cursor, limit } = parseQuery(req.url, paginationSchema);

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = products.length > limit;
  const items = hasMore ? products.slice(0, limit) : products;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return ok({ items, nextCursor });
});

// POST /api/products — create a new product (admin or price_manager only)
export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireRole("admin", "price_manager");
  const { name, priceUnit, unitName, priceBulk, bulkName } = await parseJson(
    req,
    createProductSchema
  );

  const product = await prisma.product.create({
    data: {
      name,
      priceUnit,
      unitName: unitName || "pcs",
      priceBulk,
      bulkName: bulkName || "carton",
      createdBy: user.id,
    },
  });

  dispatchPushNotification(
    {
      title: "🏷️ New Price Added",
      body: `${name}: ₦${priceUnit.toLocaleString()}/${unitName || "pcs"} (Bulk: ₦${priceBulk.toLocaleString()}/${bulkName || "carton"})`,
      url: "/products",
    },
    user.id
  );

  return ok(product, { status: 201 });
});
