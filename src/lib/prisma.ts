// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

// Pool nativo de `pg` usando DATABASE_URL de Vercel/local
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

// Adapter para Prisma 7 (driver adapters)
const adapter = new PrismaPg(pool)

// Cliente único reutilizable
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}