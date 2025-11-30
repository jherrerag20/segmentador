// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL env var is not set");
}

// Usamos globalThis para evitar crear varios clientes/pools en dev (Hot Reload)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

// Reutilizamos el pool si ya existe
const pgPool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
  });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Importante: usamos el adapter para trabajar sin motores Rust (engineType = "client")
    adapter: new PrismaPg(pgPool),
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pgPool;
}