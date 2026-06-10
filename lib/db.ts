import path from "node:path";
import { PrismaClient } from "./generated/prisma/client";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
