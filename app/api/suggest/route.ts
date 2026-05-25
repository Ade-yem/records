import { prisma } from "@/lib/db";
import { ok, parseQuery, requireUser, withErrorHandling } from "@/lib/api/http";
import { suggestQuerySchema } from "@/lib/api/schemas";

// GET /api/suggest — autocomplete lookup for customer names or products
export const GET = withErrorHandling(async (req: Request) => {
  await requireUser();
  const { type, q } = parseQuery(req.url, suggestQuerySchema);

  if (type === "products") {
    const products = await prisma.product.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
      select: {
        id: true,
        name: true,
        priceUnit: true,
        unitName: true,
        priceBulk: true,
        bulkName: true,
      },
    });
    return ok(products);
  }

  const entries = await prisma.debtEntry.findMany({
    where: { customerName: { contains: q, mode: "insensitive" } },
    take: 10,
    select: { customerName: true },
    distinct: ["customerName"],
  });
  return ok(entries.map((e) => e.customerName));
});
