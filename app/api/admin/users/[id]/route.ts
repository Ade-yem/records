import { prisma } from "@/lib/db";
import {
  HttpError,
  ok,
  parseJson,
  parseParam,
  requireRole,
  withErrorHandling,
} from "@/lib/api/http";
import { updateUserSchema, uuidSchema } from "@/lib/api/schemas";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — enable/disable access or change role (Admin only)
export const PATCH = withErrorHandling(async (req: Request, { params }: Ctx) => {
  const currentUser = await requireRole("admin");
  const { id: rawId } = await params;
  const userId = parseParam(rawId, uuidSchema, "id");
  const body = await parseJson(req, updateUserSchema);

  const isSelf = userId === currentUser.id;

  if (body.action === "disable" || body.action === "enable") {
    if (isSelf) {
      throw new HttpError(400, "Cannot disable or enable your own account");
    }
    if (body.action === "disable") {
      await prisma.$executeRaw`
        UPDATE neon_auth.user
        SET banned = true, "banReason" = 'Disabled by admin'
        WHERE id = ${userId}::uuid
      `;
      return ok({ message: "User access disabled" });
    }
    await prisma.$executeRaw`
      UPDATE neon_auth.user
      SET banned = false, "banReason" = NULL, "banExpires" = NULL
      WHERE id = ${userId}::uuid
    `;
    return ok({ message: "User access enabled" });
  }

  // set_role
  if (isSelf && body.role !== "admin") {
    throw new HttpError(400, "Cannot downgrade your own admin account");
  }
  await prisma.$executeRaw`
    UPDATE neon_auth.user SET role = ${body.role} WHERE id = ${userId}::uuid
  `;
  return ok({ message: `Role updated to ${body.role}` });
});
