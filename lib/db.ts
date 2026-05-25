import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Required for Neon serverless driver to establish WebSocket connections in Node.js
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// In production each serverless instance gets its own short-lived client, so
// caching globally is fine. In dev we deliberately *don't* cache: HMR keeps
// the module-level binding alive across reloads, but the underlying Neon
// WebSocket dies when Neon's compute scales to zero, leaving the cached
// client holding a dead socket that hangs the next request with ETIMEDOUT.
export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ??= createPrismaClient())
    : createPrismaClient();
