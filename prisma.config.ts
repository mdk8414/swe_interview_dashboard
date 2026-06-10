import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Use an absolute path so the SQLite URL resolves identically whether Prisma is
// invoked from the project root (CLI) or from the Next.js runtime (server).
const dbPath = path.resolve(__dirname, "prisma", "dev.db");
process.env.DATABASE_URL = `file:${dbPath}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
