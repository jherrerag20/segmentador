// prisma.config.mjs
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // si no tienes seed, puedes borrar esta línea
    // seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // aquí va DIRECTO el url, no anidado en "db" ni nada raro
    url: process.env.DATABASE_URL,
    // si quisieras usar shadow DB:
    // shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});