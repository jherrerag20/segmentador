// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  // 👇 Cast a any porque las types de esta versión de Prisma
  // todavía no exponen bien la propiedad `adapter`,
  // pero en runtime funciona sin problema.
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ["error", "warn"],
  } as any);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}