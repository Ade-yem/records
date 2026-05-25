import { prisma } from "@/lib/db";
import { dispatchPushNotification } from "@/lib/push";
import {
  noContent,
  ok,
  parseJson,
  parseParam,
  requireRole,
  withErrorHandling,
} from "@/lib/api/http";
import { cuidSchema, updateProductSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/products/[id] — update product details (admin or price_manager only)
export const PATCH = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("admin", "price_manager");
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");
  const patch = await parseJson(req, updateProductSchema);

  const updated = await prisma.product.update({ where: { id }, data: patch });

  const displayUnit = updated.unitName || "pcs";
  const displayBulk = updated.bulkName || "carton";
  dispatchPushNotification(
    {
      title: "⚡ Price List Updated",
      body: `${updated.name}: ₦${Number(updated.priceUnit).toLocaleString()}/${displayUnit} (Bulk: ₦${Number(updated.priceBulk).toLocaleString()}/${displayBulk})`,
      url: "/products",
    },
    user.id
  );

  return ok(updated);
});

// DELETE /api/products/[id] — remove product from price list (Admin only)
export const DELETE = withErrorHandling(async (_req: Request, { params }: Ctx) => {
  const user = await requireRole("admin");
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");

  const deleted = await prisma.product.delete({ where: { id } });

  dispatchPushNotification(
    {
      title: "🗑️ Product Deleted",
      body: `${deleted.name} was removed from the price list.`,
      url: "/products",
    },
    user.id
  );

  return noContent();
});
