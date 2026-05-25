import { prisma } from "@/lib/db";
import { ok, parseJson, requireUser, withErrorHandling } from "@/lib/api/http";
import { pushSubscribeSchema } from "@/lib/api/schemas";

export const POST = withErrorHandling(async (req: Request) => {
  const user = await requireUser();
  const { subscription } = await parseJson(req, pushSubscribeSchema);

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId: user.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return ok({ success: true });
});
