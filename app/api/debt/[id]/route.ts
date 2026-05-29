import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { dispatchPushNotification } from "@/lib/push";
import {
  HttpError,
  noContent,
  ok,
  parseParam,
  requireRole,
  requireUser,
  withErrorHandling,
} from "@/lib/api/http";
import { cuidSchema, editDebtSchema, recordPaymentSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/debt/[id] — record a payment or edit the debt entry
export const PATCH = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }

  // Discriminate by action field
  const action = (body as { action?: string })?.action;

  if (action === "edit") {
    await requireRole("admin", "price_manager");
    const data = editDebtSchema.safeParse(body);
    if (!data.success) throw new HttpError(400, "Invalid request body", "VALIDATION");
    const { customerName, totalDebt, notes } = data.data;

    const updated = await prisma.$transaction(async (tx) => {
      const debt = await tx.debtEntry.findUnique({ where: { id } });
      if (!debt) throw new HttpError(404, "Debt entry not found");

      const newTotal = totalDebt !== undefined ? new Prisma.Decimal(totalDebt) : debt.totalDebt;
      const newBalance = Prisma.Decimal.max(newTotal.minus(debt.amountPaid), new Prisma.Decimal(0));

      return tx.debtEntry.update({
        where: { id },
        data: {
          ...(customerName !== undefined ? { customerName } : {}),
          ...(totalDebt !== undefined ? { totalDebt: newTotal, balance: newBalance } : {}),
          ...(notes !== undefined ? { notes: notes ?? null } : {}),
        },
      });
    });

    return ok(updated);
  }

  // Default: record payment
  const data = recordPaymentSchema.safeParse(body);
  if (!data.success) throw new HttpError(400, "Invalid request body", "VALIDATION");
  const { amount, note } = data.data;

  const result = await prisma.$transaction(async (tx) => {
    const debt = await tx.debtEntry.findUnique({ where: { id } });
    if (!debt) throw new HttpError(404, "Debt entry not found");

    const paymentDecimal = new Prisma.Decimal(amount);
    const newAmountPaid = debt.amountPaid.plus(paymentDecimal);
    const newBalance = debt.totalDebt.minus(newAmountPaid);

    if (newBalance.lt(0)) throw new HttpError(400, "Payment exceeds remaining balance");

    await tx.payment.create({
      data: { debtId: id, amount, note, paidBy: user.id },
    });

    return tx.debtEntry.update({
      where: { id },
      data: { amountPaid: newAmountPaid, balance: newBalance },
    });
  });

  dispatchPushNotification(
    {
      title: "💵 Payment Recorded",
      body: `${result.customerName} paid ₦${Number(amount).toLocaleString()} (Balance: ₦${Number(result.balance).toLocaleString()}).`,
      url: "/ledger",
    },
    user.id
  );

  return ok(result);
});

// DELETE /api/debt/[id] — delete an entry (Admin only)
export const DELETE = withErrorHandling(async (_req: Request, { params }: Ctx) => {
  await requireRole("admin");
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");

  await prisma.debtEntry.delete({ where: { id } });
  return noContent();
});
