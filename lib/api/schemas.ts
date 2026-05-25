import { z } from "zod";

// Accepts cuid/cuid2; safe character set only (no slashes, spaces, etc.)
export const cuidSchema = z.string().regex(/^[a-z0-9]{20,40}$/i, "Invalid id");
export const uuidSchema = z.string().uuid("Invalid id");

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
export type Pagination = z.infer<typeof paginationSchema>;

// ─── Debt ───────────────────────────────────────────────────────────────────

export const debtListQuerySchema = paginationSchema.extend({
  name: z.string().trim().max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
});

export const createDebtSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  totalDebt: z.number().positive().finite().max(1_000_000_000),
  notes: z.string().trim().max(2000).optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive().finite().max(1_000_000_000),
  note: z.string().trim().max(2000).optional(),
});

// ─── Inventory ──────────────────────────────────────────────────────────────

export const stockStatusSchema = z.enum(["LOW_STOCK", "OUT_OF_STOCK", "RESTOCKED"]);

export const inventoryListQuerySchema = paginationSchema.extend({
  all: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const createInventorySchema = z.object({
  itemName: z.string().trim().min(1).max(200),
  status: z.enum(["LOW_STOCK", "OUT_OF_STOCK"]).optional().default("LOW_STOCK"),
  quantity: z.number().int().min(0).max(1_000_000).optional().default(0),
});

export const updateInventorySchema = z.object({
  status: stockStatusSchema,
  quantity: z.number().int().min(0).max(1_000_000).optional(),
});

// ─── Products ───────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  priceUnit: z.number().nonnegative().finite().max(1_000_000_000),
  unitName: z.string().trim().max(50).optional(),
  priceBulk: z.number().nonnegative().finite().max(1_000_000_000),
  bulkName: z.string().trim().max(50).optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    priceUnit: z.number().nonnegative().finite().max(1_000_000_000).optional(),
    unitName: z.string().trim().max(50).optional(),
    priceBulk: z.number().nonnegative().finite().max(1_000_000_000).optional(),
    bulkName: z.string().trim().max(50).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

// ─── Admin / Users ──────────────────────────────────────────────────────────

export const userRoleSchema = z.enum(["admin", "price_manager", "staff"]);

export const updateUserSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("disable") }),
  z.object({ action: z.literal("set_role"), role: userRoleSchema }),
]);

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
  name: z.string().trim().min(1).max(200),
  role: userRoleSchema.optional().default("staff"),
});

// ─── Suggest ────────────────────────────────────────────────────────────────

export const suggestQuerySchema = z.object({
  type: z.enum(["products", "customers"]),
  q: z.string().trim().min(1).max(100),
});

// ─── Push ───────────────────────────────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2000),
    keys: z.object({
      p256dh: z.string().min(1).max(500),
      auth: z.string().min(1).max(500),
    }),
  }),
});
