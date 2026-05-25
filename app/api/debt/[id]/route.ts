import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { dispatchPushNotification } from "@/lib/push";
import {
  HttpError,
  noContent,
  ok,
  parseJson,
  parseParam,
  requireRole,
  requireUser,
  withErrorHandling,
} from "@/lib/api/http";
import { cuidSchema, recordPaymentSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/debt/[id] — record a payment
export const PATCH = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = parseParam(rawId, cuidSchema, "id");
  const { amount, note } = await parseJson(req, recordPaymentSchema);

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
