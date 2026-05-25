import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, parseJson, requireUser, withErrorHandling } from "@/lib/api/http";

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(2000).optional(),
});

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { endpoint } = await parseJson(req, unsubscribeSchema);

  await prisma.pushSubscription.deleteMany({
    where: endpoint ? { userId: user.id, endpoint } : { userId: user.id },
  });

  return ok({ success: true });
});
