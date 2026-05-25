import { ok, requireUser, withErrorHandling } from "@/lib/api/http";

// GET /api/me — returns current user info
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return ok({
    id: user.id,
    email: user.email,
    name: (user as { name?: string | null }).name ?? null,
    image: (user as { image?: string | null }).image ?? null,
    role: user.role,
  });
});
