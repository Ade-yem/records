import { prisma } from "@/lib/db";
import { dispatchPushNotification } from "@/lib/push";
import {
  noContent,
  ok,
  parseJson,
  parseParam,
  requireRole,
  requireUser,
  withErrorHandling,
} from "@/lib/api/http";
import { cuidSchema, updateInventorySchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/inventory/[id] — update status.
// Intentionally open to any authenticated user: floor staff need to mark
// items as RESTOCKED without admin involvement. Audit trail lives in
// updatedAt + push notifications.
export const PATCH = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");
  const { status, quantity } = await parseJson(req, updateInventorySchema);

  const data: Record<string, unknown> = { status };
  if (quantity !== undefined) data.quantity = quantity;
  else if (status === "RESTOCKED") data.quantity = 0;

  const item = await prisma.inventoryItem.update({ where: { id }, data });

  const statusLabel =
    status === "OUT_OF_STOCK" ? "Out of Stock" : status === "LOW_STOCK" ? "Low Stock" : "Restocked";
  dispatchPushNotification(
    {
      title: `📦 Stock Updated: ${item.itemName}`,
      body: `Status changed to ${statusLabel}${status !== "RESTOCKED" ? ` (${item.quantity} left)` : ""}.`,
      url: "/inventory",
    },
    user.id
  );

  return ok(item);
});

// DELETE /api/inventory/[id] — remove item (Admin only)
export const DELETE = withErrorHandling(async (_req: Request, { params }: Ctx) => {
  await requireRole("admin");
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");

  await prisma.inventoryItem.delete({ where: { id } });
  return noContent();
});
