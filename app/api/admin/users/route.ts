import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { HttpError, ok, parseJson, parseQuery, requireRole, withErrorHandling } from "@/lib/api/http";
import { createUserSchema, paginationSchema, userRoleSchema } from "@/lib/api/schemas";

type RawUser = { id: string; email: string; name: string | null; role: string | null; banned: boolean | null };

// GET /api/admin/users — list all users (Admin only, paginated by name)
export const GET = withErrorHandling(async (req: Request) => {
  await requireRole("admin");
  const { cursor, limit } = parseQuery(req.url, paginationSchema);

  // Cursor is the last-seen name; we filter strictly greater than it for the next page.
  const whereClause = cursor ? Prisma.sql`WHERE name > ${cursor}` : Prisma.empty;
  const users = await prisma.$queryRaw<RawUser[]>(Prisma.sql`
    SELECT id, email, name, role, banned
    FROM neon_auth.user
    ${whereClause}
    ORDER BY name ASC
    LIMIT ${limit + 1}
  `);

  const hasMore = users.length > limit;
  const page = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? page[page.length - 1].name : null;

  const items = page.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: userRoleSchema.catch("staff").parse(u.role),
    banned: !!u.banned,
  }));

  return ok({ items, nextCursor });
});

// POST /api/admin/users — create a new user (Admin only)
export const POST = withErrorHandling(async (req: Request) => {
  await requireRole("admin");
  const { email, password, name, role } = await parseJson(req, createUserSchema);

  const { error: signupError } = await auth.signUp.email({ email, password, name });
  if (signupError) {
    throw new HttpError(400, signupError.message || "Failed to create user account");
  }

  await prisma.$executeRaw`
    UPDATE neon_auth.user SET role = ${role} WHERE email = ${email}
  `;

  return ok({ message: "User account created successfully" }, { status: 201 });
});
